# Deployment

This document covers environment variables, the Vercel deployment setup, the branch workflow, and everything needed to deploy the Zivana web project from scratch.

---

## Environment variables

All environment variables must be set in `.env.local` for local development and in Vercel environment variables for deployed environments. Never commit `.env.local` to the repository — it is listed in `.gitignore`.

Copy `.env.example` to `.env.local` and fill in each value:

```bash
cp .env.example .env.local
```

### Complete variable reference

#### Supabase

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL — found in Supabase dashboard under Settings then API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable key starting with `sb_publishable_` — used by the SSR server client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Legacy anon key starting with `eyJ` — used by the browser client for implicit flow auth and public reads |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Legacy service role key starting with `eyJ` — server-side only, never expose to browser |

**Important:** Two separate Supabase key formats exist. The new `sb_` format keys do not work with `@supabase/supabase-js` for service role operations. Always use the legacy `eyJ` format keys for `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. Find them under Supabase dashboard **Settings** then **API Keys** then **Legacy API Keys**.

#### Brevo email

| Variable | Required | Description |
|---|---|---|
| `BREVO_API_KEY` | Yes | Brevo SMTP key starting with `xsmtpsib-` — used by Supabase for magic link emails via SMTP relay |
| `BREVO_API_KEY_REST` | Yes | Brevo REST API key starting with `xkeysib-` — used by the `/api/email/send` route for transactional emails |

These are two different keys for two different Brevo services. The SMTP key is configured in the Supabase dashboard under **Authentication** then **SMTP Settings**. The REST key is used directly in the application code.

#### Telegram

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token from BotFather — format: `{bot_id}:{token_string}` |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Yes | Bot username without @ — e.g. `ZivanaProtocolBot` |

#### Cron job

| Variable | Required | Description |
|---|---|---|
| `CRON_SECRET` | Yes | Random secret string used to authenticate Vercel cron requests to `/api/reminders/check` |

Generate a secure value with:
```bash
# On macOS/Linux
openssl rand -hex 32

# On Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

---

## Supabase configuration

### Auth settings

In the Supabase dashboard under **Authentication** then **URL Configuration**:

**Site URL:**

https://zivana.network/

**Redirect URLs** — add all of these:

https://zivana.network/auth/callback

https://zivana.network/

https://*.vercel.app/**

The wildcard entries cover preview deployments automatically so new Vercel preview URLs do not need to be added individually.

### Email template

In the Supabase dashboard under **Authentication** then **Email Templates** then **Magic Link**:

The button link must use `{{ .ConfirmationURL }}` — this delivers the token in the URL fragment which is required for the implicit flow cross-browser magic links.

The sender must be configured under **Authentication** then **SMTP Settings** using the Brevo SMTP credentials:
- Host: `smtp-relay.brevo.com`
- Port: `587`
- Username: your Brevo SMTP username
- Password: your `BREVO_API_KEY` (SMTP key)
- Sender name: `Zivana Network`
- Sender email: `hello@zivana.network`

### Grants

The following SQL grants must be applied to allow authenticated users to read auth data used in RLS policies:

```sql
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.contributors TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.tasks TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.contributions TO authenticated, anon;
GRANT SELECT ON public.contributors TO anon;
GRANT SELECT ON public.tasks TO anon;
GRANT SELECT ON public.contributions TO anon;
```

---

## Vercel configuration

### Project settings

The project is deployed under the `zivana-labs` GitHub organisation. Vercel is connected to the `zivana-web` repository via OAuth.

| Setting | Value |
|---|---|
| Framework preset | Next.js |
| Root directory | `.` (project root) |
| Build command | `npm run build` |
| Output directory | `.next` (default) |
| Install command | `npm install` |
| Production branch | `main` |
| Node.js version | 20.x |

### Environment variable setup in Vercel

Go to Vercel dashboard then your project then **Settings** then **Environment Variables**.

Add each variable from the reference above. For each variable select which environments it applies to:

- **Production** — `main` branch deployments to `zivana.network`
- **Preview** — all other branch deployments including `develop`
- **Development** — local `vercel dev` (optional, most developers use `.env.local` instead)

Most variables should be enabled for both Production and Preview. The only exception is if you want to use a separate Supabase project for preview testing — in that case set different `NEXT_PUBLIC_SUPABASE_URL` and key values for Preview vs Production.

### Cron jobs

Defined in `vercel.json` at the project root:

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

This runs the reminder check once daily at 8am UTC. The Vercel Hobby plan only supports daily cron jobs. Upgrading to Pro enables hourly scheduling which would improve reminder precision.

Vercel automatically passes the `CRON_SECRET` as the `Authorization: Bearer` header when calling cron routes — this is handled by Vercel internally when the variable is set in the project environment.

---

## Branch workflow

main        → production → zivana.network
develop     → preview   → .vercel.app preview URL
feature/   → preview   → *.vercel.app preview URL

### Day-to-day workflow

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create a feature branch
git checkout -b feat/your-feature-name

# Make changes, commit regularly
git add .
git commit -m "feat: description of change"

# Push to GitHub — triggers a preview deployment
git push origin feat/your-feature-name

# Open a PR to develop on GitHub
# Founder reviews and merges to develop
# develop preview URL is tested

# When develop is stable — merge to main for production
git checkout main
git merge develop
git push origin main
git checkout develop
```

### Merging to production

Only the founder merges to `main`. Before merging confirm:

1. The develop preview URL is working correctly
2. Authentication flow works on mobile and across browsers
3. Contributor dashboard loads with correct data
4. Admin panel loads and all management functions work
5. No console errors on the preview deployment

---

## Setting up from scratch

If you need to set up a completely fresh deployment:

### 1. Clone the repository

```bash
git clone https://github.com/zivana-labs/zivana-web.git
cd zivana-web
npm install
```

### 2. Create a Supabase project

- Create a new project at supabase.com
- Choose Frankfurt region (eu-central-1) to match the existing project latency expectations
- Note your project URL and API keys

### 3. Set up the database schema

Run the following in the Supabase SQL editor in order:

**Create tables:**
```sql
-- contributors
CREATE TABLE contributors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  name text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending',
  categories text[] NOT NULL DEFAULT '{}',
  contributor_type text DEFAULT 'individual',
  team_name text,
  bio text,
  location text,
  timezone text,
  skills text[],
  availability_hours_per_week integer,
  github_handle text,
  twitter_handle text,
  linkedin_url text,
  portfolio_url text,
  wallet_address text,
  total_points integer DEFAULT 0,
  verified_contributions integer DEFAULT 0,
  max_claims integer DEFAULT 2,
  notification_email boolean DEFAULT true,
  notification_telegram boolean DEFAULT false,
  telegram_chat_id text,
  created_at timestamptz DEFAULT now()
);

-- tasks
CREATE TABLE tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  complexity text NOT NULL,
  point_range_min integer NOT NULL,
  point_range_max integer NOT NULL,
  deadline_days integer,
  status text DEFAULT 'open',
  assigned_to uuid REFERENCES contributors(id),
  claimed_at timestamptz,
  deadline_at timestamptz,
  extension_granted boolean DEFAULT false,
  extension_requested_at timestamptz,
  extended_deadline_at timestamptz,
  unclaimed_by uuid[],
  unclaimed_at timestamptz[],
  created_at timestamptz DEFAULT now()
);

-- contributions
CREATE TABLE contributions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contributor_id uuid REFERENCES contributors(id),
  task_id uuid REFERENCES tasks(id),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  complexity text NOT NULL,
  base_points integer NOT NULL,
  final_points integer,
  multiplier numeric DEFAULT 1.0,
  timing_multiplier numeric DEFAULT 1.0,
  evidence_url text,
  status text DEFAULT 'submitted',
  verified_by uuid,
  verified_at timestamptz,
  deadline_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- core_team
CREATE TABLE core_team (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  department text NOT NULL,
  permissions text[] DEFAULT ARRAY['verify_contributions', 'assign_tasks'],
  is_active boolean DEFAULT true,
  joined_at timestamptz DEFAULT now()
);

-- profiles
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  contributor_id uuid REFERENCES contributors(id),
  full_name text,
  avatar_url text,
  wallet_address text,
  portfolio_url text,
  skills text[],
  timezone text,
  contributor_type text DEFAULT 'individual',
  team_name text,
  availability_hours_per_week integer,
  onboarded boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**Create security definer functions** — see `docs/03-database.md` for the full function definitions.

**Create RLS policies** — see `docs/03-database.md` for all policy definitions.

**Insert the founder record:**
```sql
INSERT INTO core_team (email, name, role, department, is_active)
VALUES ('your-email@example.com', 'Your Name', 'founder', 'governance', true);
```

### 4. Configure Supabase auth

- Set Site URL to your deployment URL
- Add redirect URLs
- Configure SMTP with Brevo credentials
- Update the magic link email template

### 5. Set up environment variables

Fill in `.env.local` with all values from the variable reference above.

### 6. Create the Telegram bot

- Open Telegram and message `@BotFather`
- Send `/newbot` and follow the prompts
- Copy the bot token to `TELEGRAM_BOT_TOKEN`
- Copy the bot username to `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`

### 7. Run locally

```bash
npm run dev
```

Verify the site loads at `http://localhost:3000` and sign in works with a magic link.

### 8. Deploy to Vercel

- Import the repository in Vercel
- Add all environment variables
- Deploy — Vercel detects Next.js automatically

### 9. Register the Telegram webhook

After deployment visit in your browser:

https://api.telegram.org/bot{BOT_TOKEN}/setWebhook?url=https://your-domain.com/api/telegram/webhook

---

## Common deployment issues

### Magic links not working cross-browser

Confirm `lib/supabase/client.ts` uses `@supabase/supabase-js` directly with `flowType: 'implicit'`. Do not use `createBrowserClient` from `@supabase/ssr`.

### 401 errors from Brevo

Confirm `BREVO_API_KEY_REST` starts with `xkeysib-` not `xsmtpsib-`. The SMTP key and REST key are different. Check for extra whitespace or characters in the environment variable value.

### RLS permission denied errors

Confirm the security definer functions `get_contributor_id()` and `is_core_team_member()` exist in the database. Check that `GRANT SELECT ON auth.users TO authenticated` has been run.

### Infinite recursion in RLS policies

Never write an RLS policy that queries the same table it is protecting. Use the `is_core_team_member()` security definer function instead of querying `core_team` directly inside a `core_team` policy.

### Cron job not firing

Confirm `CRON_SECRET` is set in Vercel environment variables. Verify the cron is listed in the Vercel dashboard under **Settings** then **Cron Jobs**. On the Hobby plan cron jobs have up to 59 minutes of scheduling drift.

### Preview deployment auth redirect loop

Add the preview URL pattern `https://*.vercel.app/**` to the Supabase redirect URLs allowlist. Without this Supabase rejects the `emailRedirectTo` parameter on the preview domain.