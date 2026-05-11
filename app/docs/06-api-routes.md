# API Routes

This document covers every server-side API route in the Zivana web project — what each route does, its request format, response format, authentication requirements, and error handling.

All API routes live under `app/api/` and use the Next.js App Router route handler pattern with `NextRequest` and `NextResponse`.

---

## `/api/email/send`

**File:** `app/api/email/send/route.ts`
**Method:** POST
**Auth:** None — internal use only, called from client components within the application

### Purpose

Sends a transactional email via the Brevo REST API. All emails sent by the application go through this route. Calling the Brevo API directly from the browser is blocked by CORS and ad blockers — this route acts as a server-side proxy.

### Request body

```json
{
  "to": "recipient@example.com",
  "name": "Recipient Name",
  "subject": "Email subject line",
  "htmlContent": "<div>HTML email body</div>"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `to` | string | Yes | Recipient email address |
| `name` | string | Yes | Recipient display name |
| `subject` | string | Yes | Email subject line |
| `htmlContent` | string | Yes | Full HTML body of the email |

### Response

**Success (200):**
```json
{ "success": true }
```

**Error (500):**
```json
{ "error": "Brevo error response body as string" }
```

### Environment variables required

| Variable | Description |
|---|---|
| `BREVO_API_KEY_REST` | Brevo REST API key starting with `xkeysib-` — not the SMTP key |

### Sender

All emails are sent from:
- **Name:** Zivana Network
- **Email:** hello@zivana.network

This matches the sender name used by Supabase for magic link emails to avoid contributor confusion.

### Current email types sent through this route

| Trigger | Subject | Recipient |
|---|---|---|
| Contributor approved | Your Zivana contributor account is approved | Approved contributor |
| Task directly assigned | You have been assigned a task — {task title} | Assigned contributor |

### Notes

- The route logs the recipient email and whether the API key exists on every call — useful for debugging but remove sensitive details before adding new log lines
- Brevo returns HTTP 201 on successful email submission, not 200 — the route treats any 2xx as success
- The `BREVO_API_KEY_REST` must be the REST API key not the SMTP relay key — they look similar but are different credentials

---

## `/api/reminders/check`

**File:** `app/api/reminders/check/route.ts`
**Method:** GET
**Auth:** Bearer token via `Authorization` header — must match `CRON_SECRET` environment variable

### Purpose

Checks all assigned tasks for upcoming deadlines and sends reminder notifications to contributors via email and Telegram based on their notification preferences. Called automatically once per day at 8am UTC by Vercel cron.

### Authentication

Every request must include:

Authorization: Bearer <CRON_SECRET>

Requests without a valid token receive a 401 response immediately. This prevents external actors from triggering mass notifications.

### Reminder schedule logic

For each assigned task the route calculates the time remaining until the effective deadline (`extended_deadline_at` if an extension was granted, otherwise `deadline_at`). It then checks whether the current time falls within a 1-hour buffer of any scheduled reminder window:

**Small tasks (3 day deadline):**
- 24 hours before deadline
- 6 hours before deadline
- At deadline (0 hours): overdue notice

**Medium tasks (6 day deadline):**
- 3 days before deadline
- 24 hours before deadline
- 6 hours before deadline
- At deadline: overdue notice

**Large tasks (12 day deadline):**
- 7 days before deadline
- 3 days before deadline
- 24 hours before deadline
- 6 hours before deadline
- At deadline: overdue notice

Tasks that are overdue beyond the maximum extension window are skipped entirely.

### Notification channels

For each task that matches a reminder window the route sends notifications to whichever channels the contributor has enabled:

- If `contributors.notification_email = true` — sends email via Brevo
- If `contributors.notification_telegram = true` AND `contributors.telegram_chat_id` is set — sends Telegram message

Both channels are attempted in parallel using `Promise.allSettled` so a failure on one channel does not prevent the other from sending.

### Request

No request body required. The route is called by Vercel cron automatically. To test manually:

```bash
curl -X GET https://zivana.network/api/reminders/check \
  -H "Authorization: Bearer your-cron-secret"
```

### Response

**Success (200):**
```json
{
  "sent": 3,
  "checked": 12
}
```

| Field | Description |
|---|---|
| `sent` | Number of reminder notifications dispatched |
| `checked` | Total number of assigned tasks checked |

**Unauthorized (401):**
```json
{ "error": "Unauthorized" }
```

**Error (500):**
```json
{ "error": "Internal error" }
```

### Email reminder content

Reminder emails include:
- Task title
- Time remaining or overdue status
- Effective deadline in Lagos time (Africa/Lagos timezone)
- Link to the contributor dashboard

### Telegram reminder content

Telegram messages use Markdown formatting:

Deadline reminder — 24 hours left on your task
You have 24 hours left to submit your work for the task "Task Title".
Deadline: 12 May 2026 at 08:00 (Lagos time).
Log in to your dashboard at zivana.network/contribute/dashboard to submit.

### Environment variables required

| Variable | Description |
|---|---|
| `CRON_SECRET` | Random secret string — must match the value in Vercel environment variables |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — required to read all assigned tasks bypassing RLS |
| `BREVO_API_KEY_REST` | Brevo REST API key for email sending |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from BotFather |

### Vercel cron configuration

Defined in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/reminders/check",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Runs once daily at 8am UTC. The Hobby plan limitation is once per day. Upgrading to Vercel Pro enables hourly scheduling.

### Notes

- The route uses the Supabase service role key to read all assigned tasks with their contributor details in a single query using a join
- The 1-hour buffer window means a reminder fires if the current time is within 1 hour before or after the scheduled reminder time — this accounts for Vercel Hobby plan's ±59 minute scheduling precision
- If the cron job fails on a given day reminders for that day are missed — there is no retry mechanism currently

---

## `/api/telegram/webhook`

**File:** `app/api/telegram/webhook/route.ts`
**Method:** POST
**Auth:** Telegram sends requests to this endpoint — no additional auth header required as Telegram's webhook mechanism provides inherent security via the secret token in the registered webhook URL

### Purpose

Handles incoming messages from the Zivana Telegram bot. Currently handles two commands:

- `/start {contributor_id}` — links a contributor's Telegram account to their Zivana profile
- `/stop` — disconnects the Telegram account from the contributor's profile

### How Telegram delivers messages

When a user sends a message to the Zivana bot Telegram makes a POST request to this webhook URL with a JSON body containing the message details. The webhook URL is registered with Telegram using the `setWebhook` API endpoint.

### Registering the webhook

Use the Telegram `setWebhook` API endpoint with your bot token and the production webhook URL. After setting it, use `getWebhookInfo` to confirm it was registered correctly.

### `/start` command — link Telegram account

**Triggered when:** A contributor clicks the Connect Telegram button in their dashboard profile tab. The button links to `https://t.me/ZivanaProtocolBot?start={contributor_id}`. Telegram opens the bot and automatically sends `/start {contributor_id}`.

**Process:**
1. Extract the contributor ID from the message text
2. Look up the contributor record
3. If found, link the Telegram account and enable Telegram notifications
4. Send a confirmation message to the user

**Success response to user:**

Your Telegram account is now connected to Zivana Protocol.

You will receive deadline reminders here for tasks you claim.
You can disconnect at any time from your dashboard profile settings.

### `/stop` command — disconnect Telegram account

**Triggered when:** User sends `/stop` to the bot directly.

**Process:**
1. Identify the contributor linked to this Telegram chat
2. Remove the Telegram link and disable Telegram notifications
3. Send a disconnection confirmation message

**Success response to user:**

Your Telegram account has been disconnected from Zivana Protocol.
You can reconnect at any time from your dashboard.

### Request body from Telegram

```json
{
  "message": {
    "chat": {
      "id": 123456789
    },
    "text": "/start xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

### Response

The route always returns HTTP 200 with `{ "ok": true }` regardless of the outcome. This is required by Telegram — if the webhook returns a non-200 status Telegram retries the request repeatedly.

Internal errors are logged to the console but never returned to Telegram.

### Environment variables required

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — required to bypass RLS when updating contributor records |
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather |


### Known limitations

- The Telegram bot connection flow requires the contributor to have an active internet connection and Telegram installed
- If the webhook URL changes the webhook must be re-registered with Telegram using the `setWebhook` endpoint
- WhatsApp notifications are planned for a future phase

---

## Adding a new API route

When adding a new API route to the project:

1. Create a `route.ts` file in the appropriate directory under `app/api/`
2. Export named functions for each HTTP method you support: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
3. Use `NextRequest` and `NextResponse` from `next/server`
4. Always return a response — never let the handler fall through without a return
5. Never expose stack traces in error responses — return generic error messages to the caller and log details to the console
6. If the route requires authentication add an auth check at the top before any business logic
7. If the route is called by Vercel cron add a Bearer token check using `CRON_SECRET`
8. If the route needs to bypass RLS use the `SUPABASE_SERVICE_ROLE_KEY` — never the anon key or publishable key
9. Document the route in this file

### Route handler template

```typescript
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // validate inputs
    // perform business logic
    // return response

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    console.error('Route error:', message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```