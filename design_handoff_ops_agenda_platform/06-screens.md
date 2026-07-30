# 6. Screens

Behavioural spec: `design/Ops Agenda - Prototype.dc.html`. Open it and click through before building — it is the fastest way to understand the cross-module flows, which are the point of the product.

## 1. Route inventory

11 nav groups. Counts shown are the live badges in the prototype's sidebar (illustrative fixtures, not fixed values).

| Group | Screens | Notes |
|---|---|---|
| **Dashboard** | — | Solo. The landing view: today's ranked agenda, metrics, at-risk items |
| **Ask** | — | Solo. Conversational surface over the user's own data (`04-ai-bedrock.md §4`) |
| **Plan** | Goals, Habits, Projects, Journal, Review | Projects and Journal are custom-built, not table-scaffolded |
| **Productivity** | Briefs, Email (17), Calendar (4), Tasks (6), Capacity, Time, Contacts | Email is a **ranking** surface, not a mail client (`03-security-compliance.md §5`) |
| **Finances** | Overview, Personal, Business, Subscriptions (3), Budgets, Taxes, Forecast, Investments, Insurance, Documents, Reports | Largest group. Forecast is derived, never stored as a projection |
| **Business** | Entities (21), Compliance (2), Pipeline, Contracts, Vendors | Entities, Compliance, Pipeline and Vendors detail are custom-built |
| **Health** | Overview, Exercise, Food, Mental, Spiritual, Appointments, Medications, Metrics, Records | No scoring, ever (`§4`) |
| **Life** | Home, Vehicles, People, Travel, Documents, Education, Continuity | Continuity is the break-glass module — gate it (`03-security-compliance.md §6`) |
| **Research** | Seek, Library, News | Seek is the research agent; citations are real rows |
| **Alerts** | — | Solo (5). Cross-module alert inbox |
| **Settings** | Profile, Modules, Security, Integrations (2/3), Automations, Notifications, Entities, Billing, Team | Integrations owns connection health; Modules owns enable/disable |

Module gating: Plan, Productivity, Finances, Business, Health, Life, Research, Social are user-toggleable and plan-limited. **A module that is off is absent** — not greyed, not empty-stated. Dashboard, Ask, Alerts and Settings are always present.

Plans: **Personal** $19/mo (Plan, Productivity; 1 entity) · **Professional** $39/mo (+ Finances, Research; 3 entities) · **Operator** $79/mo (all 8; unlimited).

> Social (Calendar, Drafts, Publishing, Analytics) is designed and in the prototype but **Publishing shows 0 of 4 platforms connected and 3 app reviews required**. Treat the whole group as a post-launch phase — per-platform app review is a multi-week external dependency.

## 2. The scaffolded table — build this first, build it well

~35 collection screens share one component. Get it right once and most of the app is done; get it wrong and you will fight it 35 times.

**Anatomy (top to bottom).** Page header: eyebrow (group name, `signal`, .76rem 800 uppercase), H1 (1.55rem `-.02em`), one-sentence subtitle (.88rem `text-secondary`, max 78ch), and a primary action button on the right. Then a row of 4 metric cards. Then the table panel: title bar, filter chips + search, header row in `wash` with mono uppercase labels, rows with 1px dividers.

**Row states.** Flagged rows carry a 3px left border in their status colour. Handled rows drop to a plain border — never strikethrough, never grey text.

**Row expansion** reveals a detail panel with the record's fields plus the **why-flagged sentence** in evidence-quote styling. Copy must reflect actual state: a non-flagged row does not get flagged language.

**Per-row actions**, contextual:

| Row state | Actions |
|---|---|
| Flagged | Mark handled · Handle now · Edit record |
| Handled | Reopen · Edit record |
| Neutral | Edit record |

**Filter chips** — All / Needs attention / Settled, each with a live count that updates as rows are handled. Predicates in `02-data-model.md §4`. Counts from one aggregate query, not one per chip.

**Edit** opens a form pre-filled from the row, with fields derived from that screen's own columns — not a generic key/value editor. Saves write back to the table and survive filtering, search and navigation.

**Reset rule:** filter, search and selection reset when the user changes screens. Intentional.

**Server-side by default.** Pagination, sort, filter and search all happen in Postgres — several of these tables will hold tens of thousands of rows. Do not ship a client-side filter over a full fetch.

## 3. Custom screens

These have bespoke interactions and should not be forced into the table pattern:

- **Dashboard** — ranked agenda, metric row, at-risk callouts, cross-module jumps
- **Ask** — streaming conversation, record citations, draft-only outputs
- **Plan → Projects** — milestones, task list, linked records, activity feed
- **Plan → Journal** — body, considered options, rationale, revisit date, follow-ups, tags, typed links to other records
- **Plan → Review** — the keep/shrink/drop ritual with the real cost of each shown
- **Business → Entities** — entity detail with overview/compliance/finance tabs, dormancy and dissolution handling (including the rule that dissolution is not offered while revenue flows through an entity)
- **Business → Compliance** — obligation calendar with jurisdiction, penalty text, reminder ladder
- **Business → Pipeline** — stage board with weighted value and staleness
- **Business → Vendors** detail — W-9 status gating 1099 filing
- **Finances → Overview / Forecast** — committed-flow model, safe-to-spend, traceable figures
- **Health → all** — logging surfaces, trends without verdicts
- **Life → Continuity** — break-glass; do not build without dedicated review
- **Research → Seek** — investigation run with live status and citation list
- **Onboarding wizard** — seven steps (`§5`)
- **Settings → Integrations** — connection health, degraded/pending states, reconnect flow

## 4. Health module — hard constraints

The design is explicit and the copy promises it:

- **Nothing here is scored.** No wellness index, no trend judgement, no alert that fires because a number moved.
- The only automatic behaviour is **refill and appointment reminders**. Never a reminder about a dose, a symptom or a habit.
- Metrics render as **trends, not verdicts**.
- Mental check-ins record what the user writes; support resources can be surfaced *without recording why the user asked*.
- Health data never leaves the tenant, never trains a model, and never appears in any analytics.

Beyond respecting the design, this keeps the feature clear of medical-device and clinical-decision-support territory. Adding scoring is a regulatory decision, not a product tweak.

## 5. Onboarding

Seven steps, each with an eyebrow, title and subtitle (exact copy in the prototype):

1. **Welcome** — what it does: reads what you already have; decides what matters, you decide what happens; watches what you'd notice too late
2. **Choose modules** — turn on only what's needed; anything off is hidden completely
3. **Connect accounts** — every mailbox and calendar actually used, including shared ones. Read-only
4. **Set up entities** — name them once so every deadline, transaction and filing attributes correctly
5. **Financial sources** — balances, transactions, payouts. Read-only: can see, flag and forecast, but never move money
6. **Notifications** — the brief lands every morning; everything else is an interruption, so defaults are quiet
7. **First brief** — run it live with what was connected

Resumable, skippable per step, and honest: if a connector fails, say so rather than showing a fake success. Steps 3 and 5 are where the read-only promise is made in writing — that copy is a compliance representation.

## 6. Connection health

A first-class state, visible in three places: the sidebar (Integrations badge, e.g. `2/3`), a degraded banner in the shell, and Settings → Integrations.

States: `healthy` · `degraded` · `pending` · `revoked`. Pending connections appear in the degraded list so the banner and sidebar agree — a fix already made in the prototype; keep the behaviour.

The banner is **reversible from Settings → Integrations** (reconnect clears it). Copy names the cause and the time: "Two accounts stopped returning calendar data at 4:12 AM." Never a generic error toast.

## 7. Cross-module flows to preserve

These are the product's real value; they are easy to lose when building screen by screen:

- Travel expenses → Finances
- Time entries → Capacity → Project health
- Contract renewal → Compliance calendar + Forecast
- Vendor missing W-9 → blocks 1099 → Taxes
- Certification/CEU progress → Life → Documents expiry watch
- Goal progress derived from Projects, Compliance, Capacity — not entered by hand
- Journal and Project **linked records** — typed references, navigable in both directions
- Research findings → saved to Library → citable in a decision
- Any record → **Seek** investigation
- Everything flagged → the 6:00 brief and Alerts

Build the `record_link` table early (`02-data-model.md §5`). Retrofitting bidirectional typed links across 60 screens is miserable.

## 8. Global chrome

- **Command palette** (⌘K) — jumps to any screen or record; the prototype shows record-level results with their module path
- **Entity switcher** — scopes the current screen; persists per screen, not globally
- **Sidebar counts** — live, on ~12 items simultaneously; one cached aggregate query
- **Degraded banner** — as above
- **Alerts** — cross-module inbox, badge count in the sidebar

## 9. Responsive

The prototype is designed desktop-first at ~1440px and the density assumes it. Below `lg`: sidebar collapses to an overlay, metric cards go 2-up then 1-up, tables become stacked record cards showing priority + title + meta + the why sentence with the rest behind expansion. **Do not horizontally scroll a table on mobile.** Phone is a triage surface — read the brief, mark handled, open a record. Full editing is a desktop affordance.
