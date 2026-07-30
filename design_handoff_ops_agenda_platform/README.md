# Handoff: Ops Agenda — Platform Build

**Target stack:** Next.js (App Router) on AWS, Amazon Bedrock for AI, Aurora PostgreSQL, Cognito auth.
**Audience:** An AI coding agent (Claude Code) or engineering team building the production platform from scratch.
**Prepared:** 29 July 2026 · Design package v1.0

---

## Read these in order

| # | File | What it covers |
|---|------|----------------|
| — | `README.md` (this file) | Product overview, fidelity, ground rules, what is decided vs. open |
| 1 | `01-architecture.md` | AWS topology, Next.js structure, environments, IaC, CI/CD |
| 2 | `02-data-model.md` | Postgres schema, multi-tenancy, entity attribution, module gating |
| 3 | `03-security-compliance.md` | Threat model, encryption, HIPAA/GLBA/SOC 2/CMMC/MHMDA posture, audit |
| 4 | `04-ai-bedrock.md` | The 6:00 brief pipeline, the Seek research agent, RAG, guardrails, evals |
| 5 | `05-design-system.md` | Tokens, type, components, the brand mark, accessibility |
| 6 | `06-screens.md` | Full route inventory, the scaffolded-table contract, per-screen notes |
| 7 | `07-delivery-plan.md` | Phasing, definition of done, launch gates, cost envelope |

Design references live in `design/`. **Read `03-security-compliance.md` before writing any data-handling code** — several decisions there constrain the schema and the hosting choice, and are expensive to retrofit.

---

## What Ops Agenda is

A single operator's command centre. It reads the systems someone already uses — mail, calendar, tasks, bank and card feeds, filings, documents — ranks everything by deadline pressure and ownership, and delivers one prioritised agenda at 6:00 each morning. It proposes; the user approves.

The product is deliberately **read-mostly against external systems**. It does not move money, does not store credentials, and does not file anything with a government. Those constraints are product promises stated in the UI copy, and they are also the reason the compliance surface is tractable. Do not relax them without an explicit decision from the client — several screens make the promise in writing to the user.

### Scope at a glance

- **11 navigation groups**, ~63 screens (full table in `06-screens.md`)
- **8 user-toggleable modules**: Plan, Productivity, Finances, Business, Health, Life, Research, Social
- **3 plans** gating module access: Personal $19/mo, Professional $39/mo, Operator $79/mo
- **Multi-entity**: every deadline, transaction and filing is attributed to a personal context or one of N business entities
- **~35 screens share one scaffolded table pattern** — build it once, well (see `06-screens.md`)
- Cross-module data flow is the point of the product, not a nice-to-have: travel spend lands in Finances, a certification expiry lands in Life → Documents, a project's time lands in Capacity

### The five things that make this product hard

1. **Ranking is the product.** If the 6:00 brief is wrong, nothing else matters. Treat brief quality as a first-class engineering concern with evals, not as a prompt to tune later (`04-ai-bedrock.md`).
2. **Data sensitivity is unusually broad for one app.** Health logs, financial positions, legal filings, estate papers and an emergency-access vault sit in one database. The blast radius of a single tenant-isolation bug is severe (`03-security-compliance.md`).
3. **The Continuity module is a break-glass system.** Emergency access to a living person's critical information, with identity verification, a 72-hour delay and mandatory notification. It is the highest-risk feature in the product and needs its own design review.
4. **Connector reliability is visible to the user.** Degraded sync is surfaced in the sidebar and a banner; the prototype treats it as a first-class state, not an error toast. Build the connector health model early.
5. **Module gating is not cosmetic.** A module that is off must be *absent* — no empty sections, no greyed nav, no data retained beyond the retention window.

---

## About the design files

The files in `design/` are **design references authored in HTML**. They are prototypes that communicate intended layout, copy, interaction and state — they are **not production code and must not be copied into the app**. They use a bespoke template runtime that has nothing to do with the target stack.

Your job is to **recreate these designs in Next.js + React** using the target codebase's own conventions: React Server Components where the data is server-owned, client components for interactive surfaces, Tailwind (or the team's existing styling approach) driven by the tokens in `05-design-system.md`.

Two files matter most:

- `design/Ops Agenda - Prototype.dc.html` — the working app: full navigation, ~63 screens, onboarding wizard, table interactions, forms, cross-module links. This is the behavioural spec.
- `design/Ops Agenda - Login + Dashboard.dc.html` — sign-in and dashboard explorations, including the Cognito hosted-auth split screen.

Supporting references:

- `design/Ops Agenda - Brand Guide.dc.html` — the mark, lockups, clear space, misuse, colour, type, email signature, print, social avatars
- `design/Ops Agenda - Design System.dc.html` — colour tokens with usage rules, type ramp, spacing, buttons, forms, status, surfaces, navigation, voice and motion
- `design/brand/*.svg` — the production mark files. **Use these; never redraw the mark.**

## Fidelity

**High-fidelity.** Colours, type, spacing, radii, copy and interaction states are final and deliberate. Recreate them faithfully:

- Every colour in the product is enumerated in `05-design-system.md`. There are no others. If a screen seems to need a new colour, it needs a decision instead.
- Copy is final and load-bearing. The voice is flat, specific and non-congratulatory ("Procurement is the only thing at risk before noon"). Do not rewrite it into standard SaaS cheerfulness — several strings are also compliance-relevant disclosures.
- Density is intentional. This is a tool for someone who lives in it daily, not a marketing surface.

What is **not** final: the logotype typeface. The prototype and brand guide currently set it in Poppins ExtraBold; a switch to Geist 900 is under discussion. Reference the lockup as a single component so it can be changed in one place.

## What is decided vs. open

**Decided.** Next.js App Router; AWS as the platform; Cognito for identity; Aurora PostgreSQL as the system of record; Bedrock for all inference; read-only external connections; no credential storage; no money movement; no automated filing; 6:00 local-time brief; the 8-module/3-plan structure; the visual system.

**Open — needs a client decision, flagged in place in the docs.**

1. **GovCon data scope.** If Federal Contract Information or CUI will ever be stored (Business → Pipeline mentions GovCon deals), the platform needs NIST SP 800-171 / CMMC Level 2 and likely GovCloud + FedRAMP-authorised services only. This is the single most expensive architectural fork. Resolve before Phase 1 exit. See `03-security-compliance.md §3`.
2. **HIPAA applicability.** Self-logged wellness data is generally outside HIPAA but inside the FTC Health Breach Notification Rule and Washington's My Health My Data Act. Ingesting records *from providers* can make the platform a Business Associate. Legal determination required; engineer to HIPAA Security Rule standards regardless. See `03-security-compliance.md §3`.
3. **Financial aggregation provider** (Plaid vs. MX vs. Finicity) and whether payouts are ever read from processors.
4. **Hosting shape**: ECS Fargate (recommended for the compliance posture) vs. Amplify Hosting (faster to stand up). See `01-architecture.md §2`.
5. **Social publishing** requires per-platform app review; treat as a post-launch phase.

## Ground rules for the build

- **Tenant isolation is enforced in the database**, via row-level security keyed to the authenticated principal — not only in application code. Application-layer-only isolation is not acceptable for this data mix.
- **No PHI, financial detail, or Continuity content in logs, traces, or error reports.** Structured logging with an explicit allowlist of loggable fields.
- **Every state-changing action is audited** to an append-only store with the actor, the before/after, and the justification where one is required.
- **The AI never takes an action.** It ranks, drafts and explains. A human approves every side effect. This is both a product principle and a liability boundary.
- **Every flagged item must be able to explain itself** in one sentence, traceable to the source record. The prototype does this everywhere; it is a hard requirement, not a nicety.
- Accessibility target is **WCAG 2.2 AA**, verified in CI.

## Assets

- Brand mark: `design/brand/ops-agenda-mark-{signal,ink,paper}.svg`, `design/brand/favicon.svg`. Vector only.
- Typefaces: Geist and Geist Mono (self-host via `next/font/local`); Poppins ExtraBold for the logotype only, pending the open question above.
- No photography or illustration exists yet. Screens that need imagery use placeholders — commission or license before launch; do not generate it.
