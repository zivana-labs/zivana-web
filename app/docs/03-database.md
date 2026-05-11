# Database

This document covers the complete database schema for Zivana web — all tables, columns, relationships, Row Level Security policies, and database functions. The database is hosted on Supabase (PostgreSQL) in the Frankfurt region.

**Critical rule:** Zivana has real contributors with verified contributions and points in production. Never drop a column or table without confirming it is empty first. Always migrate before dropping. Always use specific WHERE clauses. Never run bulk updates or deletes without a filter.

---

## Tables overview

| Table | Purpose |
|---|---|
| `contributors` | Registered contributors and their profile data |
| `contributions` | Work submitted by contributors for verification |
| `tasks` | Work items created by the core team |
| `core_team` | Core team members and their roles |
| `profiles` | Auth user profiles linked to contributors |

---

## Table: contributors

Stores all registered contributors. A contributor record is created during registration and requires core team approval before the contributor can claim tasks or submit contributions.

### Columns

| Column | Type | Default | Nullable | Description |
|---|---|---|---|---|
| `id` | uuid | gen_random_uuid() | NO | Primary key |
| `email` | text | — | NO | Email address — must match auth.users email |
| `name` | text | — | NO | Full name or individual display name |
| `user_id` | uuid | — | YES | Foreign key to auth.users.id — linked on first sign in |
| `status` | text | `pending` | YES | Account status: `pending`, `active`, `inactive` |
| `categories` | text[] | `{}` | NO | Contribution categories: technical, design, community, research, operations |
| `contributor_type` | text | `individual` | YES | `individual` or `team` |
| `team_name` | text | — | YES | Team display name — only used when contributor_type is `team` |
| `bio` | text | — | YES | Short contributor biography |
| `location` | text | — | YES | City or country |
| `timezone` | text | — | YES | IANA timezone string e.g. Africa/Lagos |
| `skills` | text[] | — | YES | Free-form skill tags |
| `availability_hours_per_week` | integer | — | YES | Self-reported weekly availability |
| `github_handle` | text | — | YES | GitHub username without @ |
| `twitter_handle` | text | — | YES | Twitter/X username without @ |
| `linkedin_url` | text | — | YES | Full LinkedIn profile URL |
| `portfolio_url` | text | — | YES | Personal website or portfolio URL |
| `wallet_address` | text | — | YES | Cardano wallet address for $ZVN allocation |
| `total_points` | integer | `0` | YES | Cumulative verified points — updated by trigger |
| `verified_contributions` | integer | `0` | YES | Count of verified contributions — updated by trigger |
| `max_claims` | integer | `2` | YES | Maximum simultaneous task claims allowed |
| `notification_email` | boolean | `true` | YES | Whether to send email deadline reminders |
| `notification_telegram` | boolean | `false` | YES | Whether to send Telegram deadline reminders |
| `telegram_chat_id` | text | — | YES | Telegram chat ID — set when contributor connects the bot |
| `created_at` | timestamptz | now() | YES | Registration timestamp |

### Status values

| Status | Meaning |
|---|---|
| `pending` | Registered but awaiting core team approval |
| `active` | Approved — can claim tasks and submit contributions |
| `inactive` | Deactivated — cannot claim tasks or submit contributions |

### Notes

- A contributor with `user_id = null` has registered but not yet signed in. The `user_id` is linked on first magic link sign in.
- `total_points` and `verified_contributions` are never updated directly. They are maintained automatically by the `update_contributor_points` trigger on the `contributions` table.
- `categories` accepts 1 or 2 values from the valid set: `technical`, `design`, `community`, `research`, `operations`.

---

## Table: contributions

Stores all work submitted by contributors for core team verification. Each contribution represents a discrete unit of work with a defined category, complexity, and point allocation.

### Columns

| Column | Type | Default | Nullable | Description |
|---|---|---|---|---|
| `id` | uuid | gen_random_uuid() | NO | Primary key |
| `contributor_id` | uuid | — | YES | Foreign key to contributors.id |
| `task_id` | uuid | — | YES | Foreign key to tasks.id — optional, set when submitted from a claimed task |
| `title` | text | — | NO | Contribution title |
| `description` | text | — | YES | Detailed description of the work done |
| `category` | text | — | NO | Category: technical, design, community, research, operations |
| `complexity` | text | — | NO | Complexity: small, medium, large |
| `base_points` | integer | — | NO | Base points set by core team within the predefined range |
| `final_points` | integer | — | YES | Final points after multipliers applied |
| `multiplier` | numeric | `1.0` | YES | Consistency multiplier — set to 1.2 when contributor reaches 5 verified contributions |
| `timing_multiplier` | numeric | `1.0` | YES | Timing multiplier — 1.2x early, 1.0x on time, 0.8x late |
| `evidence_url` | text | — | YES | URL to the evidence of work |
| `status` | text | `submitted` | YES | Review status — see values below |
| `verified_by` | uuid | — | YES | Foreign key to core_team.id — who verified the contribution |
| `verified_at` | timestamptz | — | YES | Timestamp of verification |
| `deadline_at` | timestamptz | — | YES | Effective deadline copied from the claimed task at submission time |
| `notes` | text | — | YES | Core team review notes — shown to contributor on rejection |
| `created_at` | timestamptz | now() | YES | Submission timestamp |

### Status values

| Status | Meaning |
|---|---|
| `submitted` | Submitted by contributor — awaiting core team review |
| `under_review` | Core team has started reviewing |
| `verified` | Approved by core team — points awarded |
| `rejected` | Rejected by core team — notes explain what to fix |

### Point ranges by category and complexity

| Category | Small | Medium | Large |
|---|---|---|---|
| Technical | 50–120 | 150–280 | 300–500 |
| Design | 30–80 | 80–160 | 180–300 |
| Research | 50–100 | 100–200 | 200–400 |
| Operations | 30–60 | 80–150 | 150–200 |
| Community | 10–30 | 60–120 | 100–150 |

### Timing multiplier rules

The `timing_multiplier` is calculated automatically at submission time based on when the work is submitted relative to the task deadline. Community category contributions are always 1.0x regardless of timing.

| Submission timing | Multiplier |
|---|---|
| Within first 50% of deadline window | 1.2x — early bonus |
| Between 50% and 100% of deadline window | 1.0x — base points |
| Past deadline but within extension window | 0.8x — late penalty |
| Beyond extension window | Core team discretion — flagged |

### Notes

- `final_points` = `base_points` × `timing_multiplier` × `multiplier`
- When a contribution is verified the `update_contributor_points` trigger fires and adds `final_points` to `contributors.total_points`
- When a verified contribution is subsequently rejected the trigger reverses the points
- When `final_points` is updated on an already verified contribution the trigger adjusts the difference

---

## Table: tasks

Stores all tasks created by the core team. Tasks can be open (available for any contributor to claim) or directly assigned to a specific contributor.

### Columns

| Column | Type | Default | Nullable | Description |
|---|---|---|---|---|
| `id` | uuid | gen_random_uuid() | NO | Primary key |
| `title` | text | — | NO | Task title |
| `description` | text | — | YES | Rich text HTML description of the task |
| `category` | text | — | NO | Category: technical, design, community, research, operations |
| `complexity` | text | — | NO | Complexity: small, medium, large |
| `point_range_min` | integer | — | NO | Minimum points for this task |
| `point_range_max` | integer | — | NO | Maximum points for this task |
| `deadline_days` | integer | — | YES | Deadline duration — 3 for small, 6 for medium, 12 for large |
| `status` | text | `open` | YES | Task status — see values below |
| `assigned_to` | uuid | — | YES | Foreign key to contributors.id — set when claimed or directly assigned |
| `claimed_at` | timestamptz | — | YES | When the task was claimed or when the admin set the start date for direct assignment |
| `deadline_at` | timestamptz | — | YES | Calculated deadline — claimed_at + deadline_days |
| `extension_granted` | boolean | `false` | YES | Whether a deadline extension has been granted |
| `extension_requested_at` | timestamptz | — | YES | When the contributor requested an extension |
| `extended_deadline_at` | timestamptz | — | YES | New deadline after extension |
| `unclaimed_by` | uuid[] | — | YES | Array of contributor IDs who have unclaimed this task |
| `unclaimed_at` | timestamptz[] | — | YES | Timestamps corresponding to each unclaim event |
| `created_at` | timestamptz | now() | YES | When the task was created |

### Status values

| Status | Meaning |
|---|---|
| `open` | Available for any active contributor to claim |
| `assigned` | Claimed by or directly assigned to a contributor |
| `completed` | Work submitted by the contributor |

### Deadline and extension rules

| Complexity | Deadline | Extension |
|---|---|---|
| Small | 3 days | +1 day |
| Medium | 6 days | +2 days |
| Large | 12 days | +3 days |

- Extensions can only be requested before the original deadline expires
- One extension per task claim — extensions cannot be stacked
- A contributor who unclaims a task cannot reclaim it for 30 days
- The effective deadline is `extended_deadline_at` when `extension_granted = true`, otherwise `deadline_at`

### Notes

- `description` stores HTML output from the Tiptap rich text editor
- For directly assigned tasks `claimed_at` and `deadline_at` are set by the admin at creation time and can be backdated
- `unclaimed_by` and `unclaimed_at` are parallel arrays — index N in `unclaimed_by` corresponds to index N in `unclaimed_at`

---

## Table: core_team

Stores all core team members. Core team members have elevated permissions in the admin panel. Only founders can add new core team members or change roles.

### Columns

| Column | Type | Default | Nullable | Description |
|---|---|---|---|---|
| `id` | uuid | gen_random_uuid() | NO | Primary key |
| `user_id` | uuid | — | YES | Foreign key to auth.users.id — linked when the member first signs in |
| `email` | text | — | NO | Email address — must match exactly for admin access to work |
| `name` | text | — | NO | Full name |
| `role` | text | — | NO | Role: founder, lead, reviewer, coordinator |
| `department` | text | — | NO | Department: technical, design, community, research, operations, governance |
| `permissions` | text[] | `{verify_contributions, assign_tasks}` | YES | Permission flags |
| `is_active` | boolean | `true` | YES | Whether the member has active admin access |
| `joined_at` | timestamptz | now() | YES | When the member was added |

### Role values and permissions

| Role | Approve contributors | Reject contributors | Verify contributions | Reject verified | Create tasks | Delete tasks | Manage core team |
|---|---|---|---|---|---|---|---|
| Reviewer | Yes | No | Yes | No | Yes | No | No |
| Coordinator | Yes | No | Yes | No | Yes | No | No |
| Lead | Yes | Yes | Yes | No | Yes | No | No |
| Founder | Yes | Yes | Yes | Yes | Yes | Yes | Yes |

### Notes

- `user_id` is null until the member signs in for the first time with the email address that matches their record
- A member with `is_active = false` loses admin panel access immediately
- A founder cannot change their own role — another founder must do it

---

## Table: profiles

Stores extended profile data linked to auth users. This table was created for future use and is currently supplementary to the `contributors` table. Most contributor profile data lives in `contributors`.

### Columns

| Column | Type | Default | Nullable | Description |
|---|---|---|---|---|
| `id` | uuid | — | NO | Primary key — foreign key to auth.users.id |
| `contributor_id` | uuid | — | YES | Foreign key to contributors.id |
| `full_name` | text | — | YES | Full name |
| `avatar_url` | text | — | YES | Profile photo URL |
| `wallet_address` | text | — | YES | Cardano wallet address |
| `portfolio_url` | text | — | YES | Portfolio website URL |
| `skills` | text[] | — | YES | Skill tags |
| `timezone` | text | — | YES | IANA timezone string |
| `contributor_type` | text | `individual` | YES | `individual` or `team` |
| `team_name` | text | — | YES | Team name |
| `availability_hours_per_week` | integer | — | YES | Weekly availability |
| `onboarded` | boolean | `false` | YES | Whether the contributor has completed onboarding |
| `created_at` | timestamptz | now() | YES | Creation timestamp |

---

## Row Level Security policies

All tables have RLS enabled. Every query from the application is subject to these policies.

### contributors

| Policy | Command | Rule |
|---|---|---|
| Anyone can register as contributor | INSERT | Always allowed — `with_check: true` |
| Contributors can view own record | SELECT | `user_id = auth.uid()` OR email matches auth user email |
| Contributors can update own record | UPDATE | `user_id = auth.uid()` OR email matches auth user email |
| Public can view active contributors | SELECT | `status = 'active'` |
| Core team can view all contributors | SELECT | `is_core_team_member()` |
| Core team can update all contributors | UPDATE | `is_core_team_member()` |

### contributions

| Policy | Command | Rule |
|---|---|---|
| Contributors can submit contributions | INSERT | `contributor_id = get_contributor_id()` AND contributor status is active |
| Contributors can view own contributions | SELECT | `contributor_id = get_contributor_id()` |
| Contributors can update own submitted contributions | UPDATE | contributor_id matches auth user AND `status = 'submitted'` |
| Public can view verified contributions | SELECT | `status = 'verified'` |
| Core team can view all contributions | SELECT | `is_core_team_member()` |
| Core team can verify contributions | UPDATE | core_team.user_id matches auth.uid() AND is_active |

### tasks

| Policy | Command | Rule |
|---|---|---|
| Public can view tasks | SELECT | `status` in `open`, `assigned`, `completed` |
| Core team can insert tasks | INSERT | core_team.user_id matches auth.uid() AND is_active |
| Core team can update tasks | UPDATE | `is_core_team_member()` |
| Contributors can claim open tasks | UPDATE | status is `open` AND contributor exists, OR status is `assigned` AND `assigned_to = get_contributor_id()` |

### core_team

| Policy | Command | Rule |
|---|---|---|
| Core team select own record | SELECT | `user_id = auth.uid()` |
| Founders can add core team members | INSERT | `is_core_team_member()` AND role is `founder` |
| Founders can update core team | UPDATE | `is_core_team_member()` AND role is `founder` |

### profiles

| Policy | Command | Rule |
|---|---|---|
| Users can view own profile | SELECT | `id = auth.uid()` |
| Users can insert own profile | INSERT | `id = auth.uid()` |
| Users can update own profile | UPDATE | `id = auth.uid()` |

---

## Database functions

All functions use `SECURITY DEFINER` which means they execute with the privileges of the function owner, bypassing RLS. This is intentional — it allows the functions to query tables that would otherwise cause infinite recursion when used inside RLS policies.

### `get_contributor_id()`

Returns the `contributors.id` for the currently authenticated user. Used in RLS policies to avoid complex subqueries.

```sql
SELECT id FROM contributors
WHERE contributors.user_id = auth.uid()
AND contributors.status = 'active'
LIMIT 1
```

### `is_core_team_member()`

Returns `true` if the currently authenticated user exists in the `core_team` table with `is_active = true`.

```sql
SELECT EXISTS (
  SELECT 1 FROM core_team
  WHERE core_team.user_id = auth.uid()
  AND core_team.is_active = TRUE
)
```

### `is_core_team_member_by_uid(user_uid uuid)`

Same as `is_core_team_member()` but accepts a specific UUID instead of using `auth.uid()`. Used for server-side checks.

### `update_contributor_points()` — trigger function

Fires after every UPDATE on the `contributions` table. Handles three cases:

1. When a contribution is marked `verified` — adds `final_points` to `contributors.total_points` and increments `verified_contributions`
2. When a verified contribution is subsequently marked `rejected` — reverses the points
3. When `final_points` is updated on an already verified contribution — adjusts the difference

### `apply_consistency_multiplier()` — trigger function

Fires after every UPDATE on the `contributors` table. When `verified_contributions` transitions from 4 to 5, retroactively applies a 1.2x consistency multiplier to all of that contributor's verified contributions and recalculates their total points from scratch.

### `rls_auto_enable()` — event trigger function

Automatically enables RLS on every new table created in the `public` schema. This is a safety net that ensures no table is accidentally created without RLS.

---

## Adding a new table

When adding a new table to the schema:

1. Create the table in the Supabase SQL editor
2. RLS is enabled automatically by the `rls_auto_enable` event trigger
3. Add appropriate RLS policies before writing any application code that touches the table
4. If any policy would query the same table (recursion risk), create a `SECURITY DEFINER` function and use it in the policy instead
5. Document the table in this file
6. Never add a table directly to the production Supabase project without testing the policies first