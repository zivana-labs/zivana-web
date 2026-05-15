import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Origin check
    const origin = request.headers.get('origin')
    const allowedOrigins = [
      'https://zivana.network',
      'http://localhost:3000',
      'https://zivana-web-git-develop-abdulrahman-abdulbasit-adiguns-projects.vercel.app'
    ]
    if (!origin || !allowedOrigins.includes(origin)) {
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

    if (process.env.NODE_ENV !== 'development') {
      // Only log in development
    } else {
      console.log('Email send attempt to:', to)
      console.log('BREVO_API_KEY_REST exists:', !!process.env.BREVO_API_KEY_REST)
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
      const responseText = await response.text()
      if (process.env.NODE_ENV === 'development') {
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