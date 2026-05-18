import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') ?? ''
    const allowed = [
      'https://zivana.network',
      'http://localhost:3000',
    ]
    if (!allowed.some(o => origin.startsWith(o))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      contribution_id,
      review_decision,
      review_score,
      review_feedback,
    } = body

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
      const codeAudit = body.code_audit
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