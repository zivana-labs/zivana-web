import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    // Get the bearer token from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify the token and get the user
    const { data: { user }, error: userError } = await serviceClient.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the actor's core_team record
    const { data: actor } = await serviceClient
      .from('core_team')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!actor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { action, target_type, target_id, target_label, metadata } = body

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    const { error } = await serviceClient
      .from('admin_audit_log')
      .insert({
        actor_id:     actor.id,
        actor_name:   actor.name,
        action,
        target_type:  target_type ?? null,
        target_id:    target_id ?? null,
        target_label: target_label ?? null,
        metadata:     metadata ?? null,
      })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}