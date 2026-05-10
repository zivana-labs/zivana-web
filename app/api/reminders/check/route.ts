import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY!
)

// Reminder schedule per complexity
function getReminderWindows(deadlineDays: number) {
  if (deadlineDays === 3) {
    return [
      { label: '24 hours', ms: 24 * 60 * 60 * 1000 },
      { label: '6 hours',  ms: 6  * 60 * 60 * 1000 },
    ]
  }
  if (deadlineDays === 6) {
    return [
      { label: '3 days',  ms: 3  * 24 * 60 * 60 * 1000 },
      { label: '24 hours', ms: 24 * 60 * 60 * 1000 },
      { label: '6 hours',  ms: 6  * 60 * 60 * 1000 },
    ]
  }
  // Large — 12 days
  return [
    { label: '7 days',  ms: 7  * 24 * 60 * 60 * 1000 },
    { label: '3 days',  ms: 3  * 24 * 60 * 60 * 1000 },
    { label: '24 hours', ms: 24 * 60 * 60 * 1000 },
    { label: '6 hours',  ms: 6  * 60 * 60 * 1000 },
  ]
}

function isWithinWindow(timeToDeadlineMs: number, windowMs: number) {
  // Check if we are within a 1 hour buffer of the reminder window
  const buffer = 60 * 60 * 1000
  return timeToDeadlineMs <= windowMs + buffer && timeToDeadlineMs >= windowMs - buffer
}

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Fetch all assigned tasks with contributor details
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        category,
        complexity,
        deadline_days,
        deadline_at,
        extended_deadline_at,
        extension_granted,
        assigned_to,
        contributors!tasks_assigned_to_fkey (
          id,
          name,
          email,
          notification_email,
          notification_telegram,
          telegram_chat_id
        )
      `)
      .eq('status', 'assigned')
      .not('deadline_at', 'is', null)

    if (error) {
      console.error('Reminder fetch error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No active tasks' })
    }

    let sent = 0

    for (const task of tasks) {
      const contributor = Array.isArray(task.contributors)
        ? task.contributors[0]
        : task.contributors

      if (!contributor) continue

      const effectiveDeadline = task.extension_granted && task.extended_deadline_at
        ? new Date(task.extended_deadline_at)
        : new Date(task.deadline_at)

      const timeToDeadlineMs = effectiveDeadline.getTime() - now.getTime()

      // Skip if already overdue beyond the extension window
      const maxLateMs = (task.deadline_days === 3 ? 1 : task.deadline_days === 6 ? 2 : 3) * 24 * 60 * 60 * 1000
      if (timeToDeadlineMs < -maxLateMs) continue

      // Check if overdue — send overdue notice once
      if (timeToDeadlineMs < 0 && timeToDeadlineMs > -60 * 60 * 1000) {
        await sendReminders(contributor, task, effectiveDeadline, 'overdue')
        sent++
        continue
      }

      // Check reminder windows
      const windows = getReminderWindows(task.deadline_days ?? 3)
      for (const window of windows) {
        if (isWithinWindow(timeToDeadlineMs, window.ms)) {
          await sendReminders(contributor, task, effectiveDeadline, window.label)
          sent++
          break
        }
      }
    }

    return NextResponse.json({ sent, checked: tasks.length })

  } catch (err) {
    console.error('Reminder job error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function sendReminders(
  contributor: any,
  task: any,
  deadline: Date,
  window: string
) {
  const deadlineStr = deadline.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos'
  })

  const isOverdue = window === 'overdue'
  const subject = isOverdue
    ? `Your task is overdue — ${task.title}`
    : `Deadline reminder — ${window} left on your task`

  const body = isOverdue
    ? `Your deadline has passed for the task "${task.title}". Submit your work now to avoid further point deductions. Log in to your dashboard at zivana.network/contribute/dashboard to submit.`
    : `You have ${window} left to submit your work for the task "${task.title}". Deadline: ${deadlineStr} (Lagos time). Log in to your dashboard at zivana.network/contribute/dashboard to submit.`

  const promises = []

  if (contributor.notification_email && contributor.email) {
    promises.push(sendEmail(contributor.email, contributor.name, subject, body))
  }

  if (contributor.notification_telegram && contributor.telegram_chat_id) {
    promises.push(sendTelegram(contributor.telegram_chat_id, subject, body))
  }

  await Promise.allSettled(promises)
}

async function sendEmail(
  email: string,
  name: string,
  subject: string,
  body: string
) {
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: { name: 'Zivana Protocol', email: 'hello@zivana.network' },
      to: [{ email, name }],
      subject,
      textContent: body,
      htmlContent: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0D0B14;padding:40px 32px;border-radius:16px;">
          <h1 style="font-size:20px;font-weight:600;color:#E8E6F0;margin:0 0 12px;letter-spacing:-0.02em;">
            ${subject}
          </h1>
          <p style="font-size:15px;color:#7B6FA8;line-height:1.7;margin:0 0 28px;">
            ${body.replace('zivana.network/contribute/dashboard', '<a href="https://zivana.network/contribute/dashboard" style="color:#A78BFA;">your dashboard</a>')}
          </p>
          <a href="https://zivana.network/contribute/dashboard"
            style="display:inline-block;background:linear-gradient(135deg,#A78BFA,#6D28D9,#4C1D95);color:white;padding:12px 24px;border-radius:9999px;font-size:14px;font-weight:500;text-decoration:none;">
            Go to dashboard
          </a>
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid #1C1730;">
            <p style="font-size:11px;color:#4A3E7A;margin:0;">Zivana Protocol — zivana.network</p>
            <p style="font-size:11px;color:#4A3E7A;margin:4px 0 0;">You are receiving this because you claimed a task on the contributor portal.</p>
          </div>
        </div>
      `,
    }),
  })
}

async function sendTelegram(chatId: string, subject: string, body: string) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `*${subject}*\n\n${body}`,
      parse_mode: 'Markdown',
    }),
  })
}