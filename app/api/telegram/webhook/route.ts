import { Bot, webhookCallback } from 'grammy'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)

bot.command('start', async (ctx) => {
  const chatId = ctx.message?.chat.id.toString()
  const text = ctx.message?.text ?? ''
  const contributorId = text.replace('/start', '').trim()

  if (!contributorId) {
    await ctx.reply('Invalid link. Please use the connect button from your Zivana dashboard.')
    return
  }

  // Validate UUID format before hitting the database
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(contributorId)) {
    await ctx.reply('Invalid link. Please use the connect button from your Zivana dashboard.')
    return
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceKey || !supabaseUrl) {
    await ctx.reply('Configuration error. Please contact the core team.')
    return
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const { data: existing, error: fetchError } = await supabase
    .from('contributors')
    .select('id, email')
    .eq('id', contributorId)
    .single()

  if (fetchError || !existing) {
    await ctx.reply('No contributor found. Please use the connect button from your dashboard.')
    return
  }

  const { error: updateError } = await supabase
    .from('contributors')
    .update({
      telegram_chat_id: chatId,
      notification_telegram: true,
    })
    .eq('id', contributorId)

  if (updateError) {
    await ctx.reply('Failed to link account. Please try again from your dashboard.')
    return
  }

  await ctx.reply(
    `Your Telegram account is now connected to Zivana Protocol.\n\nYou will receive deadline reminders here for tasks you claim. You can disconnect at any time from your dashboard profile settings.`
  )
})

bot.command('stop', async (ctx) => {
  const chatId = ctx.message?.chat.id.toString()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  await supabase
    .from('contributors')
    .update({ telegram_chat_id: null, notification_telegram: false })
    .eq('telegram_chat_id', chatId)

  await ctx.reply('Your Telegram account has been disconnected from Zivana Protocol.')
})

export const dynamic = 'force-dynamic'

const handleUpdate = webhookCallback(bot, 'std/http')

export async function POST(request: NextRequest) {
  // Verify Telegram webhook secret token
  const secretToken = request.headers.get('x-telegram-bot-api-secret-token')
  if (!secretToken || secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('Forbidden', { status: 403 })
  }

  try {
    return await handleUpdate(request)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (process.env.NODE_ENV === 'development') {
      console.error('Telegram webhook error:', message)
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  }
}