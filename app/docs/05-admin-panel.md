# Admin Panel

This document covers the complete admin panel — access control, every page and its features, the permission matrix, and how the admin panel relates to the contributor portal.

---

## Overview

The admin panel lives under `/admin/dashboard/**`. It is a completely separate section from the contributor portal with its own layout and sidebar. Core team members access it by clicking the **Admin panel** switch button in the contributor portal.

There is no separate admin sign in. Core team members sign in the same way as contributors using a magic link at `/contribute/signin`. The admin panel is gated by membership in the `core_team` table.

---

## Access control

When a user navigates to any `/admin/dashboard/**` route the `AdminSidebar` component runs an auth check:

```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  router.push('/contribute/signin')
  return
}

const { data } = await supabase
  .from('core_team')
  .select('id, name, role, department')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .single()

if (!data) {
  router.push('/contribute/dashboard')
  return
}
```

If the user is not authenticated they are redirected to sign in. If they are authenticated but not in the `core_team` table they are redirected to the contributor portal. This check runs on every admin page load.

---

## Admin layout

`app/admin/dashboard/layout.tsx` renders the `AdminSidebar` component alongside the page content. No website Nav, Footer, or contributor Sidebar is visible.

The `AdminSidebar` contains:
- Zivana logo
- Admin Panel label with the current member's role badge
- Navigation items — role-dependent (Core Team tab is founder-only)
- Bottom actions: Contributor portal switch, Back to site, Sign out

---

## Permission matrix

| Action | Reviewer | Coordinator | Lead | Founder |
|---|---|---|---|---|
| View all contributors | Yes | Yes | Yes | Yes |
| Approve pending contributors | Yes | Yes | Yes | Yes |
| Reject contributors | No | No | Yes | Yes |
| Deactivate active contributors | No | No | Yes | Yes |
| View all contributions | Yes | Yes | Yes | Yes |
| Mark contribution under review | Yes | Yes | Yes | Yes |
| Verify contributions and set points | Yes | Yes | Yes | Yes |
| Reject verified contributions | No | No | No | Yes |
| View all tasks | Yes | Yes | Yes | Yes |
| Create tasks | Yes | Yes | Yes | Yes |
| Edit tasks | Yes | Yes | Yes | Yes |
| Delete tasks | No | No | No | Yes |
| Unassign tasks | Yes | Yes | Yes | Yes |
| View core team | Yes | Yes | Yes | Yes |
| Add core team members | No | No | No | Yes |
| Update core team roles | No | No | No | Yes |
| Deactivate core team members | No | No | No | Yes |

Role-based permission enforcement is currently handled at the UI level — buttons and actions are shown or hidden based on the current member's role. Database-level enforcement is handled by RLS policies on the relevant tables.

---

## Admin overview — `/admin/dashboard`

The landing page for the admin panel. Shows at-a-glance stats and urgent action alerts.

### Stats cards

Six stat cards arranged in a 2-column grid on mobile and 3-column on desktop:

| Card | Data source |
|---|---|
| Pending contributors | `contributors` where `status = pending` |
| Active contributors | `contributors` where `status = active` |
| Pending contributions | `contributions` where `status = submitted` |
| Verified contributions | `contributions` where `status = verified` |
| Open tasks | `tasks` where `status = open` |
| Assigned tasks | `tasks` where `status = assigned` |

Cards with non-zero pending counts show with an amber highlight border to draw attention. Clicking a card navigates to the relevant management page with the appropriate filter pre-applied.

### Urgent actions banner

When there are pending contributors or pending contributions awaiting review an amber banner appears at the top of the overview listing the counts and linking to the relevant pages.

### Quick links

Three action cards at the bottom: Review contributors, Verify contributions, Manage tasks. Each links directly to the relevant page with a filter pre-applied.

---

## Contributors — `/admin/dashboard/contributors`

Manage all contributor applications and accounts.

### Features

**Filter tabs:** All, Pending, Active, Inactive. The default filter is Pending since that is the most urgent view. The selected filter persists in the URL query parameter so refreshing the page keeps the current filter.

**Search:** Free text search across contributor name and email.

**Pagination:** 6 contributors per page with Showing X–Y of Z display. Page resets to 1 when filter or search changes.

**Contributor list:** Each row shows avatar initial, name, category badges, email, location, registration date, total points, and status badge. Pending contributors have an amber border to stand out. Clicking a row opens the detail panel.

### Detail panel

A modal overlay showing the full contributor profile:
- Name, email, categories, contributor type
- Location, timezone, availability
- Skills, bio
- Social links: GitHub, Twitter, LinkedIn, portfolio
- Wallet address
- Points and verified contribution count
- Registration date

### Actions

Actions available depend on the contributor's current status:

| Current status | Available actions |
|---|---|
| Pending | Approve, Reject |
| Active | Deactivate |
| Inactive | Reactivate |

**Approve** — sets `status = active` and sends an approval email to the contributor via Brevo with a link to sign in to their dashboard.

**Reject** — sets `status = inactive` without sending an email.

**Deactivate** — sets `status = inactive`.

**Reactivate** — sets `status = active`.

The approval email uses the sender name **Zivana Network** to match the magic link email sender for consistency.

---

## Contributions — `/admin/dashboard/contributions`

Review and verify work submitted by contributors.

### Features

**Filter tabs:** All, Submitted, Under review, Verified, Rejected. Default filter is Submitted.

**Search:** Free text search across contribution title and contributor name.

**Pagination:** 6 contributions per page.

**Contribution list:** Each row shows title, category and complexity badges, contributor name, submission date, timing multiplier indicator, points, and status badge. Clicking a row opens the review panel.

### Review panel

A modal overlay showing:
- Contribution title and contributor details
- Category, complexity, and status badges
- Full description text
- Evidence URL as a clickable link
- Timing multiplier indicator — green for early bonus, amber for late penalty
- Base points input field with the valid range displayed — editable before verification
- Points calculation preview: `base_points × timing_multiplier = final_points`
- Review notes textarea — required for rejection, optional for verification

### Actions

| Current status | Available actions |
|---|---|
| Submitted | Verify, Reject, Mark under review |
| Under review | Verify, Reject |
| Verified | View only |
| Rejected | View only |

**Verify** — sets `status = verified`, stores `base_points`, calculates and stores `final_points = base_points × timing_multiplier`, sets `verified_at`. The `update_contributor_points` trigger fires and adds points to the contributor's total.

**Reject** — sets `status = rejected`, stores the review notes. Notes are visible to the contributor in their dashboard.

**Mark under review** — sets `status = under_review`. Signals to the contributor that their submission is being actively reviewed.

---

## Tasks — `/admin/dashboard/tasks`

Create and manage all tasks on the contributor task board.

### Features

**Filter tabs:** All, Open, Assigned, Completed.

**Search:** Free text search across task title and description.

**Pagination:** 6 tasks per page.

**Task list:** Each row shows title, category and complexity badges, point range, deadline days, and status badge. Clicking a row opens the edit panel.

**New task button** — navigates to the dedicated create task page at `/admin/dashboard/tasks/new`.

### Edit panel

A modal overlay for editing an existing task:
- Title input
- Description — Tiptap rich text editor
- Category and complexity selects
- Point range and deadline preview — updates automatically when category or complexity changes

**Actions:**
- Save changes — updates the task
- Unassign task — visible only when `status = assigned`, resets to open and clears `assigned_to`, `claimed_at`, `deadline_at`
- Delete task — founder only, permanently deletes the task, requires confirmation dialog

### Create task page — `/admin/dashboard/tasks/new`

A dedicated full-page form replacing the previous modal to prevent accidental data loss on refresh or outside click.

**Breadcrumb:** Tasks / New task with a back link.

**Mode toggle:** Two modes selectable at the top of the form.

#### Open task mode

Task is published to the open task board. Any active contributor can claim it. Deadline starts counting from the moment a contributor claims it.

Fields: Title, Description (rich text), Category, Complexity.

The point range and deadline are calculated automatically and shown as a preview below the complexity select.

#### Direct assignment mode

Task is assigned directly to a specific contributor. It never appears on the open board. Used for work already in progress or pre-agreed assignments — including backdated work.

Additional fields:
- Assign to contributor — searchable dropdown showing all active contributors with name, email, categories, and total points
- Selected contributor card — shows avatar, full name, email, category badges, and points after selection
- Start date — date picker, can be a past date for backdated assignments
- Deadline date — date picker, can be past or future

On creation:
- `status = assigned`
- `assigned_to` = selected contributor ID
- `claimed_at` = selected start date
- `deadline_at` = selected deadline date
- An assignment email is sent to the contributor via Brevo showing the task title, category, complexity, start date, and deadline

### Task description rich text editor

The description field uses the Tiptap editor (`components/admin/RichTextEditor.tsx`).

**Available formatting:**
- Block type dropdown — Paragraph, Heading 2, Heading 3, Bullet list, Numbered list. Changes only the block where the cursor is currently positioned.
- Bold — applies only when text is selected
- Italic — applies only when text is selected

**Behaviour rules:**
- Default block is always paragraph
- Pressing Enter inside a list adds a new list item
- Pressing Enter on an empty list item exits the list and returns to paragraph
- Bold and italic buttons are always visible but only functional when text is selected

The editor outputs HTML which is stored in `tasks.description`. This HTML is rendered with `dangerouslySetInnerHTML` on the contributor-facing task board and portal task pages.

---

## Core team — `/admin/dashboard/team`

Founder-only page. Non-founders see a locked screen with a message explaining the restriction.

### Features

**Member list:** All core team members sorted by join date. Each row shows avatar initial, name, You badge for the current user, Inactive badge if deactivated, email, department, join date, and role badge. The current user's row has a purple border highlight. Clicking a row opens the edit panel.

### Edit panel

- Role select — disabled for the current user (cannot change own role)
- Department select
- Save changes button

**Actions:**
- Save changes — updates role and department
- Deactivate — sets `is_active = false`. Not available for the current user
- Reactivate — sets `is_active = true`. Shown only for inactive members

### Add member panel

Opened by the + Add member button.

Fields: Full name, Email address, Role, Department.

An info notice explains that the new member must sign in with the exact email address provided to gain admin access. Their `user_id` is linked automatically on first sign in.

On creation the member record is inserted with `is_active = true` and default permissions `{verify_contributions, assign_tasks}`.

---

## Switching between admin and contributor portal

**From contributor portal to admin panel:**
Core team members see an **Admin panel** button fixed at the top right of the contributor portal. Clicking navigates to `/admin/dashboard`.

**From admin panel to contributor portal:**
The admin sidebar has a **Contributor portal** link at the bottom of the navigation. Clicking navigates to `/contribute/dashboard`.

Both switches preserve the user's session — no re-authentication is required.