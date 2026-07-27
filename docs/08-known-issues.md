# Known Issues and Deferred Work

This document covers known limitations, bugs that are deferred, planned features that have not been built yet, and technical debt to address in future development cycles.

---

## Known issues

### No right-to-deletion flow, NDPR compliance gap

**Status:** Not implemented, tracked for future delivery
**Affected:** contributors table, Brevo contacts, Telegram chat IDs

Zivana is subject to the Nigeria Data Protection Regulation (NDPR) which grants data subjects the right to request deletion of their personal data. No deletion mechanism currently exists across any of the three systems that hold contributor PII:

- **Supabase**, contributor record contains name, email, wallet address, social handles, bio, location, Telegram chat ID
- **Brevo**, contributor email is stored as a contact when approval emails are sent
- **Telegram**, chat ID is stored in the contributors table and used for reminders

**Planned implementation:**

A deletion flow requires careful design to preserve contribution integrity while removing personal identifiers. The approach will be:

1. Anonymise the contributor record rather than deleting it, replace name with "Former Contributor", clear email, wallet address, social handles, bio, location, telegram_chat_id
2. Preserve contributions with the anonymised contributor_id so the leaderboard totals and verified contribution counts remain accurate
3. Remove the contact from Brevo via the Brevo contacts DELETE API
4. Clear telegram_chat_id and set notification_telegram to false
5. Invalidate the Supabase auth account

A dedicated admin action and a self-service request form for contributors will be needed. This must be implemented before Zivana reaches significant contributor scale.

---

### Server-side middleware auth gate incompatible with implicit flow

**Status:** Architectural constraint, not fixable without auth flow migration
**Affected:** `/admin/dashboard/**` routes

Next.js middleware runs before any client-side code executes. Auth-based redirects in middleware require the session to exist in cookies. Zivana uses the implicit flow where the session token is delivered in the URL fragment and stored in localStorage, not in cookies. This means middleware cannot read the session and any cookie-based auth check in middleware always fails, causing redirect loops and `refresh_token_not_found` errors.

**Current protection:** The `AdminAuthGate` component wraps the entire admin layout and blocks all page content from rendering until the auth check confirms the user is an active core team member. A spinner shows during the check. Unauthenticated users are redirected before any admin content is visible.

**Future fix:** Migrating to PKCE flow would allow cookie-based sessions and proper middleware auth gates. However PKCE breaks cross-browser magic links, a link requested on desktop cannot be opened on mobile. This tradeoff must be evaluated against the contributor experience before migrating.

---

### Next.js upgraded to 16

Resolved. The project has migrated to Next.js 16.2.6. The Async Request APIs are in place, `params` and `searchParams` are awaited in page components, and the browser client uses `@supabase/supabase-js` directly to preserve the implicit flow. When bumping dependencies, keep `npm audit` clear of high and critical advisories.

---

### Telegram bot connection failing on some deployments

**Status:** Intermittent, not fully resolved
**Affected:** `/api/telegram/webhook`

The Telegram webhook handler uses direct REST API calls to Supabase instead of the `@supabase/supabase-js` client because the client initialised at module level in a serverless function can fail to load environment variables before the request handler runs. This workaround is stable but not ideal.

**Symptoms:** Bot responds with "Something went wrong linking your account" despite the service role key being correctly set.

**Workaround:** The route now creates the Supabase client inside the POST handler rather than at module level and uses direct fetch calls with explicit `apikey` and `Authorization` headers.

**Future fix:** Investigate whether Next.js 15 or a Supabase Edge Function would provide more reliable environment variable access in serverless contexts.

---

### Unclaim cooldown, resolved

The reclaim cooldown is now enforced in the database. Claiming goes through the `claim_task` function together with `check_claim_cooldown`, both of which read `tasks.unclaimed_by` and `tasks.unclaimed_at` and block a reclaim of the same task within the cooldown window. The window is 48 hours, not the 30 days originally proposed.

---

### Vercel cron limited to daily on Hobby plan

**Status:** Infrastructure limitation
**Affected:** `/api/reminders/check`

The reminder cron job runs once per day at 8am UTC due to the Vercel Hobby plan restriction. The reminder schedule was designed for hourly checks but currently only fires once per day. This means reminders for a task with a 6-hour deadline window may not be sent at the correct time.

**Impact:** Contributors may receive the 6-hour reminder late or not at all depending on when in the day the deadline falls.

**Future fix:** Upgrade to Vercel Pro to enable hourly cron scheduling. The cron route is already built for hourly execution, only the schedule in `vercel.json` needs to change.

---

### WhatsApp notifications not implemented

**Status:** Deferred to future phase
**Affected:** Notification system

WhatsApp was identified as a high-priority notification channel for the Nigerian contributor base but was deferred because the official WhatsApp Business API requires Meta Business account verification and message template approval. The Telegram bot was built first as it has no such requirements.

**Future implementation:** Use Twilio for WhatsApp integration. Add `whatsapp_phone` and `notification_whatsapp` fields to the `contributors` table. Add WhatsApp sending to the reminders cron route alongside the existing email and Telegram channels.

---

### Rich text editor heading behaviour

**Status:** Partially resolved, workaround in place
**Affected:** `components/admin/RichTextEditor.tsx`

Tiptap heading commands (`setHeading`, `toggleHeading`) are block-level operations that affect the entire block containing the cursor. The current implementation uses a dropdown to change the block type of the line at the cursor position and saves the cursor position on blur before the dropdown interaction. This is more reliable than button-based heading toggling but may still behave unexpectedly in some edge cases when the cursor position is not saved correctly before dropdown interaction.

**Workaround:** The block type dropdown saves the cursor position using the `onBlur` event and restores it before applying the format command. Bold and italic are mark-level operations and work correctly on selected text only.

**Future fix:** Evaluate Tiptap Pro extensions or alternative editors like Plate.js which provide more fine-grained block manipulation APIs.

---

### Profiles table not actively used

**Status:** Technical debt
**Affected:** `profiles` table

The `profiles` table was created during initial setup to store extended user profile data linked to `auth.users`. In practice all contributor profile data is stored in the `contributors` table which is more complete and better integrated with the rest of the system. The `profiles` table currently has no active writes from the application.

**Future decision:** Either populate the `profiles` table as part of a broader profile system redesign, or formally deprecate and drop it once confirmed empty. Do not drop without first running `SELECT COUNT(*) FROM profiles` to confirm it is empty.

---

## Deferred features

### Automated contribution review service, implemented

**Repository:** `github.com/zivana-labs/zivana-review-service` (separate repository)

This is now live. When a contributor submits, the portal calls `/api/review/submit`, which signs the payload with HMAC-SHA256 and forwards it to the review microservice, then persists the returned decision. The service returns a structured decision (approved, rejected with feedback, or escalated to human review) which maps to the `ai_approved`, `rejected`, or `submitted` contribution status. The signed callback path at `/api/review/save` verifies the same HMAC signature.

See `docs/04-contributor-portal.md` and `docs/06-api-routes.md` for the portal side, and the separate repository for the service itself.

---

### Suggested tasks from contributors

**Priority:** Medium
**Scope:** Not started

Contributors will be able to propose tasks for the core team to review. A suggested task goes into a `suggested` status and is reviewed by the core team. If approved it is assigned directly to the contributor who suggested it, it never goes to the open task board.

**Schema change needed:** Add `suggested` to the valid status values for `tasks`. Add a `suggested_by` UUID column referencing `contributors.id`.

**UI needed:** A Submit a task idea form in the contributor portal. A Suggested tasks tab in the admin tasks page.

---

### WhatsApp notification channel

**Priority:** Medium
**Scope:** Not started, see known issues above

---

### Vercel Pro upgrade for hourly cron

**Priority:** Medium
**Scope:** Configuration change only

Upgrade to Vercel Pro to enable hourly cron scheduling. Update `vercel.json` schedule from `0 8 * * *` to `0 * * * *`. No code changes required.

---

### Token allocation dashboard

**Priority:** Low, depends on token launch timeline
**Scope:** Not started

At token launch contributor points convert proportionally to $ZVN allocation. A dashboard showing each contributor's expected allocation based on their current points relative to the total points pool will be needed. This requires knowing the total $ZVN supply allocated to contributors which is a protocol-level decision.

---

### Contribution review history visible to contributors

**Priority:** Low
**Scope:** Not started

Currently contributors can see the status and notes on their contributions but cannot see the full review history, who reviewed it, when, and what changes were made to the points. A review history timeline on each contribution would increase transparency.

---

## Technical debt

### Email and Telegram sending not abstracted

The email sending logic and Telegram sending logic are duplicated across `app/api/reminders/check/route.ts` and `app/api/telegram/webhook/route.ts`. A shared notification utility module should be extracted to avoid duplication and ensure consistent behaviour.

**Suggested location:** `lib/notifications.ts`

---

### No loading states on admin pages during mutations

Admin action buttons (approve, verify, reject) show a loading state via the `actionLoading` state variable but the underlying list does not show any loading indication while the page refetches after a mutation. This can create a brief flash where the list appears stale.

---

### Missing error boundaries

Client components do not have React error boundaries. An unhandled runtime error in a portal or admin component will crash the entire page rather than showing a graceful error state.

**Future fix:** Add error boundary components wrapping the main content areas of the dashboard and admin panel.

---

### No automated tests

The project has no unit tests, integration tests, or end-to-end tests. The automated contribution review service (separate repository) has a test suite but the main web application does not.

**Future fix:** Add Playwright end-to-end tests for the critical paths: magic link sign in, contributor registration, task claiming, contribution submission, and admin approval flow.

---

### `.next` directory tracked in git

The `.next` build cache directory was committed to git in an early commit. It has since been removed but the git history still contains it. This inflates the repository size unnecessarily.

**Future fix:** Run `git filter-branch` or use `git-filter-repo` to remove `.next` from the git history entirely. Confirm `.next/` is in `.gitignore` before doing this. Coordinate with all contributors to re-clone after the history rewrite.