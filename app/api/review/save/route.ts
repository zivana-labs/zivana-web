import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Verify the HMAC-SHA256 signature the review service attaches to its callback.
 * The signature is computed over the RAW request body with REVIEW_SERVICE_SECRET
 * and sent as `X-Zivana-Signature: sha256=<hex>`. Comparison is constant-time.
 */
function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false
  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = new Uint8Array(Buffer.from(header))
  const b = new Uint8Array(Buffer.from(expected))
  // timingSafeEqual throws on length mismatch — guard first, still constant-time per-branch
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.REVIEW_SERVICE_SECRET
    if (!webhookSecret) {
      if (process.env.NODE_ENV === 'development') console.error('REVIEW_SERVICE_SECRET not configured')
      return NextResponse.json({ error: 'Service not configured' }, { status: 503 })
    }

    // Read the raw body first — signature must be verified against the exact bytes.
    const rawBody = await request.text()
    const signature = request.headers.get('X-Zivana-Signature')

    if (!verifySignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    let body: Record<string, unknown>
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const {
      contribution_id,
      review_decision,
      review_score,
      review_feedback,
    } = body as {
      contribution_id?: string
      review_decision?: string
      review_score?: number
      review_feedback?: unknown
    }

    if (!contribution_id || !review_decision) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY!
    )

    // Security-first status mapping
    // Any critical, high, or medium security issue overrides AI approval
    let newStatus: string

    if (review_decision === 'human_required') {
      newStatus = 'submitted' // Escalated to human review
    } else if (review_decision === 'rejected') {
      newStatus = 'rejected'
    } else if (review_decision === 'approved') {
      // Check for security issues in code audit
      const codeAudit = (body as { code_audit?: { security_issues?: { severity: string }[]; has_critical_security_issue?: boolean } }).code_audit
      const securityIssues = codeAudit?.security_issues ?? []

      const hasCritical = securityIssues.some((i: { severity: string }) => i.severity === 'critical')
      const hasHigh = securityIssues.some((i: { severity: string }) => i.severity === 'high')
      const hasMedium = securityIssues.some((i: { severity: string }) => i.severity === 'medium')
      const hasLow = securityIssues.some((i: { severity: string }) => i.severity === 'low')
      const hasCriticalFlag = codeAudit?.has_critical_security_issue === true

      if (hasCriticalFlag || hasCritical || hasHigh || hasMedium) {
        // Critical, high, or medium — reject regardless of score
        newStatus = 'rejected'
      } else if (hasLow) {
        // Low severity — escalate to human review
        newStatus = 'submitted'
      } else {
        // No security issues and score >= 80 — AI approved
        newStatus = 'ai_approved'
      }
    } else {
      newStatus = 'submitted'
    }

    const updatePayload: Record<string, unknown> = {
      review_decision,
      review_score,
      review_feedback,
      status: newStatus,
    }

    const { error } = await supabase
      .from('contributions')
      .update(updatePayload)
      .eq('id', contribution_id)

    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Save review error:', error)
      return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (process.env.NODE_ENV === 'development') console.error('Save review route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
