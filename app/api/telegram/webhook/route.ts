import { Bot, webhookCallback } from 'grammy'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY!
)

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)

bot.command('start', async (ctx) => {
  const chatId = ctx.message?.chat.id.toString()
  const text = ctx.message?.text ?? ''
  const contributorId = text.replace('/start', '').trim()

  console.log('Start command received')
  console.log('Chat ID:', chatId)
  console.log('Contributor ID:', contributorId)
  console.log('Service key exists:', !!process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY)
  console.log('Service key prefix:', process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10))

  if (!contributorId) {
    await ctx.reply('Invalid link. Please use the connect button from your Zivana dashboard.')
    return
  }

  const { data: existing, error: fetchError } = await supabase
    .from('contributors')
    .select('id, email')
    .eq('id', contributorId)
    .single()

  console.log('Fetch result:', { existing, fetchError })

  if (fetchError || !existing) {
    await ctx.reply('No contributor found. Please use the connect button from your dashboard.')
    return
  }

  const { data, error: updateError } = await supabase
    .from('contributors')
    .update({
      telegram_chat_id: chatId,
      notification_telegram: true,
    })
    .eq('id', contributorId)
    .select()

  console.log('Update result:', { data, updateError })

  if (updateError) {
    await ctx.reply(`Failed to link account: ${updateError.message}`)
    return
  }

  await ctx.reply(
    `Your Telegram account is now connected to Zivana Protocol.\n\nYou will receive deadline reminders here for tasks you claim. You can disconnect at any time from your dashboard profile settings.`
  )
})

bot.command('stop', async (ctx) => {
  const chatId = ctx.message?.chat.id.toString()

  await supabase
    .from('contributors')
    .update({ telegram_chat_id: null, notification_telegram: false })
    .eq('telegram_chat_id', chatId)

  await ctx.reply('Your Telegram account has been disconnected from Zivana Protocol.')
})

export const dynamic = 'force-dynamic'

const handleUpdate = webhookCallback(bot, 'std/http')

export async function POST(request: NextRequest) {
  return await handleUpdate(request)
}