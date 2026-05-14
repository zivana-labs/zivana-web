# Zivana Protocol — Contributor Brief

**Version:** 1.0
**Date:** May 2026
**Prepared by:** NexTrium Global Innovations Ltd
**Status:** Active — open for contributor onboarding

---

## Table of Contents

1. [What Zivana Is](#1-what-zivana-is)
2. [Why Zivana Exists](#2-why-zivana-exists)
3. [Protocol Architecture](#3-protocol-architecture)
4. [The Five Protocol Primitives](#4-the-five-protocol-primitives)
5. [Technology Foundation](#5-technology-foundation)
6. [Current Build State](#6-current-build-state)
7. [The Contributor Model](#7-the-contributor-model)
8. [Task Categories](#8-task-categories)
9. [Points and Allocation System](#9-points-and-allocation-system)
10. [Tech Stack](#10-tech-stack)
11. [Getting Started](#11-getting-started)
12. [Governance and Decision-Making](#12-governance-and-decision-making)
13. [Community and Communication](#13-community-and-communication)

---

## 1. What Zivana Is

Zivana Protocol is an open Layer 2 trust infrastructure protocol built on Cardano and Midnight. It is designed to bring verifiable identity, reputation, and trust to the African informal economy — the vast network of traders, artisans, cooperative members, market associations, and small business operators who transact outside formal financial and legal systems.

Zivana is not a lending protocol. It is not a payments protocol. It is the trust layer that makes other protocols possible — a composable infrastructure that any application, marketplace, or financial service can integrate to verify that the people and entities they are dealing with are who they say they are and have the reputation history to back it up.

The protocol is being built by NexTrium Global Innovations Ltd, a Lagos-based technology company, with contributions from a distributed team of developers, designers, researchers, community builders, and governance architects across Africa and the global Web3 ecosystem.

---

## 2. Why Zivana Exists

The African informal economy accounts for an estimated 55 percent of GDP across sub-Saharan Africa and employs the majority of the working population. Despite its scale it remains largely invisible to formal financial systems, digital platforms, and institutional investors.

The root cause of this invisibility is not poverty or lack of activity. It is the absence of verifiable trust infrastructure. A trader in Lagos Market cannot prove their five-year track record of reliable transactions to a microfinance institution. A cooperative in Kano cannot demonstrate collective creditworthiness to a supply chain financier. A skilled artisan in Accra cannot carry their reputation across platforms or borders.

Existing solutions attempt to solve this with centralised databases, credit scoring models, and platform-specific reputation systems — all of which are siloed, gatekept, and extractive. They replicate the exclusion patterns of the formal economy rather than dismantling them.

Zivana takes a different approach. Trust, identity, and reputation are treated as protocol-level primitives — composable, portable, user-owned, and verifiable on-chain. The protocol does not issue trust. It creates the infrastructure through which communities can generate, verify, and exchange trust on their own terms.

---

## 3. Protocol Architecture

Zivana is a Layer 2 protocol built on two complementary blockchain networks:

### Cardano — The Settlement and Identity Layer

Cardano provides the base settlement layer for Zivana. All on-chain identity anchors, credential issuances, governance votes, and token transactions are settled on Cardano. Cardano was chosen for its:

- Formal verification approach to smart contract development via Plutus and Aiken
- Extended UTxO model which enables deterministic transaction outcomes — critical for trust primitives
- Proof of stake consensus with established finality guarantees
- Growing ecosystem of identity and DID infrastructure in Africa
- Native token standard that enables the $ZVN token without custom smart contract complexity

Aiken is the primary smart contract language for Zivana protocol contracts. It compiles to Plutus Core and provides a more developer-friendly syntax with strong type guarantees.

### Midnight — The Privacy and Confidential Computation Layer

Midnight is a data protection blockchain built by Input Output (the team behind Cardano). It enables selective disclosure — the ability to prove properties about private data without revealing the data itself using zero-knowledge proofs.

Midnight is critical to Zivana because trust in informal economic contexts requires privacy. A trader should be able to prove they have a five-year positive transaction history without revealing their entire transaction record. A cooperative should be able to prove collective creditworthiness without exposing individual member finances.

Midnight's zkSNARK-based proof system allows Zivana to:

- Issue verifiable credentials that prove claims without revealing underlying data
- Enable selective disclosure of reputation attributes to specific counterparties
- Protect contributor identity while maintaining verifiable on-chain attestations
- Separate public reputation signals from private identity anchors

### The Layer 2 Design

Zivana operates as a Layer 2 on Cardano with Midnight handling confidential computation. The architecture is:

Application Layer        Sovela, partner dApps, third-party integrations
↕
Zivana Protocol Layer    Five primitives: Trust, Identity, Reputation, Governance, Market Intelligence
↕
Midnight Layer           Zero-knowledge proofs, selective disclosure, confidential state
↕
Cardano Layer            Settlement, identity anchors, governance votes, $ZVN token

This layered design means Zivana is composable — any application can integrate specific primitives without implementing the entire protocol stack.

---

## 4. The Five Protocol Primitives

Zivana Protocol is organised around five core primitives. Each primitive is a distinct module with its own data model, smart contracts, and API surface. Together they form a complete trust infrastructure stack.

### Primitive 1 — Trust Primitive

**Repository:** `zivana-labs/zivana-trust`
**Status:** Design phase

The Trust Primitive is the foundational layer of the protocol. It defines how trust relationships are established, recorded, and verified between participants. Trust in Zivana is not a single score — it is a structured graph of verified relationships with defined context, directionality, and expiry.

**How it works at the protocol level:**

A trust relationship is established when two or more participants mutually attest to a shared economic interaction. The attestation is recorded as a signed transaction on Cardano containing:

- The participants' DID identifiers (from the Identity Primitive)
- The context of the interaction — category, value range, date
- The mutual attestation signatures
- An optional dispute flag

Trust relationships are directional and contextual. A trader trusted for market goods transactions does not automatically inherit trust in financial lending contexts. This prevents trust laundering and ensures that trust signals are meaningful within their domain.

Trust accumulates over time into a Trust Score — a weighted aggregate of verified relationships, their recency, their value, and the trust scores of the attesting parties. The Trust Score is not stored on-chain in raw form. It is computed off-chain and published as a zero-knowledge proof via the Midnight layer, allowing selective disclosure without revealing the underlying relationship graph.

**Intended use cases:**
- Market traders proving transaction reliability to new trading partners
- Cooperative members establishing collective trust for group lending
- Supply chain participants verifying counterparty reliability

### Primitive 2 — Identity Primitive

**Repository:** `zivana-labs/zivana-identity`
**Status:** Design phase

The Identity Primitive provides the decentralised identity layer for Zivana. It implements a DID (Decentralised Identifier) standard compatible with W3C DID specifications, anchored on Cardano.

**How it works at the protocol level:**

Every participant in the Zivana ecosystem has a DID — a unique identifier that is:

- Self-sovereign — created and controlled by the participant, not issued by Zivana
- On-chain anchored — the DID document is anchored to Cardano via a minimal UTxO transaction
- Verifiable — any counterparty can verify the DID is valid and active without querying a central authority
- Portable — the DID and its associated credentials are not locked to any single application

The Identity Primitive handles:

- DID creation and key management
- DID document updates — rotating keys, adding verification methods, adding service endpoints
- Credential issuance — attaching verifiable credentials to a DID
- Credential verification — proving a credential is valid without revealing its contents

**Credential types supported:**

| Credential | Issuer | What it proves |
|---|---|---|
| Identity attestation | Community validator | Person exists and is known to a community |
| Business registration | Zivana or partner | Entity is a registered business |
| Skill credential | Issuing institution or peer group | Participant has verified skills |
| Membership credential | Association or cooperative | Participant is a member in good standing |
| Reputation credential | Protocol | Aggregate reputation meets a threshold |

Credentials are stored off-chain in the participant's control (via a mobile wallet or browser extension) and presented on demand. The on-chain anchor only records that the credential was issued — not its contents.

**Midnight integration:**

The Identity Primitive uses Midnight's selective disclosure to allow participants to prove properties of their identity without revealing the identity itself. A participant can prove they are over 18, have a verified business registration, or are a member of a specific cooperative — without revealing their name, address, or other personal details.

### Primitive 3 — Reputation Primitive

**Repository:** `zivana-labs/zivana-reputation`
**Status:** Design phase

The Reputation Primitive transforms the raw trust relationship data from the Trust Primitive into structured, queryable reputation profiles. Reputation in Zivana is multi-dimensional — it captures different aspects of a participant's economic behaviour across different contexts.

**How it works at the protocol level:**

Reputation is computed from three sources:

1. **Verified transactions** — completed economic interactions attested by counterparties via the Trust Primitive
2. **Credential holdings** — verified credentials from the Identity Primitive that signal qualifications or affiliations
3. **Community attestations** — endorsements from community validators who have direct knowledge of the participant

Each reputation dimension is computed separately and published as a zk-proof via Midnight. The dimensions are:

| Dimension | What it measures |
|---|---|
| Reliability | Completion rate on committed transactions |
| Integrity | Dispute rate and resolution outcomes |
| Capacity | Transaction value range and consistency |
| Community standing | Depth of community relationships and endorsements |
| Temporal consistency | How long the reputation profile has been maintained |

**Reputation portability:**

A participant's reputation is portable across all Zivana-integrated applications. A seller on a Zivana-integrated marketplace carries the same reputation to a Zivana-integrated lending platform. This is the core value proposition of the Reputation Primitive — it breaks the platform-specific reputation silo.

**Reputation decay:**

Reputation is not permanent. Inactive reputation dimensions decay over time at defined rates. This prevents historical reputation from masking current behaviour and ensures reputation signals remain current.

### Primitive 4 — Governance Primitive

**Repository:** `zivana-labs/zivana-governance`
**Status:** Design phase

The Governance Primitive provides the on-chain governance infrastructure for the Zivana Protocol itself and for communities and organisations building on Zivana. It enables structured, verifiable, and transparent decision-making without requiring participants to trust a central authority.

**How it works at the protocol level:**

The Governance Primitive implements a modular governance framework with three layers:

**Layer 1 — Protocol governance**
Decisions about the Zivana Protocol itself — parameter changes, primitive upgrades, treasury allocations — are made by $ZVN token holders through an on-chain voting mechanism. Votes are weighted by token holdings with quadratic weighting options to prevent plutocratic capture.

**Layer 2 — Community governance**
Communities and organisations building on Zivana can deploy their own governance instances using the Governance Primitive. A market association can use it to vote on membership rules. A cooperative can use it to make collective lending decisions. The governance rules are configurable within protocol-defined boundaries.

**Layer 3 — Validator governance**
Community validators — participants who attest to identity and reputation claims — are governed by a separate process that manages validator admission, performance monitoring, and removal. This ensures the trust signals feeding the Trust and Reputation Primitives remain reliable.

**Governance mechanisms supported:**

| Mechanism | Use case |
|---|---|
| Simple majority vote | Routine operational decisions |
| Supermajority vote | Constitutional changes, primitive upgrades |
| Conviction voting | Long-term resource allocation |
| Delegated voting | Participants delegating votes to trusted representatives |
| Multisig approval | High-value treasury transactions |

**Midnight integration:**

Governance votes can be cast privately using Midnight's selective disclosure. A participant can prove they voted without revealing which option they chose — enabling secret ballots for sensitive decisions while maintaining verifiability that votes were cast by eligible participants.

### Primitive 5 — Market Intelligence Primitive

**Repository:** `zivana-labs/zivana-intelligence`
**Status:** Early design phase

The Market Intelligence Primitive is the most recently defined primitive. It addresses a specific gap in the informal economy — the absence of structured market data. Informal markets generate enormous amounts of economic signal but almost none of it is captured, structured, or made accessible in useful form.

**How it works at the protocol level:**

The Market Intelligence Primitive creates a decentralised market data network. Participants — traders, market reporters, cooperative members — contribute structured market observations: prices, volumes, availability, demand signals, and supply chain conditions. These observations are:

- Verified for plausibility using statistical methods and cross-referencing
- Attributed to verified participants using the Identity Primitive
- Weighted by the contributor's Reputation score
- Aggregated into structured market intelligence feeds

**The Market Reporter Network:**

A key component of the Market Intelligence Primitive is the Market Reporter Network — a WhatsApp-based network of informal market participants who report structured price and availability data from their local markets. Reports are submitted via WhatsApp bot, parsed, validated, and ingested into the protocol.

The Market Reporter Network provides:
- Real-time price discovery for informal market goods
- Supply chain disruption signals
- Demand forecasting inputs for community cooperatives
- Hyperlocal economic indicators not captured by any existing data source

**Incentive structure:**

Market reporters earn $ZVN tokens for verified, accurate contributions. The accuracy verification uses a combination of cross-reporter consensus, statistical outlier detection, and retroactive validation against observable market outcomes. Reporters who consistently contribute accurate data build a Reputation score within the Intelligence Primitive that increases their reward weighting.

**Data access:**

Market intelligence feeds are available via the Zivana Protocol API. Access tiers:

| Tier | Access | Cost |
|---|---|---|
| Public | Aggregate indicators, lagging data | Free |
| Verified | Real-time feeds, granular data | $ZVN staking |
| Institutional | Raw contributor data, API access | Partnership agreement |

---

## 5. Technology Foundation

### Blockchain

| Layer | Technology | Purpose |
|---|---|---|
| Settlement | Cardano | On-chain identity anchors, token, governance votes |
| Smart contracts | Aiken | Protocol contracts — deterministic, formally verifiable |
| Privacy | Midnight | Zero-knowledge proofs, selective disclosure |
| Interoperability | Cardano Partner Chains | Future cross-chain trust portability |

### Backend and Infrastructure

| Component | Technology | Purpose |
|---|---|---|
| Web application | Next.js 14, TypeScript | Contributor portal, admin panel, public site |
| Database | Supabase (PostgreSQL) | Contributor data, tasks, contributions, points |
| Authentication | Supabase magic link | Passwordless auth with implicit flow |
| Email | Brevo | Transactional emails — approvals, reminders, assignments |
| Notifications | Telegram Bot API | Deadline reminders, protocol updates |
| Deployment | Vercel | Web application hosting, cron jobs |
| CDN and DNS | Cloudflare | Domain management, DDoS protection, email routing |
| Agent orchestration | Fetch.ai Agentverse | AI agent deployment for protocol automation |
| Compute | ASI Cloud | Distributed compute for protocol operations |

### SDK and Developer Tools

| Package | Registry | Purpose |
|---|---|---|
| `@zivana-dev/sdk-ts` | npm | TypeScript SDK for protocol integration |
| `@zivana-dev/sdk-js` | npm | JavaScript SDK for protocol integration |
| `zivana-sdk` | PyPI | Python SDK for data science and research integrations |

### Domains

| Domain | Purpose |
|---|---|
| `zivana.network` | Primary protocol website and contributor portal |
| `sovela.app` | Sovela application domain |

---

## 6. Current Build State

### Live and Operational

**zivana.network** — The protocol website and contributor portal is live. It includes:

- Public marketing site — homepage, protocol, technology, litepaper, build, brand pages
- Contributor registration and approval flow
- Contributor portal — dashboard, task board, contribution submission, leaderboard, profile management
- Admin panel — contributor management, contribution verification, task management, core team management
- Deadline reminder system via email and Telegram
- Points and leaderboard system with automatic multiplier calculation

**GitHub organisation** — `github.com/zivana-labs` with eleven active repositories:

| Repository | Purpose |
|---|---|
| `zivana-web` | Main website and contributor portal |
| `zivana-review-service` | Automated contribution review service (in progress) |
| `zivana-sdk-ts` | TypeScript SDK |
| `zivana-sdk-js` | JavaScript SDK |
| `zivana-sdk-py` | Python SDK |
| `zivana-trust` | Trust Primitive (design phase) |
| `zivana-identity` | Identity Primitive (design phase) |
| `zivana-reputation` | Reputation Primitive (design phase) |
| `zivana-governance` | Governance Primitive (design phase) |
| `zivana-intelligence` | Market Intelligence Primitive (design phase) |
| `zivana-contracts` | Aiken smart contracts |

### In Active Development

**Automated Contribution Review Service** — A webhook-based microservice that automatically evaluates contribution submissions using Claude Haiku before they reach core team review. Phase 1 (basic evaluation and scoring) is in active development. Phase 2 (deep content review, GitHub API integration, code security audit) follows immediately after.

**Sovela** — The flagship Zivana application. Sovela is a contributor and community management platform that demonstrates the Zivana trust primitives in a real-world context. The MVP exists with a Next.js frontend, Node.js backend, PostgreSQL database, and Aiken smart contracts. Active development resumes after the contributor portal infrastructure is stable.

### Planned — Protocol Layer

The five protocol primitives are in design and early research phases. Protocol development begins with the Identity Primitive (foundation for all others) followed by Trust, Reputation, Governance, and Market Intelligence in sequence. Smart contract development in Aiken begins in parallel with the Identity Primitive design finalisation.

---

## 7. The Contributor Model

### Who Can Contribute

Zivana accepts contributors who can meaningfully advance the build across any of the five task categories. There is no minimum experience requirement but contributions must meet the quality standards defined in the verification rubric for each category.

Contributors can be individuals or teams. Team contributors register under a team name and the points allocation applies to the team collectively.

### The Contribution Lifecycle

Register → Apply → Approved → Claim task → Submit work → Core team verifies → Points awarded

**Registration** — Complete the three-step registration form at `zivana.network/contribute/register`. Provide your name, categories, skills, availability, and links.

**Application review** — The core team reviews every application. You will receive an email when your application is approved. Approval is based on the quality and relevance of your stated skills and experience.

**Claiming tasks** — Browse open tasks on the task board. You can hold a maximum of two active claims simultaneously. Each task has a deadline that begins counting from the moment you claim it.

**Submitting work** — Submit your work before the deadline through the contributor portal. Include a clear description of what you built or did and a link to the evidence — a GitHub PR, a deployed URL, a document, or any verifiable artifact.

**Verification** — The core team reviews every submission. Verified submissions receive points. Rejected submissions receive detailed feedback explaining what needs to be improved for resubmission.

**Points** — Points are awarded immediately on verification and reflected on the public leaderboard. Points are the basis for $ZVN token allocation at token launch.

### Contributor Types

| Type | Description |
|---|---|
| Individual | Single contributor working independently |
| Team | Two or more contributors working collectively under a team name |

### Contributor Status

| Status | Meaning |
|---|---|
| Pending | Application submitted, awaiting core team review |
| Active | Approved — can claim tasks and submit contributions |
| Inactive | Deactivated — cannot claim or submit |

---

## 8. Task Categories

### Technical

Covers all software development work — smart contracts, backend services, frontend interfaces, SDKs, APIs, developer tooling, infrastructure, and security.

**What good looks like:**
- Working code that solves a clearly defined problem
- Code is readable, well-structured, and includes meaningful comments where needed
- Error handling is present and thoughtful
- A PR or commit history shows the development process
- Any security-sensitive code has been considered from an adversarial perspective
- For smart contracts — formal verification considerations are documented

**Evidence:** GitHub PR link, deployed URL, or repository link with a specific commit reference.

### Design

Covers all visual and interaction design work — UI/UX design, brand design, illustration, motion design, design systems, and user research.

**What good looks like:**
- Designs follow the Zivana brand guidelines — colour tokens, typography, and design language
- UI designs include both desktop and mobile states
- Interactive designs include hover, active, and error states
- Design files are organised and named consistently
- User research includes methodology, participant details, and findings

**Evidence:** Figma file link with view access, exported asset files, or a research document.

### Research

Covers protocol research, ecosystem analysis, competitive landscape, user research, economic modelling, and technical feasibility studies.

**What good looks like:**
- Research question is clearly stated and the methodology is explained
- Sources are cited and verifiable
- Findings are distinct from recommendations — they are clearly separated
- Conclusions are proportionate to the evidence — no overreach
- For economic modelling — assumptions are stated explicitly

**Evidence:** Document link (Google Docs, Notion, or PDF) with view access.

### Operations

Covers project management, documentation, process design, legal research, partnership development, and organisational operations.

**What good looks like:**
- Deliverables are clearly defined and complete
- Documentation is accurate, current, and written for the intended audience
- Process designs include edge cases and exception handling
- Legal research identifies jurisdiction-specific considerations

**Evidence:** Document link, completed process artifact, or a measurable operational outcome.

### Community

Covers community building, event organisation, educational content, ambassador work, social media presence, and ecosystem partnerships.

**What good looks like:**
- Events include a post-event report with attendance, outcomes, and photos or recordings
- Educational content is accurate, clearly structured, and attributed to Zivana correctly
- Community work has a measurable output — new members, reach, engagement, or partnerships initiated
- Ambassador work represents Zivana accurately and professionally

**Evidence:** Event report, content link, social post with engagement metrics, or a partnership introduction with context.

---

## 9. Points and Allocation System

### How Points Are Calculated

Every verified contribution earns points calculated as:

final_points = base_points × timing_multiplier × consistency_multiplier

**Base points** — set by the core team within the predefined range for the category and complexity:

| Category | Small | Medium | Large |
|---|---|---|---|
| Technical | 50–120 | 150–280 | 300–500 |
| Design | 30–80 | 80–160 | 180–300 |
| Research | 50–100 | 100–200 | 200–400 |
| Operations | 30–60 | 80–150 | 150–200 |
| Community | 10–30 | 60–120 | 100–150 |

**Timing multiplier** — rewards early submission relative to the deadline:

| Submission timing | Multiplier |
|---|---|
| Within first 50% of deadline window | 1.2x — early bonus |
| Between 50% and 100% of deadline window | 1.0x — base |
| Past deadline | 0.8x — late penalty |
| Community category | Always 1.0x — exempt |

Timing is calculated using the server clock at the moment of submission — not the contributor's local time.

**Consistency multiplier** — rewards sustained contribution:

| Verified contributions | Multiplier applied |
|---|---|
| 1–4 | 1.0x |
| 5 and above | 1.2x — retroactively applied to all verified contributions |

When a contributor reaches 5 verified contributions the 1.2x consistency multiplier is applied retroactively to all their existing verified contributions and their total points are recalculated.

### Deadline Structure

| Complexity | Deadline | Extension |
|---|---|---|
| Small | 3 days from claim | +1 day |
| Medium | 6 days from claim | +2 days |
| Large | 12 days from claim | +3 days |

Extensions must be requested before the original deadline expires. One extension per task claim. Extensions are reviewed and granted by the core team.

### $ZVN Token Allocation

The $ZVN token is the native token of the Zivana Protocol settled on Cardano. A portion of the total $ZVN supply is allocated to contributors. The exact supply, contributor allocation percentage, and vesting schedule are TBD and will be published before token launch.

Points earned during the contribution period convert proportionally to $ZVN allocation. A contributor with 1,000 points when the contributor pool has a total of 100,000 points across all contributors holds a 1% claim on the contributor allocation.

Points accumulate from the beginning of the contribution period. Early contributors who build the highest point totals before token launch benefit most from the proportional allocation model.

### Leaderboard

The public leaderboard at `zivana.network/contribute/leaderboard` shows all active contributors ranked by total points. It is updated in real time as contributions are verified.

---

## 10. Tech Stack

Contributors working on the web application and infrastructure will work with these technologies:

### Web Application — `zivana-web`

| Layer | Technology |
|---|---|
| Framework | Next.js 14, App Router, TypeScript |
| Styling | Tailwind CSS with inline brand token styles |
| Database | Supabase — PostgreSQL with Row Level Security |
| Auth | Supabase magic link, implicit flow |
| Rich text | Tiptap |
| Email | Brevo REST API |
| Notifications | Telegram Bot API via grammy |
| Deployment | Vercel |

### Smart Contracts — `zivana-contracts`

| Layer | Technology |
|---|---|
| Language | Aiken |
| Target | Plutus Core on Cardano |
| Testing | Aiken built-in test framework |
| Off-chain | Lucid or Mesh for transaction building |

### Protocol Services

| Service | Technology |
|---|---|
| Review service | Node.js, TypeScript, Claude Haiku via Anthropic API |
| Agent orchestration | Fetch.ai Agentverse |
| Compute | ASI Cloud |

### Design

| Tool | Purpose |
|---|---|
| Figma | UI/UX design, prototyping, design system |
| Brand guidelines | Available at `zivana.network/brand` |

### Brand Colour Tokens

| Token | Hex | Use |
|---|---|---|
| Void | `#0D0B14` | Page background |
| Depth | `#13101E` | Card background |
| Shadow | `#1E1640` | Elevated surfaces |
| Border | `#1C1730` | All borders |
| Core | `#6D28D9` | Primary actions |
| Lavender | `#A78BFA` | Active states, links |
| Light | `#E8E6F0` | Primary text |
| Mute | `#7B6FA8` | Secondary text |

### Typography

| Font | Weight | Use |
|---|---|---|
| Cabinet Grotesk | 600, 700 | All headings and display text |
| Switzer | 300, 400, 500 | All body text, labels, UI copy |
| Fira Code | 400 | Code blocks, addresses |
| Syne | 800 | Wordmark only — never for anything else |

---

## 11. Getting Started

### Step 1 — Register

Go to `zivana.network/contribute` and click **Get started**. Complete the three-step registration form. You will need:

- Your full name or team name
- The categories you want to contribute in (maximum two)
- Your skills and weekly availability
- At least one link — GitHub, portfolio, LinkedIn, or relevant work sample

### Step 2 — Wait for approval

The core team reviews every application. You will receive an email from `hello@zivana.network` when your application is approved. Approval typically takes 1–3 business days.

### Step 3 — Sign in

Once approved go to `zivana.network/contribute/signin` and enter your registered email. You will receive a magic link. Click it to sign in — the link works on any browser or device.

### Step 4 — Explore the task board

Browse open tasks at `zivana.network/contribute/dashboard/tasks`. Tasks are filtered by category. Read the full description of each task carefully before claiming.

### Step 5 — Claim a task

Click **Claim task** on any open task. You can hold a maximum of two active claims simultaneously. Your deadline starts counting from the moment you claim.

### Step 6 — Submit your work

When your work is ready go to your dashboard and click **Submit work** on the active claim. Provide:

- A clear title describing what you delivered
- A description explaining what you built, what decisions you made, and what the output achieves
- A link to the evidence

### Step 7 — Receive verification

The core team will review your submission. If approved you receive points immediately. If more work is needed you receive detailed feedback.

---

## 12. Governance and Decision-Making

### Current Phase — Core Team Led

Zivana is currently in its foundation build phase. Decision-making authority rests with the core team at NexTrium Global Innovations Ltd. This is intentional — moving fast during early protocol development requires clear decision authority without governance overhead.

As the protocol matures decision-making will progressively decentralise through the Governance Primitive.

### Core Team Structure

| Role | Responsibilities |
|---|---|
| Founder | Final authority on protocol direction, architecture, and key partnerships |
| Lead | Domain leadership — technical, community, research, or operations |
| Reviewer | Contribution verification, task assignment, contributor management |
| Coordinator | Community coordination, event management, partner liaison |

### Protocol Governance — Future State

When the Governance Primitive is deployed $ZVN token holders will participate in protocol governance through on-chain voting. The transition plan:

**Phase 1 — Current:** Core team governance, contributor input via community channels
**Phase 2 — Community council:** Elected contributor representatives participate in protocol decisions alongside core team
**Phase 3 — Token governance:** $ZVN holders vote on protocol parameters, treasury allocations, and primitive upgrades
**Phase 4 — Full decentralisation:** Protocol governed entirely by on-chain mechanisms with core team in an advisory role

### Contributor Input

Contributors are the first community of Zivana stakeholders. Their input on protocol direction, task quality, and build priorities is actively sought through:

- Community calls — regular open calls where the core team shares progress and takes questions
- Proposal submissions — contributors can submit build proposals for tasks they want to define and lead
- Direct feedback — the core team is accessible via community channels for direct input

---

## 13. Community and Communication

### Primary Channels

| Channel | Purpose | Access |
|---|---|---|
| Telegram — Zivana Protocol | Main community channel — updates, discussions, announcements | Public |
| Telegram — Core Team | Internal coordination | Core team only |
| GitHub — zivana-labs | All code, issues, and technical discussion | Contributors with access |
| zivana.network | Portal, task board, leaderboard | All approved contributors |

### Staying Informed

- **Task board** — check regularly for new tasks. High-priority tasks are published without advance notice when build requirements emerge.
- **Leaderboard** — track your standing and see what categories are generating the most verified contributions.
- **Telegram** — all protocol announcements go to the main Telegram channel first.

### Communication Standards

When communicating about Zivana in any public context:

- Represent the protocol accurately — do not speculate about token price, launch dates, or partnerships not publicly confirmed
- Use the correct name — the protocol is **Zivana Protocol**. The token is **$ZVN**. The company is **NexTrium Global Innovations Ltd**.
- Use sentence case in all written communication — the wordmark **ZIVANA** is all caps only in logo contexts
- Do not share internal documents, core team communications, or contributor-only content publicly without explicit approval from the founder

### Code of Conduct

Contributors are expected to:

- Engage respectfully with other contributors and core team members
- Represent their work honestly — do not submit work that is not your own or claim contributions you did not make
- Flag issues promptly — if you find a bug, security issue, or process problem in the protocol or portal report it to the core team immediately rather than exploiting it
- Meet your commitments — if you claim a task and cannot complete it, unclaim it promptly so another contributor can take it

Violations of the code of conduct result in deactivation of contributor status at the core team's discretion.

---

*This document is maintained by NexTrium Global Innovations Ltd and updated as the protocol evolves. For questions contact the core team via the Zivana Protocol Telegram channel or through the contributor portal.*

*Zivana Protocol — zivana.network*