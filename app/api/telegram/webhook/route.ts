import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for server-side writes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = body?.message
    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat?.id?.toString()
    const text = message.text?.trim() ?? ''

    // Expect the contributor to send their unique code
    // Format: /start CONTRIBUTOR_ID
    if (text.startsWith('/start ')) {
      const contributorId = text.replace('/start ', '').trim()

      if (!contributorId) {
        await sendMessage(chatId, 'Invalid link. Please use the connect button from your Zivana dashboard.')
        return NextResponse.json({ ok: true })
      }

      // Link the telegram chat ID to the contributor
      const { error } = await supabase
        .from('contributors')
        .update({
          telegram_chat_id: chatId,
          notification_telegram: true,
        })
        .eq('id', contributorId)

      if (error) {
        await sendMessage(chatId, 'Something went wrong linking your account. Please try again from your dashboard.')
        return NextResponse.json({ ok: true })
      }

      await sendMessage(
        chatId,
        `Your Telegram account is now connected to Zivana Protocol.\n\nYou will receive deadline reminders here for tasks you claim. You can disconnect at any time from your dashboard profile settings.`
      )

      return NextResponse.json({ ok: true })
    }

    // Handle /stop to disconnect
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

    // Default response for any other message
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