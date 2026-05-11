# Architecture

This document covers the technical architecture of the Zivana web project — the tech stack, project structure, routing conventions, and coding patterns used throughout the codebase.

---

## Tech stack

### Core framework

**Next.js 14 with App Router**

The project uses the Next.js App Router exclusively. There are no Pages Router files. Every page is a React Server Component by default. Client components are marked with `'use client'` only when they need interactivity, browser APIs, or React hooks.

Key implications:
- Files in `app/` are server components unless they declare `'use client'`
- Layouts wrap their children automatically — the layout file in each directory applies to all pages in that directory and its subdirectories
- API routes live in `app/api/` as `route.ts` files using the Web Request/Response API

### Language

**TypeScript** throughout. Strict mode is enabled. Every component, hook, utility, and API route is typed. Avoid `any` — use `unknown` or define explicit types.

### Styling

**Tailwind CSS** for layout utilities (flexbox, grid, spacing, responsive breakpoints). All colour values, typography, and component-specific styles use inline `style` props with the brand colour tokens. This keeps the brand system explicit and prevents Tailwind colour classes from drifting from the brand palette.

### Database and auth

**Supabase** — PostgreSQL database with Row Level Security, real-time subscriptions, and built-in auth. The project uses Supabase magic link authentication with the implicit flow.

### Rich text

**Tiptap** — used in the admin task creation and editing forms. The editor output is stored as HTML in the database and rendered with `dangerouslySetInnerHTML` on the contributor-facing task views.

### Email

**Brevo** — transactional email for magic links (via Supabase SMTP integration) and custom emails (contributor approval, task assignment) via the Brevo REST API through the internal `/api/email/send` route.

### Deployment

**Vercel** — automatic deployments on every push. The `main` branch deploys to production at `zivana.network`. The `develop` branch deploys to a preview URL. Cron jobs run daily via `vercel.json`.

---

---

## Routing

### Public marketing routes

| Route | Page |
|---|---|
| `/` | Homepage |
| `/about` | About Zivana |
| `/protocol` | Protocol overview |
| `/technology` | Technology stack |
| `/litepaper` | Litepaper |
| `/build` | Build with Zivana |
| `/brand` | Brand guidelines |

### Contributor public routes

| Route | Page |
|---|---|
| `/contribute` | Contribute landing |
| `/contribute/signin` | Magic link sign in |
| `/contribute/register` | Contributor registration |
| `/contribute/tasks` | Public open task board |
| `/contribute/leaderboard` | Public contributor leaderboard |

### Auth routes

| Route | Page |
|---|---|
| `/auth/callback` | Magic link token exchange |
| `/auth/redirect` | Post-auth destination router |

### Contributor portal routes (authenticated)

| Route | Page |
|---|---|
| `/contribute/dashboard` | Overview, contributions, profile tabs |
| `/contribute/dashboard/tasks` | Portal task board with claim flow |
| `/contribute/dashboard/leaderboard` | Portal leaderboard |

### Admin routes (core team only)

| Route | Page |
|---|---|
| `/admin/dashboard` | Overview stats and urgent actions |
| `/admin/dashboard/contributors` | Manage contributors |
| `/admin/dashboard/contributions` | Verify contributions |
| `/admin/dashboard/tasks` | Manage tasks |
| `/admin/dashboard/tasks/new` | Create new task |
| `/admin/dashboard/team` | Core team management (founder only) |

### API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/email/send` | POST | Send transactional email via Brevo |
| `/api/reminders/check` | GET | Daily cron — check deadlines and send reminders |
| `/api/telegram/webhook` | POST | Telegram bot message handler |

---

## Layout system

The project has three distinct layout contexts that never overlap.

### 1. Public site layout

Applied by `components/SiteShell.tsx` which wraps the root layout. Shows the full navigation and footer. Applies to all routes except `/contribute/dashboard/**` and `/admin/**`.

### 2. Contributor portal layout

Applied by `app/contribute/dashboard/layout.tsx`. Shows the `Sidebar` component and the `AdminSwitchButton` for core team members. No public Nav or Footer.

### 3. Admin panel layout

Applied by `app/admin/dashboard/layout.tsx`. Shows the `AdminSidebar` component only. No public Nav, Footer, or contributor Sidebar.

---

## Supabase client pattern

The project maintains four distinct Supabase client instances for different contexts:

### `lib/supabase/client.ts` — Browser client

Used in all `'use client'` components. Uses `@supabase/supabase-js` directly with implicit flow. This is the primary client used across the contributor portal and admin panel.

```typescript
import { supabase } from '@/lib/supabase/client'
// or
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

**Critical:** This client uses the implicit flow (`flowType: 'implicit'`). Do not switch it to `createBrowserClient` from `@supabase/ssr` — that package forces PKCE which breaks cross-browser magic links.

### `lib/supabase/server.ts` — Server client

Used in server components and server actions. Uses `@supabase/ssr` with cookie-based session management.

### `lib/supabase/proxy.ts` — Middleware helper

Used by the root middleware to refresh sessions on every request.

### `lib/supabase/public.ts` — Public client

Used for unauthenticated reads on the public leaderboard and task board. Uses the legacy anon key. Does not require a user session.

---

## Component patterns

### Loading states

All data-fetching components show a skeleton loading state while data is being fetched. Skeletons are simple rounded divs with reduced opacity matching the card dimensions.

### Modals

Modals use a fixed overlay with `backdropFilter: blur(16px)`. Clicking the overlay background closes the modal. The modal content is scrollable with `maxHeight: 90vh` and `overflowY: auto`.

### Forms

All forms use controlled React state. No HTML `<form>` elements. Submit actions are triggered by `onClick` handlers on buttons. Input focus states change the border colour to `#6D28D9`. Blur states restore the border to `#1C1730`.

### Pagination

All admin list pages use client-side pagination with 6 items per page. The pagination bar shows `Showing X–Y of Z` with Previous and Next buttons. Page state resets to 1 whenever the filter or search value changes.

### Sticky headers

All admin pages have sticky header and filter sections using `position: sticky; top: 0` with a solid `#0D0B14` background so content scrolls cleanly underneath.

---

## Fonts

Fonts are loaded via `next/font` in the root layout.

| Font | Weight | Use |
|---|---|---|
| Cabinet Grotesk | 600, 700 | All headings and display text |
| Switzer | 300, 400, 500 | All body text, labels, UI copy |
| Fira Code | 400 | Monospace — code blocks, addresses |
| Syne | 800 | Wordmark only — never used for anything else |

---

## Coding conventions

### Naming

- React components: PascalCase (`ContributorCard`, `AdminSidebar`)
- Functions and variables: camelCase (`handleSubmit`, `fetchContributors`)
- Constants: SCREAMING_SNAKE_CASE (`CATEGORY_COLOURS`, `POINT_RANGES`)
- Files: kebab-case for non-component files, PascalCase for component files
- Database columns: snake_case (matches Supabase convention)

### No em dashes

Em dashes (`—`) must never appear in UI text, commit messages, code comments, or documentation. Use a regular hyphen surrounded by spaces ` - ` or rewrite the sentence.

### Sentence case

All UI text uses sentence case. Only the ZIVANA wordmark is all caps. Button labels, headings, navigation items, and error messages all use sentence case.

### TypeScript strictness

- Prefer explicit return types on functions that return complex objects
- Use `Record<string, unknown>` over `Record<string, any>`
- Define database row types explicitly — do not rely on Supabase generated types