import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'node:crypto'

type ReviewResult = {
  decision?: string
  overall_score?: number
  feedback?: unknown
  code_audit?: {
    security_issues?: { severity: string }[]
    has_critical_security_issue?: boolean
  }
}

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // This route writes review decisions with the service role key further down,
    // so it must know exactly who is calling and that they own the contribution
    // in question — otherwise it's the same unauthenticated-write class as the
    // original /api/review/save finding, just moved to a different endpoint.
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.slice('Bearer '.length)

    const { data: { user }, error: userError } = await serviceClient.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: callerContributor } = await serviceClient
      .from('contributors')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!callerContributor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const {
      contribution_id,
      title,
      description,
      category,
      complexity,
      evidence_url,
      submission_count,
      submitted_at,
      task_brief,
      previous_feedback,
    } = body

    if (!contribution_id || !title || !description || !category || !complexity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // contributor_id is never taken from the client — it's the caller's own id,
    // established from their session above. This also doubles as the ownership
    // check: the contribution must belong to this contributor and still be in
    // its pre-review state, or the request is rejected.
    const { data: contribution } = await serviceClient
      .from('contributions')
      .select('id, contributor_id, status')
      .eq('id', contribution_id)
      .single()

    if (!contribution || contribution.contributor_id !== callerContributor.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (contribution.status !== 'submitted') {
      return NextResponse.json({ error: 'Contribution is not awaiting review' }, { status: 409 })
    }

    const reviewServiceUrl = process.env.REVIEW_SERVICE_URL
    const webhookSecret = process.env.REVIEW_SERVICE_SECRET

    if (!reviewServiceUrl || !webhookSecret) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Review service not configured')
      }
      return NextResponse.json({ error: 'Review service not configured' }, { status: 503 })
    }

    const payload: Record<string, unknown> = {
      contribution_id,
      contributor_id: callerContributor.id,
      title,
      description,
      category,
      complexity,
      evidence_url: evidence_url || null,
      submission_count: submission_count ?? 1,
      submitted_at: submitted_at ?? new Date().toISOString(),
      task_brief: task_brief || null,
      ...(previous_feedback ? { previous_feedback } : {}),
    }

    // Sign the payload with HMAC-SHA256
    const bodyString = JSON.stringify(payload)
    const signature = 'sha256=' + createHmac('sha256', webhookSecret)
      .update(bodyString)
      .digest('hex')

    const response = await fetch(`${reviewServiceUrl}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Zivana-Signature': signature,
      },
      body: bodyString,
    })

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      return NextResponse.json(
        { error: 'Rate limit exceeded', retry_after: retryAfter },
        { status: 429 }
      )
    }

    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Review service error:', response.status)
      }
      return NextResponse.json({ error: 'Review service error' }, { status: 502 })
    }

    const result: ReviewResult = await response.json()

    // Persist the review decision here, server-side, using the trusted response we
    // just received directly from the review service. This used to be a second round
    // trip where the browser called /api/review/save on its own with the result — an
    // unauthenticated write path (audit finding C-1). That route now requires an HMAC
    // signature the browser can't produce, so persistence must happen in this request
    // instead. A persistence failure here must stay non-fatal to the contributor, same
    // as the old fire-and-forget browser call was.
    try {
      await persistReviewResult(contribution_id, result)
    } catch (persistErr) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to persist review result:', persistErr)
      }
    }

    return NextResponse.json(result)

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    if (process.env.NODE_ENV === 'development') {
      console.error('Review submit error:', message)
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function persistReviewResult(contributionId: string, result: ReviewResult): Promise<void> {
  const reviewDecision = result?.decision
  if (!reviewDecision) return

  // Security-first status mapping — identical to the logic /api/review/save used to
  // apply. Any critical, high, or medium security issue overrides AI approval.
  let newStatus: string

  if (reviewDecision === 'human_required') {
    newStatus = 'submitted' // Escalated to human review
  } else if (reviewDecision === 'rejected') {
    newStatus = 'rejected'
  } else if (reviewDecision === 'approved') {
    const securityIssues = result.code_audit?.security_issues ?? []

    const hasCritical = securityIssues.some(i => i.severity === 'critical')
    const hasHigh = securityIssues.some(i => i.severity === 'high')
    const hasMedium = securityIssues.some(i => i.severity === 'medium')
    const hasLow = securityIssues.some(i => i.severity === 'low')
    const hasCriticalFlag = result.code_audit?.has_critical_security_issue === true

    if (hasCriticalFlag || hasCritical || hasHigh || hasMedium) {
      newStatus = 'rejected'
    } else if (hasLow) {
      newStatus = 'submitted'
    } else {
      newStatus = 'ai_approved'
    }
  } else {
    newStatus = 'submitted'
  }

  await serviceClient
    .from('contributions')
    .update({
      review_decision: reviewDecision,
      review_score: result.overall_score,
      review_feedback: result.feedback,
      status: newStatus,
    })
    .eq('id', contributionId)
}
