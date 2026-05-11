import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, name, subject, htmlContent } = body

    console.log('Email send attempt to:', to)
    console.log('BREVO_API_KEY_REST exists:', !!process.env.BREVO_API_KEY_REST)
    console.log('Email send attempt to:', to)
    console.log('BREVO_API_KEY_REST exists:', !!process.env.BREVO_API_KEY_REST)

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

    const responseText = await response.text()
    console.log('Brevo response status:', response.status)
    console.log('Brevo response body:', responseText)

    if (!response.ok) {
      return NextResponse.json({ error: responseText }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Email send error:', err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}