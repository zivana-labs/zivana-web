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

    const {
      contribution_id,
      review_decision,
      review_score,
      review_feedback,
    } = await request.json()

    if (!contribution_id || !review_decision) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY!
    )

    const newStatus = review_decision === 'approved'
      ? 'ai_approved'
      : review_decision === 'human_required'
      ? 'submitted'
      : 'rejected'

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