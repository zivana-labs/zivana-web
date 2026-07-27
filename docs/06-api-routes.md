# API Routes

This document covers every server-side API route in the Zivana web project, what each route does, its request format, response format, authentication requirements, and error handling.

All API routes live under `app/api/` and use the Next.js App Router route handler pattern with `NextRequest` and `NextResponse`.

---

## `/api/email/send`

**File:** `app/api/email/send/route.ts`
**Method:** POST
**Auth:** Authenticated, active core team member (Bearer token verified against the `core_team` table)

### Purpose

Sends a transactional email via the Brevo REST API. All emails sent by the application go through this route. Calling the Brevo API directly from the browser is blocked by CORS and ad blockers, this route acts as a server-side proxy.

### Authentication

The caller must send an `Authorization: Bearer <access_token>` header. The route verifies the token and confirms the user has an active `core_team` record before sending. Unauthenticated callers receive 401, callers who are not active core team members receive 403. The `Origin` header is not used for authentication. Internal callers attach the header through the `authedJsonHeaders` helper.

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
| `BREVO_API_KEY_REST` | Brevo REST API key starting with `xkeysib-`, not the SMTP key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL, used to verify the caller's session |
| `NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY` | Service role key, used to verify the caller's core team membership |

### Sender

All emails are sent from:
- **Name:** Zivana Network
- **Email:** hello@zivana.network

This matches the sender name used by Supabase for magic link emails to avoid contributor confusion.

### Current email types sent through this route

| Trigger | Subject | Recipient |
|---|---|---|
| Contributor approved | Your Zivana contributor account is approved | Approved contributor |
| Task directly assigned | You have been assigned a task, {task title} | Assigned contributor |

### Notes

- Debug logging of the Brevo response is gated to development only and does not run in production
- Brevo returns HTTP 201 on successful email submission, not 200, the route treats any 2xx as success
- The `BREVO_API_KEY_REST` must be the REST API key not the SMTP relay key, they look similar but are different credentials

---

## `/api/reminders/check`

**File:** `app/api/reminders/check/route.ts`
**Method:** GET
**Auth:** Bearer token via `Authorization` header, must match `CRON_SECRET` environment variable

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

- If `contributors.notification_email = true`, sends email via Brevo
- If `contributors.notification_telegram = true` AND `contributors.telegram_chat_id` is set, sends Telegram message

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

Deadline reminder, 24 hours left on your task
You have 24 hours left to submit your work for the task "Task Title".
Deadline: 12 May 2026 at 08:00 (Lagos time).
Log in to your dashboard at zivana.network/contribute/dashboard to submit.

### Environment variables required

| Variable | Description |
|---|---|
| `CRON_SECRET` | Random secret string, must match the value in Vercel environment variables |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key, required to read all assigned tasks bypassing RLS |
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
- The 1-hour buffer window means a reminder fires if the current time is within 1 hour before or after the scheduled reminder time, this accounts for Vercel Hobby plan's ±59 minute scheduling precision
- If the cron job fails on a given day reminders for that day are missed, there is no retry mechanism currently

---

## `/api/telegram/webhook`

**File:** `app/api/telegram/webhook/route.ts`
**Method:** POST
**Auth:** Every request must include the `x-telegram-bot-api-secret-token` header, and it must match `TELEGRAM_WEBHOOK_SECRET`. Requests without a valid token receive 403. This secret is set when registering the webhook with Telegram

### Purpose

Handles incoming messages from the Zivana Telegram bot. Currently handles two commands:

- `/start {contributor_id}`, links a contributor's Telegram account to their Zivana profile
- `/stop`, disconnects the Telegram account from the contributor's profile

### How Telegram delivers messages

When a user sends a message to the Zivana bot Telegram makes a POST request to this webhook URL with a JSON body containing the message details. The webhook URL is registered with Telegram using the `setWebhook` API endpoint.

### Registering the webhook

Use the Telegram `setWebhook` API endpoint with your bot token and the production webhook URL. After setting it, use `getWebhookInfo` to confirm it was registered correctly.

### `/start` command, link Telegram account

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

### `/stop` command, disconnect Telegram account

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

The route always returns HTTP 200 with `{ "ok": true }` regardless of the outcome. This is required by Telegram, if the webhook returns a non-200 status Telegram retries the request repeatedly.

Internal errors are logged to the console but never returned to Telegram.

### Environment variables required

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY` | Service role key, required to bypass RLS when updating contributor records |
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | Secret verified against the `x-telegram-bot-api-secret-token` header on every request |


### Known limitations

- The Telegram bot connection flow requires the contributor to have an active internet connection and Telegram installed
- If the webhook URL changes the webhook must be re-registered with Telegram using the `setWebhook` endpoint
- WhatsApp notifications are planned for a future phase

---

## `/api/review/submit`

**File:** `app/api/review/submit/route.ts`
**Method:** POST
**Auth:** Authenticated, active contributor (Bearer token)

### Purpose

Sends a submitted contribution to the external review microservice for automated review, then persists the returned decision. This is the only path the contributor dashboard uses to trigger AI review.

### Flow

1. Verify the caller's session from the `Authorization: Bearer` token and confirm they have an active contributor record
2. Confirm the target contribution belongs to the caller and is still in `submitted` status
3. Build the review payload using the caller's own `contributor_id`, never a value taken from the request body
4. Sign the payload with HMAC-SHA256 using `REVIEW_SERVICE_SECRET` and send it as `X-Zivana-Signature` to `${REVIEW_SERVICE_URL}/review`
5. On a successful response, map the decision to a contribution status and persist it with the service role client

### Status mapping

`human_required` becomes `submitted` (escalated to human review), `rejected` stays `rejected`, and `approved` becomes `ai_approved` only when the code audit reports no security issue. Any medium or higher issue forces `rejected`, and a low issue escalates to `submitted`.

### Responses

| Status | Meaning |
|---|---|
| 200 | Review result JSON returned by the service |
| 401 | Missing or invalid session |
| 403 | Caller is not an active contributor |
| 404 | Contribution not found or not owned by the caller |
| 409 | Contribution is not awaiting review |
| 429 | Review service rate limit, includes `retry_after` |
| 502 / 503 | Review service error, or not configured |

### Environment variables required

| Variable | Description |
|---|---|
| `REVIEW_SERVICE_URL` | Base URL of the review microservice |
| `REVIEW_SERVICE_SECRET` | HMAC signing secret for the `X-Zivana-Signature` header |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY` | Service role key, used to read the contribution and persist the result |

---

## `/api/review/save`

**File:** `app/api/review/save/route.ts`
**Method:** POST
**Auth:** HMAC-SHA256 signature. The `X-Zivana-Signature` header must match a signature computed over the raw request body with `REVIEW_SERVICE_SECRET`, compared in constant time

### Purpose

Signed callback endpoint that lets the review service persist a review decision directly. It applies the same security-first status mapping as `/api/review/submit`. Requests without a valid signature receive 401.

### Request body

| Field | Type | Required | Description |
|---|---|---|---|
| `contribution_id` | string | Yes | Contribution to update |
| `review_decision` | string | Yes | `approved`, `rejected`, or `human_required` |
| `review_score` | number | No | Overall score |
| `review_feedback` | object | No | Structured feedback stored on the contribution |
| `code_audit` | object | No | Security issue list used for the status mapping |

### Responses

| Status | Meaning |
|---|---|
| 200 | `{ success: true }`, contribution updated |
| 400 | Invalid JSON or missing required fields |
| 401 | Missing or invalid signature |
| 503 | `REVIEW_SERVICE_SECRET` not configured |

### Environment variables required

| Variable | Description |
|---|---|
| `REVIEW_SERVICE_SECRET` | Secret used to verify the `X-Zivana-Signature` header |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY` | Service role key, used to update the contribution |

---

## `/api/admin/audit`

**File:** `app/api/admin/audit/route.ts`
**Method:** POST
**Auth:** Authenticated, active core team member (Bearer token)

### Purpose

Appends an entry to the `admin_audit_log` table. Called by the `logAudit` helper (`lib/audit.ts`) from the admin pages after each write action, so every administrative change is recorded with the acting member and a description.

### Flow

1. Verify the caller's session from the `Authorization: Bearer` token
2. Look up the caller's active `core_team` record, returning 403 if none exists
3. Insert an audit row stamped with the verified `actor_id` and `actor_name`, never values taken from the request body

### Request body

| Field | Type | Required | Description |
|---|---|---|---|
| `action` | string | Yes | Action identifier, for example `contribution.verified` |
| `target_type` | string | No | Type of the affected record |
| `target_id` | string | No | Id of the affected record |
| `target_label` | string | No | Human readable label for the target |
| `metadata` | object | No | Extra structured context |

### Responses

| Status | Meaning |
|---|---|
| 200 | `{ ok: true }`, entry written |
| 400 | `action` missing |
| 401 | Missing or invalid session |
| 403 | Caller is not an active core team member |
| 500 | Insert failed |

---

## Adding a new API route

When adding a new API route to the project:

1. Create a `route.ts` file in the appropriate directory under `app/api/`
2. Export named functions for each HTTP method you support: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
3. Use `NextRequest` and `NextResponse` from `next/server`
4. Always return a response, never let the handler fall through without a return
5. Never expose stack traces in error responses, return generic error messages to the caller and log details to the console
6. If the route requires authentication add an auth check at the top before any business logic
7. If the route is called by Vercel cron add a Bearer token check using `CRON_SECRET`
8. If the route needs to bypass RLS use the `NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY`, never the anon key or publishable key
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