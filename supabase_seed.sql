-- Zivana Web — seed data
-- Run AFTER supabase_schema.sql, in Supabase SQL Editor.
-- Safe to re-run: uses ON CONFLICT / WHERE NOT EXISTS guards.
-- Enum-like values match the app (see register/tasks/team pages).

-- ===========================================================================
-- 1. Core team — founder
-- ===========================================================================
-- user_id left NULL here. It is linked to your auth account by the backfill
-- UPDATE at the bottom (run once, after you sign in with this email).
insert into public.core_team (email, name, role, department, permissions, is_active)
values (
  'muhammed.yuguda@adeptengr.com',
  'Muhammed Yuguda',
  'founder',
  'governance',
  array['verify_contributions','assign_tasks','manage_core_team'],
  true
)
on conflict (email) do update
  set role        = excluded.role,
      department  = excluded.department,
      permissions = excluded.permissions,
      is_active   = true;

-- ===========================================================================
-- 2. Sample contributors (active — populate leaderboard / dashboards)
-- user_id NULL (no auth account needed for display rows).
-- ===========================================================================
insert into public.contributors
  (name, email, contributor_type, location, timezone, categories, skills,
   availability_hours_per_week, bio, github_handle, status,
   total_points, verified_contributions, max_claims)
values
  ('Adunola Fashola', 'adunola@example.com', 'individual', 'Lagos, Nigeria',
   'Africa/Lagos', array['technical'], array['Aiken','TypeScript','Cardano'],
   10, 'Smart contract dev focused on Cardano.', 'adunola', 'active', 420, 6, 3),
  ('Zanele Dlamini', 'zanele@example.com', 'individual', 'Johannesburg, South Africa',
   'Africa/Johannesburg', array['design'], array['Figma','Motion','Branding'],
   5, 'Product designer, brand + UI.', 'zanele', 'active', 260, 4, 3),
  ('Kwame Mensah', 'kwame@example.com', 'individual', 'Accra, Ghana',
   'Africa/Accra', array['community'], array['Outreach','Writing'],
   20, 'Community lead and market reporter.', 'kwame', 'active', 180, 3, 3),
  ('Amina Bello', 'amina@example.com', 'individual', 'Abuja, Nigeria',
   'Africa/Lagos', array['research'], array['Tokenomics','Modelling'],
   5, 'Protocol economics researcher.', 'amina', 'pending', 0, 0, 3)
on conflict (email) do nothing;

-- ===========================================================================
-- 3. Tasks (open board)
-- complexity: small|medium|large   status: open|assigned|completed
-- category: technical|design|community|research|operations
-- ===========================================================================
insert into public.tasks
  (title, description, category, complexity,
   point_range_min, point_range_max, deadline_days, status, primitives, links)
select * from (values
  ('Build validator claim UI',
   'Implement the on-chain claim flow UI in the contributor dashboard.',
   'technical', 'large', 200, 400, 21, 'open',
   array['smart-contract','frontend'],
   '[{"label":"Spec","url":"https://docs.zivana.network/claim"}]'::jsonb),

  ('Write Aiken unit tests for reward split',
   'Cover edge cases in the reward-split validator with Aiken tests.',
   'technical', 'medium', 80, 160, 14, 'open',
   array['smart-contract','testing'], null),

  ('Design contributor badge system',
   'Create tiered badge visuals for the leaderboard.',
   'design', 'medium', 80, 150, 14, 'open',
   array['branding','ui'], null),

  ('Landing page hero animation',
   'Motion design for the marketing landing hero section.',
   'design', 'small', 40, 80, 7, 'open',
   array['motion'], null),

  ('Weekly market report — West Africa',
   'Produce a weekly on-the-ground market report for the West Africa region.',
   'community', 'small', 30, 60, 7, 'open',
   array['reporting'], null),

  ('Grow Telegram community to 1k',
   'Outreach campaign to grow the Telegram channel to 1,000 members.',
   'community', 'large', 150, 300, 30, 'open',
   array['outreach','growth'], null),

  ('Tokenomics sensitivity model',
   'Build a sensitivity model for emission schedule vs. participation.',
   'research', 'large', 200, 350, 28, 'open',
   array['modelling','economics'], null),

  ('Draft contributor legal agreement',
   'Draft the standard contributor agreement for review by counsel.',
   'operations', 'medium', 100, 180, 14, 'open',
   array['legal'], null)
) as t(title, description, category, complexity,
       point_range_min, point_range_max, deadline_days, status, primitives, links)
where not exists (select 1 from public.tasks where public.tasks.title = t.title);

-- ===========================================================================
-- 4. Sample contributions (verified + in-review — populate admin dashboards)
-- ===========================================================================
insert into public.contributions
  (contributor_id, title, description, category, complexity,
   base_points, final_points, timing_multiplier, status, submission_count,
   evidence_url, verified_at)
select c.id, v.title, v.description, v.category, v.complexity,
       v.base_points, v.final_points, v.timing_multiplier, v.status,
       v.submission_count, v.evidence_url, v.verified_at
from (values
  ('adunola@example.com', 'Implemented reward-split validator',
   'Delivered the core reward-split Aiken validator.', 'technical', 'large',
   300, 360::numeric, 1.2::numeric, 'verified', 1,
   'https://github.com/example/pr/12', now() - interval '5 days'),
  ('zanele@example.com', 'Brand color system v1',
   'Delivered the initial brand palette and tokens.', 'design', 'medium',
   120, 130::numeric, 1.08::numeric, 'verified', 1,
   'https://figma.com/example', now() - interval '3 days'),
  ('kwame@example.com', 'March market report',
   'Submitted the March West Africa market report.', 'community', 'small',
   50, null::numeric, 1::numeric, 'under_review', 1,
   'https://docs.google.com/example', null)
) as v(email, title, description, category, complexity,
       base_points, final_points, timing_multiplier, status,
       submission_count, evidence_url, verified_at)
join public.contributors c on c.email = v.email
where not exists (
  select 1 from public.contributions x
  where x.title = v.title and x.contributor_id = c.id
);

-- ===========================================================================
-- 5. Backfill founder user_id  (RUN AFTER you sign in with the founder email)
-- ===========================================================================
-- Sign in once via magic link so auth.users has your row, then run:
update public.core_team ct
set user_id = u.id
from auth.users u
where u.email = ct.email
  and ct.email = 'muhammed.yuguda@adeptengr.com'
  and ct.user_id is null;
