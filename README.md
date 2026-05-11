# Zivana Protocol — Web

The official website and contributor portal for [Zivana Protocol](https://zivana.network) — open trust infrastructure for the African informal economy, built on Cardano and Midnight.

## Live

| Environment | URL |
|---|---|
| Production | https://zivana.network |
| Preview (develop) | https://zivana-web-git-develop-abdulrahman-abdulbasit-adiguns-projects.vercel.app |

---

## What this repository contains

- The public marketing website (`zivana.network`)
- The contributor portal (`zivana.network/contribute`)
- The admin panel (`zivana.network/admin`)
- All API routes for email, Telegram notifications, and reminder scheduling

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + inline styles |
| Animation | Framer Motion |
| Auth | Supabase (magic link, implicit flow) |
| Database | Supabase (PostgreSQL) |
| Rich text | Tiptap |
| Email | Brevo (transactional) |
| Deployment | Vercel |
| Version control | GitHub (private, `zivana-labs` org) |

---

## Quick start

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- A Supabase account with access to the `zivana-contrib` project
- A Brevo account with a REST API key
- Git configured with access to `github.com/zivana-labs`

### 1. Clone the repository

```bash
git clone https://github.com/zivana-labs/zivana-web.git
cd zivana-web
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

See [docs/07-deployment.md](docs/07-deployment.md) for a full description of every variable.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Branch workflow

| Branch | Purpose |
|---|---|
| `main` | Production — deploys to `zivana.network` |
| `develop` | Active development — deploys to preview URL |

**Never push directly to `main`.** All work goes to `develop` first. The founder reviews and merges to `main` when confirmed working.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contribution workflow.

---

For a detailed explanation of every directory and file see [docs/01-architecture.md](docs/01-architecture.md).

---

## Documentation

| Document | Contents |
|---|---|
| [Architecture](./docs/01-architecture.md) | Tech stack, project structure, coding conventions |
| [Authentication](./docs/02-authentication.md) | Magic link flow, session management |
| [Database](./docs/03-database.md) | Tables, columns, relationships, RLS policies |
| [Contributor Portal](./docs/04-contributor-portal.md) | Portal features and user flows |
| [Admin Panel](./docs/05-admin-panel.md) | Admin features and permissions |
| [API Routes](./docs/06-api-routes.md) | All API routes documented |
| [Deployment](./docs/07-deployment.md) | Environment variables and deploy workflow |
| [Known Issues](./docs/08-known-issues.md) | Deferred work and known limitations |

---

## Key contacts

| Role | Contact |
|---|---|
| Founder | Abdulbasit Adigun Abdulrahman |
| Protocol | [zivana.network](https://zivana.network) |
| GitHub org | [github.com/zivana-labs](https://github.com/zivana-labs) |

---

## Licence

This repository is private. All rights reserved. Unauthorised copying, distribution, or use of any part of this codebase is prohibited.
