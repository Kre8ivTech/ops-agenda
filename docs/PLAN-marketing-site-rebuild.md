# Rebuild opsagenda.com to match the "Ops Agenda - Marketing Site" mockup

> Status: planned, not yet implemented. Saved here for continuity across
> machines — pick up by reading this file plus the referenced design project.

## Context

The live marketing site (opsagenda.com, `packages/marketing`) doesn't match the
actual approved design. The real mockup lives in the claude.ai/design project
`358b6841-f67a-4979-9550-940a970e4c05`, file `Ops Agenda - Marketing Site.dc.html`
(readable via the `DesignSync` tool's `get_file`/`list_files` methods — this
project is a regular design project, not a design-system project, but those
methods work regardless of project type).

The mockup is a fundamentally different site than what's live:

- **Positioning**: pre-launch / early-access waitlist product (`"Join the
  waitlist"`, `"You're on the list"`), not a live signed-up-already product
  (current site has `Sign in` / `Get started`).
- **IA**: a real multi-page site — Home, How it works, Modules (index + 8
  per-module detail pages), Security & privacy, Pricing, About, Build status
  (changelog), Waitlist — versus the current single scrolling page with
  anchor links.
- **Voice/content**: explicitly frames the product around ADHD/executive
  function (a full "About" page section on this), a "Four promises" /
  "What we will not build" trust section, per-module constraint callouts, a
  honest pre-launch compliance statement (HIPAA/SOC 2/pentest — in progress,
  not claimed), and a phased "Build status" roadmap page.
- **Design tokens already match exactly** — `packages/marketing/src/app/globals.css`
  already defines `--ink #16201b`, `--signal #25724d`, etc., 1:1 with the
  mockup's hex values. This is a content/IA/component rebuild, not a token
  fix.

Goal: rebuild `packages/marketing` so it matches the mockup's structure and
copy, reusing the existing token-driven Tailwind component style already
established in that package (`button.tsx`, `pricing-card.tsx`, `faq-item.tsx`,
`lockup.tsx` — plain function components + Tailwind utility strings, no
shadcn/cva, matching `packages/web/src/components/ui/*`'s conventions).

A related, larger effort — extracting a shared `packages/ui` component-library
package from `packages/web` for `/design-sync` — was scoped in parallel but is
**not** part of this plan; it doesn't block the marketing site and should be
picked up as a separate follow-up. (Findings: tokens in `packages/web/src/app/globals.css`
already match the design spec exactly; existing primitives live in
`packages/web/src/components/ui/{button,select,text-field,textarea}.tsx`;
no shared package or build tooling exists yet in the pnpm workspace; no local
font files exist despite the spec calling for `next/font/local`; the design
handoff's `.dc.html` files use zero CSS classes — everything is inline
hex-value styles, so the styling methodology for a component package is an
open implementation choice, not dictated by the handoff.)

## Scope

### 1. Routing — real pages, not anchor sections

`packages/marketing` is `output: 'export'` (static, S3 + CloudFront, no
server — confirmed in `next.config.ts` / `packages/infra/lib/marketing-stack.ts`).
Convert the mockup's client-side `page` state (`home / how / modules / module
/ security / pricing / about / changelog / waitlist`) into real static routes,
which statically export cleanly and are far better for SEO than one page:

```
src/app/
  layout.tsx          — header nav + footer shell (was per-page in page.tsx)
  page.tsx             — home
  how/page.tsx
  modules/page.tsx     — module index (grid of 8 cards)
  modules/[key]/page.tsx — per-module detail; generateStaticParams() over the 8 module keys
  security/page.tsx
  pricing/page.tsx
  about/page.tsx
  changelog/page.tsx   — "Build status"
  waitlist/page.tsx
```

Nav labels → routes: How it works→`/how`, Modules→`/modules`,
Security→`/security`, Pricing→`/pricing`, About→`/about`, Build status→`/changelog`.
Primary CTA → `/waitlist`. Active-link styling via `usePathname()`.

`launchState` (`Waitlist | Private beta | Live`) and `showPricingAmounts` were
design-tool-only props in the `.dc.html` (its `data-props` panel) — treat them
as build-time constants in a small `src/lib/site-config.ts` (default
`launchState: 'Waitlist'`, `showPricingAmounts: false`), not runtime state,
since the site is static.

### 2. Content — port verbatim from the mockup's script block

The `.dc.html`'s `<script type="text/x-dc">` contains the full copy as JS data:
`MODULES` (8 modules, each with `lede`, `screens`, `covers`, `constraint`,
`constraintWhy`), plus `trustStrip`, `briefRows`, `briefNotes`, `crossFlows`,
`promises`, `secRows`, `neverList`, `complianceChips`, `howSteps`, `aiLimits`,
`pricingLede`, `plans`, `pricingFaq`, `aboutParas`, `efCards`, `notCare`,
`principles`, `phases`, `waitlistFacts`, `footerCols`. Port this data
essentially verbatim into `src/lib/marketing-content.ts` (or split per-page) —
this is the actual copy deck, already final per the design handoff's
"Fidelity: high-fidelity... copy is final and load-bearing" rule
(`design_handoff_ops_agenda_platform/README.md`).

### 3. Components — extend the existing set, same conventions

Reuse as-is: `ButtonLink`, `Lockup`, `FaqItem`. Rewrite/extend:
`PricingCard` (mockup has 3-tier `border/tag/price` variants keyed by plan,
not just `featured`), `BriefPreview` (copy changes to match `briefRows`).

New components needed (same style as existing — plain function component +
Tailwind template strings, colocated in `src/components/`):
`TrustStrip`, `ModuleCard` / `ModuleDetailSections`, `PromiseCard`,
`SecurityRow`, `ComplianceChip`, `CrossFlowCard`, `HowStep`, `PhaseRow`
(changelog), `EfCard` + `PrincipleRow` (about page), `WaitlistForm`.

### 4. Waitlist signup backend

No waitlist mechanism exists anywhere in the repo today (confirmed via
repo-wide search). Add a minimal AWS endpoint, consistent with the rest of
the CDK stack in `packages/infra/lib/`:

- New `packages/infra/lib/waitlist-stack.ts`: DynamoDB table (email, joinedAt)
  + a Lambda behind a Function URL (or API Gateway, matching whatever's
  simplest given no existing API Gateway precedent in this repo — check
  `infra-stack.ts`/`compute.ts` for the existing pattern before choosing) that
  validates + writes the email. Wire into `packages/infra/bin/infra.ts`
  alongside the existing `MarketingStack`.
- `WaitlistForm` client component (`'use client'`, only client component this
  package needs) POSTs to the endpoint URL (passed via a build-time env var,
  following the `NEXT_PUBLIC_*` pattern if one exists in `packages/web`, else
  a plain constant set at build time), shows the mockup's "You're on the
  list" success state on success.

## Verification

- `pnpm --filter @ops-agenda/marketing dev` — click through all 8 routes,
  compare against the live mockup (claude.ai/design project
  `358b6841-f67a-4979-9550-940a970e4c05`, `Ops Agenda - Marketing Site.dc.html`).
- `pnpm --filter @ops-agenda/marketing typecheck && pnpm --filter @ops-agenda/marketing lint`
- `pnpm --filter @ops-agenda/marketing build` — confirm static export succeeds,
  including the 8 pre-rendered `/modules/[key]` pages.
- `cdk synth` / `cdk diff` on the new `waitlist-stack.ts` (packages/infra) —
  do not `cdk deploy` without explicit confirmation, per infra change norms.
- Manual test: submit the waitlist form locally against the deployed (or
  manually invoked) Lambda endpoint, confirm a row lands in DynamoDB and the
  UI shows the success state.
