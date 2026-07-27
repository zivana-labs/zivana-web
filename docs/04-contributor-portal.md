# Contributor Portal

This document covers every feature and user flow in the Zivana contributor portal, the authenticated section of the site where contributors claim tasks, submit work, track their points, and manage their profile.

---

## Overview

The contributor portal lives under `/contribute/dashboard/**`. It is completely separate from the public marketing site in terms of layout, the website navigation and footer are hidden and replaced by the portal sidebar.

Access requires a valid magic link session. Any unauthenticated request to a portal route redirects to `/contribute/signin`.

---

## Public contribute pages

These pages are accessible without authentication and form the entry point to the contributor ecosystem.

### `/contribute`, Landing page

The public contribute landing page. Explains the contribution model, the four-step process, the five categories, and the point ranges. Contains a subtle sign in link for returning contributors and links to browse tasks and view the leaderboard.

### `/contribute/signin`, Sign in page

Dedicated magic link sign in page. The contributor enters their email and receives a link. The link works on any browser and any device. After clicking the link the contributor lands at `/contribute/dashboard`.

New contributors who have not registered yet are directed to `/contribute/register` from this page.

### `/contribute/register`, Registration

A three-step registration form:

**Step 1, Identity:** Name, email, contributor type (individual or team), team name if applicable, location, timezone.

**Step 2, Expertise:** Categories (1 or 2), skills, weekly availability, bio.

**Step 3, Links and notifications:** GitHub handle, Twitter handle, LinkedIn URL, portfolio URL, wallet address, notification preferences (email, Telegram).

On submission a contributor record is created with `status: pending`. The contributor cannot access the portal until a core team member approves the application. An approval email is sent via Brevo when the core team approves.

### `/contribute/tasks`, Public task board

Shows all tasks with `status = open`. Filterable by category. Searchable by title and description. Unauthenticated visitors can browse tasks but cannot claim them. Clicking claim redirects to `/contribute/signin`.

### `/contribute/leaderboard`, Public leaderboard

Shows all active contributors ranked by `total_points` descending. Displays name, categories, total points, and verified contribution count. Uses the public Supabase client with the anon key, no authentication required.

---

## Portal layout

The portal layout is applied by `app/contribute/dashboard/layout.tsx`. It renders:

- `Sidebar`, left navigation (240px wide on desktop, drawer on mobile)
- `AdminSwitchButton`, fixed top-right button visible only to core team members
- The page content in the main area

The sidebar contains:
- Zivana logo linking to the public site
- Navigation items: Overview, Tasks, Contributions, Leaderboard, Profile
- Bottom actions: Back to site, Sign out

Navigation items that link to tabs within the dashboard use `?tab=` query parameters. The sidebar reads `useSearchParams()` reactively to highlight the correct active item.

---

## Dashboard, `/contribute/dashboard`

The main portal page. Has three tabs controlled by the `?tab=` query parameter.

### Overview tab (default)

**Active claims section**, shown only when the contributor has claimed tasks. Displays a card for each claimed task showing:
- Task title, category badge, complexity badge
- Point range
- Progress bar showing time elapsed against the deadline
- Countdown timer, days and hours remaining, or overdue message
- Extension granted badge if applicable
- Three action buttons: Submit work, Request extension, Unclaim

**Quick actions**, two cards: Submit a contribution (opens the submission form), Browse open tasks (links to portal tasks page).

**Recent submissions**, last three contributions with title, category, complexity, status badge, and points. A link to view all contributions switches to the contributions tab.

### Contributions tab (`?tab=contributions`)

Full list of all contributions submitted by the contributor. Each row shows title, category, complexity, status badge, and points. Status values: submitted, under review, ai_approved, verified, rejected. Each row links to a submission detail page.

### Profile tab (`?tab=profile`)

Editable profile form. The contributor can update: bio, skills, timezone, availability, GitHub handle, Twitter handle, LinkedIn URL, portfolio URL, wallet address, notification preferences (email, Telegram), and Telegram connection.

**Telegram connection:** When Telegram reminders are enabled and no chat ID exists, a Connect Telegram button appears linking to `https://t.me/ZivanaProtocolBot?start={contributor_id}`. When the contributor messages the bot their chat ID is stored and the button is replaced by a connected confirmation.

---

## Submission detail

Each contribution row in the dashboard links to a submission detail page at `/contribute/dashboard/submissions/[id]`. It shows the full submission (description, evidence, notes), the scoring breakdown (base points, final points, timing multiplier, review score, and the key dates), the AI review feedback when present, and the linked task.

The page loads the contribution by id and requires a signed in session. Access is scoped by the database, so a contributor only ever receives their own submission, and a request for a submission that is not theirs returns a not found state.

---

## Claiming a task

The claim flow lives in `app/contribute/dashboard/tasks/page.tsx`.

**Eligibility checks before claiming:**
- Contributor must be authenticated and have `status = active`
- Contributor must have fewer than `max_claims` (default 2) active claims simultaneously
- If at the limit the claim button shows as disabled with tooltip text

**Claim flow:**
1. Contributor clicks Claim task on a task card or the task detail page
2. The claim calls the `claim_task` database function rather than updating the tasks table directly
3. `claim_task` re-checks the 48 hour unclaim cooldown, then, only if the task is still `open`, sets `status = assigned`, `assigned_to = contributor.id`, `claimed_at = now()`, and `deadline_at` from the deadline window
4. It returns false when the contributor is inside the cooldown, null when the task was just claimed by someone else, and otherwise the task moves to the contributor's active claims
5. The task disappears from the open task board and appears in Active claims on the dashboard

Claiming always goes through `claim_task`. Routing it through the function keeps the claim atomic under concurrent attempts and keeps the cooldown enforced in the database.

**Deadline calculation:**
| Complexity | Deadline |
|---|---|
| Small | 3 days from claim time |
| Medium | 6 days from claim time |
| Large | 12 days from claim time |

---

## Unclaiming a task

A contributor can unclaim a task at any time before submission.

1. Contributor clicks Unclaim on an active claim card
2. A confirmation dialog warns about the 48 hour reclaim cooldown
3. On confirmation the unclaim calls the `unclaim_task` database function
4. `unclaim_task` sets the task back to `status = open`, clears `assigned_to`, `claimed_at`, `deadline_at`, and the extension fields, and appends the contributor id and current timestamp to `unclaimed_by` and `unclaimed_at`
5. The task returns to the open board

The 48 hour cooldown is enforced in the database. `claim_task` and `check_claim_cooldown` read `unclaimed_by` and `unclaimed_at`, so a contributor who unclaims a task cannot reclaim that same task for 48 hours.

---

## Requesting an extension

A contributor can request one deadline extension per task claim before the original deadline expires.

1. Contributor clicks Request extension on an active claim card
2. The extension is granted immediately, no core team approval required
3. The task is updated: `extension_granted = true`, `extension_requested_at = now()`, `extended_deadline_at = deadline_at + extension_days`
4. The countdown on the card updates to show the new deadline
5. The Extended badge appears on the task card

**Extension durations:**
| Complexity | Extension |
|---|---|
| Small | +1 day |
| Medium | +2 days |
| Large | +3 days |

After an extension has been granted the Request extension button is replaced by the Extended badge. No further extensions are possible.

---

## Submitting a contribution

The submission form is accessible from two places: the Submit a contribution button on the overview, or the Submit work button on an active claim card. When opened from an active claim the form is pre-filled with the task title, category, and complexity.

**Form fields:**
- Title, required
- Description, required, free text explaining what was done
- Category, required, one of the five categories
- Complexity, required, small/medium/large
- Evidence URL, optional, link to the deliverable

**Timing multiplier calculation at submission:**
For a non community submission tied to a claimed task, the `calculate_timing_multiplier` database function computes the multiplier from how much of the deadline window had elapsed:

- Within the first 50 percent of the deadline window: 1.2x early bonus
- Between 50 and 100 percent: 1.0x base
- Past the deadline: 0.8x late penalty
- Community category: always 1.0x, exempt from the timing multiplier

**Points at submission:**
The base points are taken from a fixed per category and complexity table and multiplied by the timing multiplier to produce an initial final points value stored on the record. These values are provisional. At verification the core team can adjust the base points within the allowed range, and the verify step clamps both the base points and the timing multiplier before points are awarded, so the values submitted from the client do not determine the final award.

**After successful submission:**
- The contribution record is created with `status = submitted`
- If the review service is enabled the submission is sent for automated review, see the AI review section below
- For a non community submission the linked task is marked `completed` and removed from active claims, unless the automated review rejected the work, in which case the task stays open so it can be resubmitted
- The contributor's active claim count decrements accordingly

---

## AI review

When the review service is enabled (`NEXT_PUBLIC_REVIEW_SERVICE_URL` is set) a submission is sent for automated review immediately after it is created. The dashboard calls `/api/review/submit`, which signs the payload and forwards it to the review microservice, then persists the returned decision. See `docs/06-api-routes.md` for the route detail.

### Outcomes

The service decision maps to a contribution status:

- `ai_approved`, the work passed the automated review with no blocking security issue. Points are not awarded yet, a core team member still verifies
- `submitted`, the work was escalated to human review, either because the service asked for it or a low severity issue was flagged
- `rejected`, the automated review found a blocking issue. The contributor sees the feedback and can resubmit

A rejected submission leaves the linked task open so the contributor can address the feedback and submit again.

### Review feedback

The structured feedback returned by the service is stored in `review_feedback` and shown to the contributor in a feedback modal. It can include a summary, a list of issues, suggested next steps, per check results, and, on a resubmission, an assessment of whether the previous issues were resolved.

### Submission limit

`submission_count` is owned by the `enforce_submission_count` database trigger. Each resubmission of the same contribution increments it server side, and the trigger blocks any attempt beyond the third submission. The cap cannot be bypassed from the client. By the third submission the work is escalated to human review rather than being auto rejected again.

---

## Notification system

Contributors choose their notification preferences during registration or from the profile tab.

**Email reminders** via Brevo, sent to the contributor's registered email.

**Telegram reminders**, sent to the contributor's Telegram account after they connect the Zivana bot.

### Reminder schedule

**Small tasks (3 day deadline):**
- 24 hours before deadline
- 6 hours before deadline
- At deadline if not submitted: overdue notice

**Medium tasks (6 day deadline):**
- 3 days before deadline
- 24 hours before deadline
- 6 hours before deadline
- At deadline if not submitted: overdue notice

**Large tasks (12 day deadline):**
- 7 days before deadline
- 3 days before deadline
- 24 hours before deadline
- 6 hours before deadline
- At deadline if not submitted: overdue notice

If an extension is granted the 24-hour and 6-hour reminders repeat against the new deadline.

Reminders are sent by the daily cron job at `app/api/reminders/check/route.ts` which runs at 8am UTC via Vercel cron. See `docs/06-api-routes.md` for full details.

---

## Points system

Points are awarded when the core team verifies a contribution. The final point value is calculated as:

final_points = base_points × timing_multiplier × consistency_multiplier

**Base points**, initialized from a fixed per category and complexity table at submission, and adjustable by the core team within the allowed range at verification. The verify step clamps the value to the allowed range before points are awarded.

**Timing multiplier**, calculated automatically at submission time based on when the work was submitted relative to the deadline. Community contributions are exempt.

**Consistency multiplier**, when a contributor reaches 5 verified contributions the `apply_consistency_multiplier` database trigger fires and retroactively applies a 1.2x multiplier to all their verified contributions. Their total points are recalculated from scratch.

Points accumulate in `contributors.total_points` and are visible on the public leaderboard. At token launch points convert proportionally to $ZVN allocation.

---

## Admin switch button

Core team members who are also contributors see an **Admin panel** button fixed at the top right of the portal. Clicking it navigates to `/admin/dashboard`. The button only renders after a Supabase query confirms the current user exists in the `core_team` table with `is_active = true`.