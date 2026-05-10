import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const debugLog: string[] = []

  try {
    // Step 1 — Log all environment variables availability
    debugLog.push(`SUPABASE_URL exists: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    debugLog.push(`SUPABASE_URL value: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    debugLog.push(`SERVICE_ROLE_KEY exists: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`)
    debugLog.push(`SERVICE_ROLE_KEY prefix: ${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) ?? 'UNDEFINED'}`)
    debugLog.push(`BOT_TOKEN exists: ${!!process.env.TELEGRAM_BOT_TOKEN}`)
    debugLog.push(`BOT_TOKEN prefix: ${process.env.TELEGRAM_BOT_TOKEN?.slice(0, 10) ?? 'UNDEFINED'}`)

    // Step 2 — Parse request body
    const rawBody = await request.text()
    debugLog.push(`Raw body length: ${rawBody.length}`)
    debugLog.push(`Raw body: ${rawBody.slice(0, 500)}`)

    const body = JSON.parse(rawBody)
    const message = body?.message
    debugLog.push(`Message exists: ${!!message}`)
    debugLog.push(`Message text: ${message?.text ?? 'NO TEXT'}`)
    debugLog.push(`Chat ID: ${message?.chat?.id ?? 'NO CHAT ID'}`)

    if (!message) {
      console.log('DEBUG:', debugLog.join('\n'))
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat?.id?.toString()
    const text = message.text?.trim() ?? ''

    // Step 3 — Handle /start command
    if (text.startsWith('/start ')) {
      const contributorId = text.replace('/start ', '').trim()
      debugLog.push(`Contributor ID: "${contributorId}"`)

      if (!contributorId) {
        await sendMessage(chatId, 'Invalid link. Please use the connect button from your Zivana dashboard.')
        console.log('DEBUG:', debugLog.join('\n'))
        return NextResponse.json({ ok: true })
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

      debugLog.push(`URL exists: ${!!supabaseUrl}`)
      debugLog.push(`Key exists: ${!!serviceKey}`)
      debugLog.push(`Key prefix: ${serviceKey?.slice(0, 10)}`)

      // Use direct REST API call with both headers explicitly set
      const fetchResp = await fetch(
        `${supabaseUrl}/rest/v1/contributors?id=eq.${contributorId}&select=id,email`,
        {
          method: 'GET',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const fetchData = await fetchResp.json()
      debugLog.push(`Fetch status: ${fetchResp.status}`)
      debugLog.push(`Fetch data: ${JSON.stringify(fetchData)}`)

      if (fetchResp.status !== 200 || !fetchData || fetchData.length === 0) {
        console.log('DEBUG:', debugLog.join('\n'))
        await sendMessage(chatId, `No contributor found. Please use the connect button from your dashboard.`)
        return NextResponse.json({ ok: true })
      }

      // Update using direct REST API
      const updateResp = await fetch(
        `${supabaseUrl}/rest/v1/contributors?id=eq.${contributorId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            telegram_chat_id: chatId,
            notification_telegram: true,
          }),
        }
      )

      const updateData = await updateResp.json()
      debugLog.push(`Update status: ${updateResp.status}`)
      debugLog.push(`Update data: ${JSON.stringify(updateData)}`)
      console.log('DEBUG:', debugLog.join('\n'))

      if (updateResp.status !== 200) {
        await sendMessage(chatId, `Failed to link account. Error: ${JSON.stringify(updateData)}`)
        return NextResponse.json({ ok: true })
      }

      await sendMessage(
        chatId,
        `Your Telegram account is now connected to Zivana Protocol.\n\nYou will receive deadline reminders here for tasks you claim. You can disconnect at any time from your dashboard profile settings.`
      )

      return NextResponse.json({ ok: true })
    }

    if (text === '/stop') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

      await fetch(
        `${supabaseUrl}/rest/v1/contributors?telegram_chat_id=eq.${chatId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ telegram_chat_id: null, notification_telegram: false }),
        }
      )

      await sendMessage(chatId, 'Your Telegram account has been disconnected from Zivana Protocol.')
      return NextResponse.json({ ok: true })
    }

    debugLog.push(`Unhandled message text: "${text}"`)
    console.log('DEBUG:', debugLog.join('\n'))
    await sendMessage(chatId, 'Use the connect button from your Zivana dashboard to link your account.')
    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('Telegram webhook FATAL error:', err?.message, err?.stack)
    return NextResponse.json({ ok: true })
  }
}

async function sendMessage(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}