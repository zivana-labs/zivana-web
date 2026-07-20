import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service client for verifying the caller's identity and core-team membership.
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Require an authenticated, active core-team member — not a spoofable Origin header.
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.slice('Bearer '.length)

    const { data: { user }, error: userError } = await serviceClient.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: actor } = await serviceClient
      .from('core_team')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!actor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { to, name, subject, htmlContent } = body

    // Basic input validation
    if (!to || !name || !subject || !htmlContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Only allow sending to valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json({ error: 'Invalid recipient email' }, { status: 400 })
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY_REST!,
      },
      body: JSON.stringify({
        sender: { name: 'Zivana Network', email: 'hello@zivana.network' },
        to: [{ email: to, name }],
        subject,
        htmlContent,
      }),
    })

    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        const responseText = await response.text()
        console.log('Brevo response status:', response.status)
        console.log('Brevo response body:', responseText)
      }
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    if (process.env.NODE_ENV === 'development') {
      console.error('Email send error:', message)
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
