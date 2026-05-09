import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // Create client inside handler so env vars are always available
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  )

  try {
    const body = await request.json()
    const message = body?.message
    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat?.id?.toString()
    const text = message.text?.trim() ?? ''

    if (text.startsWith('/start ')) {
      const contributorId = text.replace('/start ', '').trim()

      if (!contributorId) {
        await sendMessage(chatId, 'Invalid link. Please use the connect button from your Zivana dashboard.')
        return NextResponse.json({ ok: true })
      }

      // Log for debugging
      console.log('Linking contributor:', contributorId, 'to chat:', chatId)
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

      const { data, error } = await supabase
        .from('contributors')
        .update({
          telegram_chat_id: chatId,
          notification_telegram: true,
        })
        .eq('id', contributorId)
        .select()

      console.log('Update result:', { data, error })

      if (error) {
        console.error('Supabase update error:', error.message, error.code, error.details)
        await sendMessage(chatId, `Something went wrong linking your account. Error: ${error.message}`)
        return NextResponse.json({ ok: true })
      }

      if (!data || data.length === 0) {
        await sendMessage(chatId, 'No contributor found with that ID. Please use the connect button from your dashboard.')
        return NextResponse.json({ ok: true })
      }

      await sendMessage(
        chatId,
        `Your Telegram account is now connected to Zivana Protocol.\n\nYou will receive deadline reminders here for tasks you claim. You can disconnect at any time from your dashboard profile settings.`
      )

      return NextResponse.json({ ok: true })
    }

    if (text === '/stop') {
      await supabase
        .from('contributors')
        .update({
          telegram_chat_id: null,
          notification_telegram: false,
        })
        .eq('telegram_chat_id', chatId)

      await sendMessage(chatId, 'Your Telegram account has been disconnected from Zivana Protocol. You can reconnect at any time from your dashboard.')
      return NextResponse.json({ ok: true })
    }

    await sendMessage(chatId, 'Use the connect button from your Zivana dashboard to link your account.')
    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Telegram webhook error:', err)
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