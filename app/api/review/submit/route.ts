import { NextResponse, type NextRequest } from 'next/server'
import { createHmac } from 'node:crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      contribution_id,
      contributor_id,
      title,
      description,
      category,
      complexity,
      evidence_url,
      submission_count,
      submitted_at,
      task_brief,
    } = body

    // Validate required fields
    if (!contribution_id || !contributor_id || !title || !description || !category || !complexity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const reviewServiceUrl = process.env.REVIEW_SERVICE_URL
    const webhookSecret = process.env.REVIEW_SERVICE_SECRET

    if (!reviewServiceUrl || !webhookSecret) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Review service not configured')
      }
      return NextResponse.json({ error: 'Review service not configured' }, { status: 503 })
    }

    const payload = {
      contribution_id,
      contributor_id,
      title,
      description,
      category,
      complexity,
      evidence_url: evidence_url || null,
      submission_count: submission_count ?? 1,
      submitted_at: submitted_at ?? new Date().toISOString(),
      task_brief: task_brief || null,
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

    const result = await response.json()
    return NextResponse.json(result)

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    if (process.env.NODE_ENV === 'development') {
      console.error('Review submit error:', message)
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}