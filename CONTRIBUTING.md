# Contributing to Zivana Web

Thank you for being part of building Zivana Protocol. This document covers everything you need to know to contribute effectively to this repository.

---

## Before you start

1. You must have been added as a collaborator on `github.com/zivana-labs/zivana-web`
2. You must have access to the Zivana Supabase project — request this from the founder
3. Read the full [README.md](README.md) and complete the quick start before making any changes
4. Read the relevant docs section before touching any part of the codebase you are unfamiliar with

---

## Branch workflow

main        ← production, deploys to zivana.network
└── develop  ← active development, deploys to preview URL
└── your-feature-branch  ← your work

### Step by step

**1. Always start from develop**

```bash
git checkout develop
git pull origin develop
```

**2. Create a feature branch**

Name your branch descriptively:

```bash
git checkout -b feat/task-description-rich-text
git checkout -b fix/claim-rls-policy
git checkout -b chore/update-dependencies
```

Branch naming prefixes:

| Prefix | Use for |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `chore/` | Maintenance, dependency updates |
| `docs/` | Documentation only |
| `refactor/` | Code restructuring without behaviour change |

**3. Make your changes**

Work on your branch. Commit regularly with clear messages (see commit conventions below).

**4. Push your branch**

```bash
git push origin feat/your-feature-name
```

**5. Open a pull request to `develop`**

- Target branch must be `develop`, never `main`
- Fill in the PR description explaining what changed and why
- Link any related tasks from the admin panel if applicable
- The founder reviews all PRs before merge

**6. After approval**

The founder merges your PR to `develop`. When `develop` is stable and tested on the preview URL the founder merges to `main` for production deployment.

---

## Commit conventions

Every commit message must follow this format:

type: short description in sentence case
Optional longer explanation if needed.

### Types

| Type | Use for |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `chore` | Build process, dependencies, config |
| `docs` | Documentation changes only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `style` | Formatting, missing semicolons — no logic change |

### Examples

feat: add timing multiplier to contribution submission
fix: resolve infinite recursion in core_team RLS policy
chore: update Tiptap to latest version
docs: add database schema to docs/03-database.md
refactor: extract email send logic to shared API route

### Rules

- Use sentence case, not title case
- Keep the first line under 72 characters
- No full stop at the end of the first line
- No em dashes anywhere in commit messages

---

## Code standards

### TypeScript

- All new files must be TypeScript
- Avoid `any` — use specific types or `unknown`
- Define types explicitly for all component props and API responses
- Never use `// @ts-ignore` without a comment explaining why

### React and Next.js

- All interactive components must have `'use client'` at the top
- Server components are the default — only add `'use client'` when needed
- Any page using `useSearchParams()` must be wrapped in a `<Suspense>` boundary
- Never use `<form>` HTML elements — use `onClick` and `onChange` handlers instead
- Keep components focused — if a component exceeds 300 lines consider splitting it

### Styling

- Brand colours only — see the colour reference below
- No red, green, yellow, or teal from outside the brand palette — use brand alternatives for status colours
- Font families: Cabinet Grotesk (headings 600/700), Switzer (body 300/400/500), Fira Code (mono), Syne 800 (wordmark only)
- Sentence case everywhere — except the ZIVANA wordmark which is always all caps
- No em dashes anywhere in UI text or code

### Brand colour reference

| Token | Hex | Use |
|---|---|---|
| `void` | `#0D0B14` | Page background |
| `depth` | `#13101E` | Card background |
| `shadow` | `#1E1640` | Elevated surfaces |
| `border` | `#1C1730` | All borders |
| `dp` | `#4C1D95` | Deep purple |
| `core` | `#6D28D9` | Primary actions |
| `violet` | `#8B5CF6` | Secondary actions |
| `lavender` | `#A78BFA` | Active states, links |
| `mist` | `#C4B5FD` | Subtle highlights |
| `light` | `#E8E6F0` | Primary text |
| `mute` | `#7B6FA8` | Secondary text |
| `label` | `#8B7EC8` | Labels, captions |
| `faint` | `#6B5FA0` | Disabled, placeholder |

---

## Database rules

These rules are non-negotiable. Zivana has real contributors with verified contributions and points in production.

- **Never drop a column or table without confirming it is empty first**
- **Always migrate data before dropping anything**
- **Always use specific `WHERE` clauses — never run a bulk update or delete without a filter**
- **Never run schema changes directly on the production Supabase project without testing on a local or staging instance first**
- When adding a new RLS policy always check for conflicts with existing policies on the same table
- Use `SECURITY DEFINER` functions for any policy that would otherwise create recursive queries

---

## Working with Supabase

### Client usage

| File | Use for |
|---|---|
| `lib/supabase/client.ts` | Browser client — all client components |
| `lib/supabase/server.ts` | Server components and server actions |
| `lib/supabase/public.ts` | Unauthenticated public reads (leaderboard, task board) |

Never use the service role key in client-side code. The service role key is only for server-side API routes in `app/api/`.

### Auth pattern

This project uses the **implicit flow** via `@supabase/supabase-js` directly, not `@supabase/ssr`. Do not switch the browser client to `createBrowserClient` from `@supabase/ssr` as this forces PKCE which breaks cross-browser magic links.

---

## File creation rules

Before creating any new file check whether an existing component or utility already covers the need.

When creating a new page:
- Add it under the correct directory (`app/contribute/` for portal, `app/admin/` for admin, root `app/` for marketing)
- If it uses `useSearchParams()` wrap the component in `<Suspense>`
- If it is a protected page add an auth check at the top of the `useEffect` load function

When creating a new component:
- Place it in `components/admin/` for admin-only, `components/portal/` for portal-only, or `components/` root for shared
- Export it as a named default export

---

## Asking for help

- For questions about the codebase or architecture message the core team channel
- For sensitive security questions use direct message with the founder — do not open a GitHub issue
- For database access requests contact the founder directly

---

## What not to do

- Do not push directly to `main` or `develop` — always use a feature branch and PR
- Do not hardcode any credentials, API keys, or secrets in code
- Do not introduce new colour values outside the brand palette
- Do not use `localStorage` or `sessionStorage` — they are not supported in the artifact environment
- Do not add new dependencies without discussing with the founder first
- Do not modify the Supabase schema on production without review
- Do not use em dashes anywhere