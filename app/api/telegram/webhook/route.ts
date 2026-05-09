import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
      debugLog.push(`Contributor ID from message: "${contributorId}"`)
      debugLog.push(`Contributor ID length: ${contributorId.length}`)

      if (!contributorId) {
        debugLog.push('ERROR: Empty contributor ID')
        console.log('DEBUG:', debugLog.join('\n'))
        await sendMessage(chatId, 'Invalid link. Please use the connect button from your Zivana dashboard.')
        return NextResponse.json({ ok: true })
      }

      // Step 4 — Create Supabase client
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

      if (!serviceRoleKey || !supabaseUrl) {
        debugLog.push(`ERROR: Missing env vars. URL: ${!!supabaseUrl}, KEY: ${!!serviceRoleKey}`)
        console.log('DEBUG:', debugLog.join('\n'))
        await sendMessage(chatId, 'Configuration error. Please contact the core team.')
        return NextResponse.json({ ok: true })
      }

      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      })

      debugLog.push('Supabase client created successfully')

      // Step 5 — First check if contributor exists
      const { data: existing, error: fetchError } = await supabase
        .from('contributors')
        .select('id, email, telegram_chat_id')
        .eq('id', contributorId)
        .single()

      debugLog.push(`Fetch existing contributor - data: ${JSON.stringify(existing)}`)
      debugLog.push(`Fetch existing contributor - error: ${JSON.stringify(fetchError)}`)

      if (fetchError || !existing) {
        debugLog.push('ERROR: Contributor not found or fetch failed')
        console.log('DEBUG:', debugLog.join('\n'))
        await sendMessage(chatId, `No contributor found with ID: ${contributorId.slice(0, 8)}... Please use the connect button from your dashboard.`)
        return NextResponse.json({ ok: true })
      }

      // Step 6 — Update the contributor
      const { data: updated, error: updateError } = await supabase
        .from('contributors')
        .update({
          telegram_chat_id: chatId,
          notification_telegram: true,
        })
        .eq('id', contributorId)
        .select()

      debugLog.push(`Update result - data: ${JSON.stringify(updated)}`)
      debugLog.push(`Update result - error: ${JSON.stringify(updateError)}`)

      console.log('DEBUG:', debugLog.join('\n'))

      if (updateError) {
        await sendMessage(chatId, `Update failed: ${updateError.message} (code: ${updateError.code})`)
        return NextResponse.json({ ok: true })
      }

      await sendMessage(
        chatId,
        `Your Telegram account is now connected to Zivana Protocol.\n\nYou will receive deadline reminders here for tasks you claim. You can disconnect at any time from your dashboard profile settings.`
      )

      return NextResponse.json({ ok: true })
    }

    if (text === '/stop') {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })

      await supabase
        .from('contributors')
        .update({ telegram_chat_id: null, notification_telegram: false })
        .eq('telegram_chat_id', chatId)

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