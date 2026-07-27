# Zivana Protocol, Web

The official website and contributor portal for [Zivana Protocol](https://zivana.network), open trust infrastructure for the African informal economy, built on Cardano and Midnight.

| Environment | URL |
|---|---|
| Production | https://zivana.network |
| Preview (`develop`) | Internal Vercel preview |

---

## Contents

- Public marketing site, `zivana.network`
- Contributor portal, `zivana.network/contribute`
- Admin panel, `zivana.network/admin`
- Blog, sourced from the NexTrium project
- API routes for AI contribution review, transactional email, Telegram notifications, deadline reminders, and the admin audit log

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS with inline brand tokens |
| Animation | Framer Motion |
| Auth and database | Supabase (magic link, PostgreSQL, RLS) |
| Rich text | Tiptap, sanitized with DOMPurify |
| Email | Brevo |
| Deployment | Vercel |

## Quick start

Requires Node.js 20+, npm 9+, and the credentials listed in `.env.example`.

```bash
git clone https://github.com/zivana-labs/zivana-web.git
cd zivana-web
npm install
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000
```

See `.env.example` for the full list of environment variables.

## Scripts

| Command | Action |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Serve the production build |

## Branch workflow

| Branch | Deploys to |
|---|---|
| `main` | Production, `zivana.network` |
| `develop` | Preview URL |

Never push directly to `main`. Work lands on `develop` first, and the founder merges to `main` once verified. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.

## Documentation

Contributor guidance lives in [CONTRIBUTING.md](CONTRIBUTING.md) and the [contributor brief](CONTRIBUTOR_BRIEF.md). Detailed architecture, database, and operations documentation is maintained internally by the core team.

## Licence

Private repository. All rights reserved. Unauthorised copying, distribution, or use of any part of this codebase is prohibited.
