# OpsAgenda — Sitemap (v3)

*Draft · Jul 26, 2026 · Information architecture for the OpsAgenda web app*

**Product thesis:** OpsAgenda is the source of truth for running your life and businesses — a personal assistant that pulls in as much as possible and tells you what matters.

**Design tension to hold:** the platform must serve both the *reactive* layer (what's coming at you: email, alerts, bills) and the *intentional* layer (what you're trying to achieve: goals, habits, projects). Most tools do only the first. The Plan section exists to make the daily brief answer "important," not just "urgent."

Legend: **[v1]** first release · **[v2]** planned · **[v3]** later · **[SaaS]** needed before selling

---

## Modules are toggleable

Each **module** is (1) **user-enabled** in `Settings > Modules`, and (2) **entitlement-gated** by subscription tier later **[SaaS]**.
Requires a **module registry + entitlement check** in the architecture from day one — nav, routes, and sync jobs all read it.

**Module list:** Plan · Productivity · Finances · Business · Health · Life · Research · Social
*(Dashboard, Ask, Alerts, Settings are always on.)*

---

## 1. Dashboard `/` **[v1]**
Adaptive landing — cards only for enabled modules: brief, priorities, timeline, capacity, goal progress, cash snapshot, alerts, news.

---

## 2. Ask `/ask` **[v1]** — *always on*
Conversational layer over all your data, powered by Bedrock. "What did I spend on contractors last quarter?" · "What am I forgetting this week?" · "Which entity is eating my time?"
Also available as a persistent ⌘K surface from any page. Answers cite the underlying records. Read-only by default; actions require approval.

---

## 3. Plan `/plan` — *the intentional layer*

| Page | Path | Notes |
|---|---|---|
| **Goals** | `/plan/goals` | **[v1]** Annual/quarterly goals, milestones, progress. Links tasks and projects to outcomes. |
| **Habits** | `/plan/habits` | **[v2]** Recurring practices, streaks, gentle nudges. |
| **Projects** | `/plan/projects` | **[v2]** Cross-cutting work — bigger than a task, smaller than an entity. Spans modules. |
| **Journal** | `/plan/journal` | **[v2]** Daily notes, decision log, reflections. Universal quick-capture inbox for stray thoughts. |
| **Review** | `/plan/review` | **[v3]** Weekly/quarterly review ritual — what moved, what stalled, what to drop. |

---

## 4. Productivity `/productivity`

| Page | Path | Notes |
|---|---|---|
| **Briefs** | `/productivity/briefs` | **[v1]** Daily Ops Brief + Weekly Outlook + archive. North star. |
| **Email** | `/productivity/email` | **[v1]** Unified priority inbox, all accounts + shared mailboxes. P1/P2/P3/FYSA. |
| **Calendar** | `/productivity/calendar` | **[v1]** Combined across all Microsoft + Google calendars. |
| **Tasks** | `/productivity/tasks` | **[v1]** Microsoft To Do + AI-detected due-outs. |
| **Capacity** | `/productivity/capacity` | **[v1]** Weekly load vs. available hours, overcommitted days, focus capacity. |
| **Time** | `/productivity/time` | **[v2]** Time tracking — billable hours per client/entity. Completes the time-vs-revenue insight. |
| **Contacts** | `/productivity/contacts` | **[v2]** Professional contacts across mailboxes; last touch, open threads. |

> **Cross-module insight (differentiator):** time spent per entity vs. revenue per entity — only possible because OpsAgenda holds calendar *and* financial data.

---

## 5. Finances `/finances` — *module*

| Page | Path | Notes |
|---|---|---|
| **Overview** | `/finances` | **[v1]** Cash on hand, in vs out, safe-to-spend, runway. |
| **Personal** | `/finances/personal` | **[v1]** |
| **Business** | `/finances/business` | **[v1]** Roll-up + entity switcher. |
| ↳ Company page | `/finances/business/[company]` | **[v1]** Kre8ivHosting, Kre8ivTech, Kre8ivDesigns, Vecturae Consultants. |
| ↳ Add company | `/finances/business/new` | **[v1]** |
| **Subscriptions** | `/finances/subscriptions` | **[v1]** Recurring charges; new/rising/duplicate/unused flags. |
| **Budgets** | `/finances/budgets` | **[v1]** Limits, progress, warnings. |
| **Taxes** | `/finances/taxes` | **[v1]** Quarterly estimates, set-aside tracker, 1099s + missing W-9s, deductions, accountant handoff, deadlines. |
| **Forecast** | `/finances/forecast` | **[v2]** 30/60/90-day outlook. |
| **Investments** | `/finances/investments` | **[v2]** |
| **Insurance** | `/finances/insurance` | **[v2]** Policies, premiums, renewals. |
| **Documents** | `/finances/documents` | **[v2]** Receipts, statements, invoices. Feeds Taxes. |
| **Reports** | `/finances/reports` | **[v2]** Exports, accountant handoff. |

---

## 6. Business `/business` — *module* — **new**

> Rationale: with 20+ LLCs, entity administration is its own operational domain. A missed annual report can administratively dissolve a company — this is the highest-consequence blind spot in the product.

| Page | Path | Notes |
|---|---|---|
| **Entities** | `/business/entities` | **[v1]** All companies — formation date, state, EIN, status, registered agent, ownership. |
| ↳ Entity detail | `/business/entities/[id]` | **[v1]** Everything for one company: filings, docs, finances link, deadlines. |
| **Compliance** | `/business/compliance` | **[v1]** Annual reports, franchise tax, registered agent renewals, business licenses, permits — with deadline alerts per entity. |
| **Pipeline** | `/business/pipeline` | **[v2]** Deals, proposals, opportunities, follow-ups. Consulting + GovCon. *Decide: integrate with PursuitIQ or standalone.* |
| **Contracts** | `/business/contracts` | **[v2]** Agreements, MSAs, SOWs, NDAs — terms, renewal/expiration dates. |
| **Vendors** | `/business/vendors` | **[v3]** Suppliers, contractors, W-9s (feeds Taxes). |

---

## 7. Health `/health` — *module* **[v2]**

> ⚠️ **Compliance flag:** health data is a special category under most privacy laws. Low risk for personal use; **as sold SaaS it raises the bar** — explicit consent, encryption, deletion rights, possibly separate storage. Ships after core, with its own privacy review.

**Scope: whole-person wellbeing** — physical, nutritional, spiritual, medical.

| Page | Path | Notes |
|---|---|---|
| **Overview** | `/health` | Daily snapshot across all areas. |
| **Exercise** | `/health/exercise` | Workouts, activity, streaks, goals. Apple Health / Google Fit / wearable import. |
| **Food** | `/health/food` | Meals, hydration, nutrition patterns. Optional meal planning. |
| **Mental** | `/health/mental` | Mood and stress check-ins, sleep quality, therapy/counseling appointments, reflection prompts, coping practices that work for you. Surfaces patterns over time. |
| **Spiritual** | `/health/spiritual` | Prayer, scripture reading plans, devotionals, journaling, gratitude, service. |
| **Appointments** | `/health/appointments` | Providers, follow-ups. Feeds main calendar. |
| **Medications** | `/health/medications` | Prescriptions, refill reminders. |
| **Metrics** | `/health/metrics` | Weight, BP, labs, trends. |
| **Records** | `/health/records` | Documents, results, claims. Links to Finances > Insurance. |

**Design principle:** encouraging and non-judgmental. Track streaks and progress, not shame. No calorie-policing, no "you failed" messaging, no default weight-loss framing. Alerts are gentle practical reminders (refill due, appointment tomorrow) — never nagging about food or body metrics.

### Mental health — specific design requirements

This page carries more responsibility than the others. Non-negotiables:

- **Not diagnostic.** Never imply clinical assessment, screening scores, or diagnosis. It reflects what the user logs; it doesn't evaluate them.
- **Support, don't just chart.** If check-ins show a sustained low pattern, respond with care — offer the option to surface support resources or reach a trusted contact. Never gamify, streak-shame, or send "your mood is down" as a bare notification.
- **Crisis resources available, never forced.** A discreet, always-reachable link to current crisis support (e.g. 988 Suicide & Crisis Lifeline in the US). Verify resources are current at build time — they change.
- **User controls visibility.** Mental health data should be excludable from the Dashboard, briefs, and Ask results. Some days you don't want it on the home screen.
- **Highest privacy tier.** Most sensitive category in the product — encrypted, exportable, deletable, and never used for analytics or model training.

**Cross-module insight (valuable, handle with care):** stress and mood can be correlated with calendar load, sleep, and financial pressure — "your hardest weeks follow days with 6+ meetings." Genuinely useful. Present as an observation the user can act on, never as causation or judgment.

> **Spiritual note:** fits the existing brand family (Christian Leaders Connect, Inspired by Faith Co.). Keep content user-configurable rather than assuming one tradition.

---

## 8. Life `/life` — *module* — **new**

| Page | Path | Notes |
|---|---|---|
| **Home** | `/life/home` | **[v2]** Property, maintenance schedules, warranties, home inventory (for insurance claims). |
| **Vehicles** | `/life/vehicles` | **[v2]** Registration, inspection, maintenance, insurance renewals. |
| **People** | `/life/people` | **[v2]** Personal CRM — family and friends, birthdays, anniversaries, gifts, "haven't connected in a while" nudges. |
| **Travel** | `/life/travel` | **[v2]** Trips, itineraries, loyalty programs; expenses feed Finances. |
| **Documents** | `/life/documents` | **[v2]** Passports, licenses, IDs, certifications with expiration alerts, estate documents. |
| **Education** | `/life/education` | **[v1]** Courses, assignments, deadlines, degree progress (Liberty, Ivy Tech), certifications and CEU expirations. |
| **Continuity** | `/life/continuity` | **[v3]** Critical information access for emergencies. Sensitive — needs careful access design. |

---

## 9. Research `/research` — *module*

Research is **contextual** — triggered from anywhere. Select an email, transaction, contact, or opportunity → "Research this" → Seek investigates → save to Library.

| Page | Path | Notes |
|---|---|---|
| **Seek** | `/research/seek` | **[v2]** AI research agent; sourced findings. |
| **Library** | `/research/library` | **[v2]** Saved research, notes, reference material. Tagged, searchable. |
| **News** | `/research/news` | **[v2]** RSS feeds by topic (GovCon, AI, clients, industry), AI-summarized digest, save to Library. |

---

## 10. Social `/social` — *module* **[v2]**

> **Scope caution:** full publishing requires per-platform app review (Meta, LinkedIn, X) — weeks of approvals plus maintenance. Start at calendar + drafts.

| Page | Path | Notes |
|---|---|---|
| **Calendar** | `/social/calendar` | **[v2]** Content calendar per brand/entity. |
| **Drafts** | `/social/drafts` | **[v2]** Compose copy, attach Canva assets, approve. |
| **Publishing** | `/social/publishing` | **[v3]** Scheduling/posting via platform APIs. |
| **Analytics** | `/social/analytics` | **[v3]** Engagement per brand. |

---

## 11. Alerts `/alerts` **[v1]**
Central feed across enabled modules: low balance, unusual charges, failed payments, overdue invoices, new subscriptions, budget overruns, **compliance deadlines**, **document/certification expirations**, deadline risk, capacity overload, appointment and refill reminders.
Acknowledge, snooze, jump to source. Channels in Settings > Notifications.

---

## 12. Settings `/settings`

| Page | Path | Notes |
|---|---|---|
| **Profile** | `/settings/profile` | **[v1]** |
| **Modules** | `/settings/modules` | **[v1]** Enable/disable modules. Entitlement-aware. |
| **Security** | `/settings/security` | **[v1]** Password, MFA, sessions, audit log. |
| **Integrations** | `/settings/integrations` | **[v1]** Microsoft (multi), Google (multi), shared mailboxes, Stripe, PayPal, Plaid, RSS, health sources, school accounts. Per-connection health. |
| **Automations** | `/settings/automations` | **[v2]** User-defined rules — "when an invoice is 30 days overdue, text me." Turns the platform from passive to active. |
| **Notifications** | `/settings/notifications` | **[v1]** Which alerts, which channel, thresholds, quiet hours. |
| **Entities** | `/settings/entities` | **[v1]** Manage companies (admin view; rich detail lives in Business). |
| **Billing** | `/settings/billing` | **[SaaS]** Customer's plan — determines module entitlements. |
| **Team** | `/settings/team` | **[v3]** Members, roles. |

---

## 13. Global (persistent, not nav items)
- **Search** — across email, transactions, documents, research, contacts.
- **Command palette** (⌘K) — navigation + Ask.
- **Entity switcher** — filters the app.
- **"Research this"** — contextual action on any item.
- **Quick capture** — dump a thought from anywhere → Plan > Journal.
- **Help** **[SaaS]**

---

---

# Part B — Authentication & onboarding

Currently missing entirely. Required before anyone (including you) can use a hosted build.

## 14. Auth `/auth` **[v1]**

| Page | Path | Notes |
|---|---|---|
| **Sign in** | `/auth/signin` | Cognito-backed. Email + password, MFA challenge. |
| **Sign up** | `/auth/signup` | Creates tenant + first user. |
| **Verify email** | `/auth/verify` | Code confirmation. |
| **Forgot / reset password** | `/auth/reset` | |
| **MFA setup** | `/auth/mfa` | TOTP enrollment, recovery codes. |
| **Accept invite** | `/auth/invite/[token]` | **[v3]** Team member joins existing tenant. |
| **Session expired** | `/auth/expired` | Graceful re-auth without losing context. |

## 15. Onboarding `/welcome` **[v1]**
First-run wizard — the highest-leverage screen in the product. If connecting accounts is confusing, nothing else matters.

1. **Welcome** — what OpsAgenda does, what it needs.
2. **Choose modules** — pick what to enable (Finances, Health, Business, etc.).
3. **Connect accounts** — Microsoft (multi), Google (multi), shared mailboxes. Progress per account, clear handling of admin-consent blocks (e.g. school tenants).
4. **Set up entities** — name your companies (or skip).
5. **Connect financial sources** — Stripe, PayPal, Plaid *(only if Finances enabled)*.
6. **Notification preferences** — channels, quiet hours, phone verification for SMS.
7. **First brief** — generate it live so value lands in session one.

Also: **empty states** for every module pre-connection, and a **resumable** wizard (`/welcome?step=n`) — people won't finish in one sitting.

---

# Part C — Public site (opsagenda.com) **[SaaS]**

You own the domain; nothing is designed for it. Required to sell.

| Page | Path | Notes |
|---|---|---|
| **Landing** | `/` | Positioning, hero, proof, primary CTA. |
| **Features** | `/features` | Plus per-module pages (`/features/finances`, `/features/health`…) for SEO. |
| **Pricing** | `/pricing` | Tiers mapped to module entitlements. |
| **Security** | `/security` | Encryption, isolation, data handling. **Non-negotiable** — you're asking for email and bank access; buyers will look for this page. |
| **About** | `/about` | |
| **Blog / Changelog** | `/blog`, `/changelog` | SEO + trust. |
| **Contact / Demo** | `/contact` | |
| **Help / Docs** | `/help` | Setup guides, FAQ, troubleshooting. |
| **Status** | `/status` | Uptime — expected for a data-syncing product. |

### Legal **[SaaS]** — required, not optional
| Page | Path | Notes |
|---|---|---|
| **Privacy policy** | `/legal/privacy` | Must cover financial and health data specifically. |
| **Terms of service** | `/legal/terms` | |
| **Cookie policy** | `/legal/cookies` | |
| **DPA** | `/legal/dpa` | Data processing agreement — business customers will ask. |
| **Subprocessors** | `/legal/subprocessors` | AWS, Plaid, Stripe, Twilio, etc. Required for enterprise trust. |

> Have a lawyer review these. Handling banking credentials and health data raises real obligations — templates aren't sufficient.

---

# Part D — Operator admin `/admin` **[SaaS]**

Your view as the business owner. Distinct from customer Settings.

| Page | Path | Notes |
|---|---|---|
| **Tenants** | `/admin/tenants` | Customer list, plan, status, health. |
| **Usage** | `/admin/usage` | API/Bedrock consumption per tenant — drives cost + pricing. |
| **Support** | `/admin/support` | Impersonation (audited, consented), issue triage. |
| **Feature flags** | `/admin/flags` | Roll out modules gradually. |
| **Revenue** | `/admin/revenue` | MRR, churn, conversions. |

---

# Part E — System & states **[v1]**

Easy to forget, always needed.

- **404 / 500 / maintenance** pages
- **Offline / sync-failed** — a connection dropped; show which source and how to fix
- **Empty states** — every list before data exists (an invitation, not an apology)
- **Loading / skeleton** states — dashboard target is <2s
- **Permission denied** — module not enabled or not in plan → upgrade prompt
- **Trial / past-due / cancelled** account states **[SaaS]**
- **Account deletion + data export** — legally required, and trust-building

---

## Deliberately excluded
- **Password vault** — storing credentials massively increases security burden for little gain. Integrate with 1Password/Bitwarden instead.

## Open questions
1. **Pipeline vs. PursuitIQ** — integrate or keep separate products?
2. **Social depth** — drafts only, or full publishing?
3. **Health timing/privacy** — personal-only first, or built for sale from the start?
4. **Subscription tiers** — which modules in which package? (Drives the entitlement model.)
5. **Investments** — v1 or later? No provider chosen.
6. **Continuity** — how much sensitive data, and who can access it?
