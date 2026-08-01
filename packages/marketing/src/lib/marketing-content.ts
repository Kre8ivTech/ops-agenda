/**
 * Marketing copy deck, ported verbatim from the approved mockup
 * ("Ops Agenda - Marketing Site.dc.html", design project 358b6841).
 *
 * Per the design handoff, copy here is final and load-bearing — edit it against
 * the mockup, not in passing. Colour decisions are expressed as semantic tones
 * that map to the tokens in `globals.css` rather than raw hex.
 */

export type Tone = 'signal' | 'risk' | 'info' | 'muted';

export interface Module {
  key: string;
  name: string;
  lede: string;
  screens: string[];
  covers: { title: string; body: string }[];
  constraint: string;
  constraintWhy: string;
  /** Social ships after launch; everything else is designed. */
  status: 'Designed' | 'Post-launch';
}

export const MODULES: Module[] = [
  {
    key: 'plan',
    name: 'Plan',
    lede: 'Goals, habits, projects and the quarterly review that decides what to drop.',
    screens: ['Goals', 'Habits', 'Projects', 'Journal', 'Review'],
    covers: [
      {
        title: 'Goals that derive their own progress',
        body: 'Progress comes from linked projects, compliance and capacity — not from a slider you drag when you feel optimistic.',
      },
      {
        title: 'A journal built for decisions',
        body: 'What you considered, why you chose, and when to revisit. Follow-ups and links to the records the decision touched.',
      },
      {
        title: 'The review that makes the ritual work',
        body: 'Keep, shrink or drop, with the real cost of each shown next to it. Stalled items get a named cause.',
      },
    ],
    constraint: 'Nothing here is a streak you can lose.',
    constraintWhy:
      'Habits show what happened. There is no penalty state, no broken-chain guilt, and no notification designed to make you feel behind.',
    status: 'Designed',
  },
  {
    key: 'productivity',
    name: 'Productivity',
    lede: 'Mail, calendar, tasks, capacity and time — ranked, not just collected.',
    screens: ['Briefs', 'Email', 'Calendar', 'Tasks', 'Capacity', 'Time', 'Contacts'],
    covers: [
      {
        title: 'Email that ranks instead of storing',
        body: 'It surfaces the threads awaiting your reply and the commitments you made in writing. It is not a mail client and does not try to be.',
      },
      {
        title: 'Capacity before you agree to things',
        body: "The week's real load, so a yes on Tuesday is an informed yes.",
      },
      {
        title: 'Time that closes the loop',
        body: 'Billable hours per client and entity, completing the time-versus-revenue picture the Finances module needs.',
      },
    ],
    constraint: 'We do not store your message bodies.',
    constraintWhy:
      'Ranking needs metadata and derived signals — sender, timing, whether a reply is owed, whether a date was promised. The content stays with your provider, and we link you back to it.',
    status: 'Designed',
  },
  {
    key: 'finances',
    name: 'Finances',
    lede: 'Personal and business money in one place: positions, obligations and what is genuinely safe to spend.',
    screens: [
      'Overview',
      'Personal',
      'Business',
      'Subscriptions',
      'Budgets',
      'Taxes',
      'Forecast',
      'Investments',
      'Insurance',
      'Documents',
      'Reports',
    ],
    covers: [
      {
        title: 'Safe to spend, not just balance',
        body: 'What you have, what is already committed, and the difference. Every figure traces to a record you can open.',
      },
      {
        title: 'Forecast you can audit',
        body: 'Thirty, sixty and ninety days from committed flows only. Nothing here is a projection you cannot trace.',
      },
      {
        title: 'Tax set-aside that keeps up',
        body: 'Estimates, funding, contractor filings and the accountant handoff pack, per entity.',
      },
    ],
    constraint: 'Read-only. It cannot move money, and it does not file.',
    constraintWhy:
      'Connections are read-only and we hold no permission that could initiate a payment. It calculates, funds the set-aside on paper and prepares the pack — you and your accountant do the filing.',
    status: 'Designed',
  },
  {
    key: 'business',
    name: 'Business',
    lede: 'Entities, compliance deadlines, pipeline, contracts and the vendors that feed your filings.',
    screens: ['Entities', 'Compliance', 'Pipeline', 'Contracts', 'Vendors'],
    covers: [
      {
        title: 'Every entity, attributed correctly',
        body: 'Name your companies once and every deadline, transaction and filing lands against the right one. Dormant entities show what they cost to keep.',
      },
      {
        title: 'Compliance with the penalty attached',
        body: 'Jurisdiction, form, cadence and what missing it actually costs — with a reminder ladder that starts early enough to act.',
      },
      {
        title: 'Contracts before they roll',
        body: 'Auto-renewals surfaced with the notice window still open, not after.',
      },
    ],
    constraint: 'A missing W-9 is a red flag, not a footnote.',
    constraintWhy:
      'Vendors paid over the threshold without a W-9 on file block your 1099 filing. That dependency is shown where it matters rather than discovered in January.',
    status: 'Designed',
  },
  {
    key: 'health',
    name: 'Health',
    lede: 'Physical, nutritional, mental and spiritual — logged, never scored.',
    screens: [
      'Overview',
      'Exercise',
      'Food',
      'Mental',
      'Spiritual',
      'Appointments',
      'Medications',
      'Metrics',
      'Records',
    ],
    covers: [
      {
        title: 'Trends, not verdicts',
        body: 'Weight, blood pressure and labs shown as movement over time. No index, no grade, no colour telling you how you are doing.',
      },
      {
        title: 'Reminders that are actually useful',
        body: 'Refills and appointments. That is the whole list.',
      },
      {
        title: 'Records and claims in one place',
        body: 'Documents, results and what your insurer has reimbursed, linked through to the insurance policy.',
      },
    ],
    constraint: 'Nothing here is scored, and no alert fires because a number moved.',
    constraintWhy:
      'There is no wellness index and no trend judgement. Check-ins are yours. If you want support, we can surface what your plan already covers without recording why you asked.',
    status: 'Designed',
  },
  {
    key: 'life',
    name: 'Life',
    lede: 'Home, vehicles, people, travel, documents, study — and the information someone would need in an emergency.',
    screens: ['Home', 'Vehicles', 'People', 'Travel', 'Documents', 'Education', 'Continuity'],
    covers: [
      {
        title: 'Expiry dates you would otherwise miss',
        body: 'Passports, licences, registrations, certifications and warranties, watched with enough lead time to renew.',
      },
      {
        title: 'People, without gamifying them',
        body: 'Birthdays and occasions, plus a quiet note when it has genuinely been a while. No streaks, no relationship score.',
      },
      {
        title: 'Travel that reaches the books',
        body: 'Trips and itineraries, with spend feeding the finance module rather than living in your inbox.',
      },
    ],
    constraint: 'We will never store your credentials.',
    constraintWhy:
      'Continuity records where things are and who to call, encrypted so we cannot read it. Point it at a password manager for secrets. Emergency access requires identity verification, a 72-hour wait, and you are notified at both ends.',
    status: 'Designed',
  },
  {
    key: 'research',
    name: 'Research',
    lede: 'An agent that investigates from any record, with citations you can check.',
    screens: ['Seek', 'Library', 'News'],
    covers: [
      {
        title: 'Triggered from what you are looking at',
        body: 'Run an investigation from an email, a transaction or a contact — the context comes with it.',
      },
      {
        title: 'Citations as records, not prose',
        body: 'Every claim carries a source with a retrieval date. If a finding has no citation, it does not render as a finding.',
      },
      {
        title: 'A library that stays useful',
        body: 'Save findings and notes, tagged and searchable, citable in a decision later.',
      },
    ],
    constraint: 'Anything fetched from the web is treated as hostile.',
    constraintWhy:
      'Retrieved content cannot instruct the agent or reach a tool. It is data to analyse, structurally separated, and every output is a proposal you approve.',
    status: 'Designed',
  },
  {
    key: 'social',
    name: 'Social',
    lede: 'Content calendar, drafts and approvals per brand and entity.',
    screens: ['Calendar', 'Drafts', 'Publishing', 'Analytics'],
    covers: [
      {
        title: 'Per brand, per entity',
        body: 'A calendar that knows which company a post belongs to, and shows the weeks with nothing in them.',
      },
      {
        title: 'Approve before anything is scheduled',
        body: 'Compose, attach assets, approve. Nothing leaves without a decision.',
      },
      {
        title: 'Engagement where you can act on it',
        body: 'Which brand is working and which is not, next to the calendar you would change.',
      },
    ],
    constraint: 'Publishing is not live yet.',
    constraintWhy:
      'Each platform requires its own app review before an app can post on your behalf. Drafts, calendar and approvals work now; scheduling switches on per platform as reviews complete.',
    status: 'Post-launch',
  },
];

export const TRUST_STRIP = [
  {
    label: 'Read-only',
    body: 'It can see and flag your accounts. It cannot move money or file anything.',
  },
  {
    label: 'No credentials',
    body: 'We never store a password. Connections are held by the provider, revocable by you.',
  },
  {
    label: 'No trackers',
    body: 'No analytics SDK, no session replay, no advertising pixel. Not on the app, not on this site.',
  },
  {
    label: 'No scoring',
    body: 'Your health and habits are reported back to you, never graded.',
  },
];

export interface BriefRow {
  priority: string;
  title: string;
  why: string;
  meta: string;
  /** Left rule colour. */
  accent: 'risk' | 'signal' | 'border';
  /** Priority pill colour. */
  tone: Tone;
  /** Risk items show their date in the risk colour, bold. */
  urgentMeta: boolean;
}

export const BRIEF_ROWS: BriefRow[] = [
  {
    priority: 'P1',
    title: 'Kre8ivTech — annual report',
    why: 'Due in 11 days; the state charges a $250 late fee and dissolves after 60.',
    meta: '9 Aug',
    accent: 'risk',
    tone: 'risk',
    urgentMeta: true,
  },
  {
    priority: 'P1',
    title: 'Resolve procurement follow-up',
    why: 'The vendor has replied twice and the thread still has no owner.',
    meta: '11:00',
    accent: 'risk',
    tone: 'risk',
    urgentMeta: true,
  },
  {
    priority: 'P2',
    title: 'Return signed NDA',
    why: 'You committed to Friday in writing; it is Tuesday and it is unsigned.',
    meta: 'Friday',
    accent: 'signal',
    tone: 'signal',
    urgentMeta: false,
  },
  {
    priority: 'P2',
    title: 'PMP renewal — 44 of 60 CEUs',
    why: 'Deadline is 27 August and the remaining credits take six weeks to earn.',
    meta: '27 Aug',
    accent: 'border',
    tone: 'info',
    urgentMeta: false,
  },
];

export const BRIEF_NOTES = [
  {
    label: 'One list, everything',
    body: 'A filing deadline, an unsigned contract, a certification expiring and a balance about to go short — ranked against each other, because your Tuesday does not separate them.',
  },
  {
    label: 'Ranked by consequence',
    body: 'Not by when it arrived or how loudly it was marked urgent. Deadline pressure, who is blocked, what you own, and what it costs if it slips.',
  },
  {
    label: 'Quiet the rest of the day',
    body: 'The brief lands at 6:00. Everything after that is an interruption, so the defaults are off.',
  },
];

export const CROSS_FLOWS = [
  {
    from: 'Travel → Finances',
    body: 'Trip expenses land in the books instead of sitting in your inbox until quarter end.',
  },
  {
    from: 'Vendors → Taxes',
    body: 'A vendor paid over the threshold without a W-9 blocks your 1099. You find out in July, not January.',
  },
  {
    from: 'Education → Documents',
    body: 'CEU progress drives the certification expiry watch, with the renewal lead time built in.',
  },
  {
    from: 'Time → Projects',
    body: 'Hours logged become capacity, and capacity tells you which project is quietly stalling.',
  },
  {
    from: 'Contracts → Forecast',
    body: 'A renewal ninety days out is revenue in the forecast and a decision on the calendar.',
  },
  {
    from: 'Any record → Research',
    body: 'Investigate a transaction, an email or a counterparty without leaving the record.',
  },
];

export const PROMISES = [
  {
    title: 'It cannot move your money',
    body: 'Financial connections are read-only. We do not hold a permission that could initiate a payment, so no bug and no breach can make one happen.',
  },
  {
    title: 'It never stores a credential',
    body: 'No password vault, by design. Connections are provider-held tokens with the narrowest read scope that works, revocable by you at any time.',
  },
  {
    title: 'We cannot read the sensitive parts',
    body: 'Continuity entries, health check-ins and journal bodies are encrypted per record under a key scoped to your account. No support tool and no database dump reveals them.',
  },
  {
    title: 'It does not assess you',
    body: 'No wellness index, no trend judgement, no alert because a number moved. The product reports what you logged and stops there.',
  },
];

export const SECURITY_ROWS = [
  {
    label: 'Encryption',
    body: 'TLS 1.3 in transit. Customer-managed keys at rest. The most sensitive fields get per-record keys wrapped under a key scoped to your account, so plaintext exists only in the request that shows it to you.',
  },
  {
    label: 'Isolation',
    body: 'Your data is separated at the database level, not just in application code, and the separation is verified by a test suite that blocks every release.',
  },
  {
    label: 'Access',
    body: 'Multi-factor authentication required. A second challenge before viewing continuity entries, changing recovery, adding a financial connection or exporting anything.',
  },
  {
    label: 'Audit',
    body: 'Every state change and every decryption of a sensitive field is written to an append-only log that cannot be altered or deleted — including by us.',
  },
  {
    label: 'AI',
    body: 'Inference runs inside our own cloud boundary. Your data is never used to train a model, and retrieval is scoped to your account alone.',
  },
  {
    label: 'Deletion',
    body: 'Turn a module off and its data is gone in thirty days. Close your account and everything goes, including search indexes and embeddings.',
  },
];

export const NEVER_LIST = [
  {
    title: 'No advertising',
    body: 'There is no version of this funded by knowing what is in your accounts.',
  },
  {
    title: 'No selling or sharing data',
    body: 'Not aggregated, not anonymised, not to a partner.',
  },
  {
    title: 'No third-party trackers',
    body: 'No analytics SDK or session replay in the product, so nobody else sees your screens.',
  },
  {
    title: 'No money movement',
    body: 'Read-only stays read-only. Adding payments would be a different product.',
  },
  { title: 'No automated filing', body: 'It prepares and reminds. A person submits.' },
  { title: 'No health scoring', body: 'No index, no grade, no diagnosis, no advice.' },
];

export const COMPLIANCE_CHIPS: { label: string; tone: Tone }[] = [
  { label: 'HIPAA Security Rule — engineered to', tone: 'signal' },
  { label: 'SOC 2 Type II — in progress', tone: 'info' },
  { label: 'Penetration test — launch gate', tone: 'info' },
  { label: 'GDPR / CCPA — by design', tone: 'signal' },
  { label: 'PCI — card data never touches us', tone: 'signal' },
  { label: 'No certifications claimed yet', tone: 'muted' },
];

export const HOW_STEPS = [
  {
    num: '01',
    title: 'It reads what you already have',
    body: 'Mail, calendar, tasks, transactions, filings and documents. Connect the mailboxes you actually use, including shared ones. Nothing to migrate and nothing new to maintain.',
    detail: 'Read-only scopes · provider-held tokens · revoke any time',
  },
  {
    num: '02',
    title: 'It decides what matters',
    body: 'Every morning it ranks your whole day by deadline pressure, who is blocked, what you own and what it costs if it slips. One list across every module you have turned on.',
    detail: 'Delivered by 06:05 local · every item explains itself',
  },
  {
    num: '03',
    title: 'You decide what happens',
    body: "Mark handled, act now, or reopen something. Approving is the only way anything changes, and what you handle drops off tomorrow's brief.",
    detail: 'No automated actions · no silent changes',
  },
];

export const AI_LIMITS = [
  {
    label: 'It may',
    body: 'Rank, summarise, explain, draft a reply, prepare a report, investigate a question with citations.',
  },
  {
    label: 'It may not',
    body: 'Send, schedule, pay, file, delete, or change a record without your approval.',
  },
  {
    label: 'You can check it',
    body: 'Every flagged item names its reason and links to the record it came from. A claim without a source does not ship.',
  },
];

export interface Plan {
  name: string;
  tag: string;
  tagTone: Tone;
  price: string;
  who: string;
  lines: string[];
  featured: boolean;
}

export const PLANS: Plan[] = [
  {
    name: 'Personal',
    tag: 'Starter',
    tagTone: 'muted',
    price: '$19 / month',
    who: 'One life, one context. The brief plus planning and productivity.',
    lines: [
      'Plan and Productivity modules',
      'One entity',
      'Mail, calendar and task connections',
      'The 6:00 brief',
    ],
    featured: false,
  },
  {
    name: 'Professional',
    tag: 'Most chosen',
    tagTone: 'signal',
    price: '$39 / month',
    who: 'A practice or a side business, with money and research in the picture.',
    lines: [
      'Adds Finances and Research',
      'Up to three entities',
      'Read-only financial connections',
      'Seek investigations with citations',
    ],
    featured: true,
  },
  {
    name: 'Operator',
    tag: 'Everything',
    tagTone: 'muted',
    price: '$79 / month',
    who: 'Several companies alongside a full personal life. All eight modules.',
    lines: [
      'All eight modules',
      'Unlimited entities',
      'Business, Health, Life and Social',
      'Team access, scoped per module and entity',
    ],
    featured: false,
  },
];

export const PRICING_FAQ = [
  {
    question: 'What happens if I turn a module off?',
    answer:
      'It disappears — no empty sections and no greyed-out menu. Data is kept for thirty days so re-enabling is not destructive, then permanently deleted.',
  },
  {
    question: 'What if I downgrade?',
    answer:
      'The modules your new plan excludes become unavailable, but nothing is deleted while your account is open. Upgrade again and it is all there.',
  },
  {
    question: 'Is my card data safe?',
    answer:
      "We never see it. Payment runs through a processor's hosted fields, so a card number never touches our servers.",
  },
  {
    question: 'Can my accountant get in?',
    answer:
      'Team access is scoped per module and per entity — an accountant can see Finances for two companies and nothing else. Every access grant is audited.',
  },
  {
    question: 'Why is Social cheaper to promise than to ship?',
    answer:
      'Posting on your behalf requires a review by each platform before they will grant the permission. Drafts and calendar work now; scheduling switches on per platform as reviews complete.',
  },
  {
    question: 'Will there be a free tier?',
    answer:
      'No. A product that reads your bank accounts and health records should be paid for by you, not by anyone else.',
  },
];

export const ABOUT_PARAGRAPHS = [
  'Ops Agenda began as a spreadsheet, then several spreadsheets, then a folder of reminders that all fired at the wrong time. The surface explanation is that four companies, a family, a degree and a body do not share a calendar. The real one is narrower: the person who needed this has ADHD, and the failure was never effort.',
  'Executive function is the set of things a brain does to run itself — holding a plan in working memory, sensing how much time has actually passed, starting a task whose first step is unclear, and keeping track of what is no longer in front of you. When it works, it is invisible. When it does not, that work does not vanish. It becomes conscious, and it has to be redone every single morning.',
  'Which is why conventional productivity tools tend to fail here, and fail in a specific way. A task list can only help with something you already remembered — you have to know about the thing in order to write it down. But forgetting is the actual symptom. The tool is asking you to supply the one thing you came to it short of.',
  'Then there is the second cost, which almost nobody names: every one of those tools is itself a system that has to be maintained. Tagged, groomed, reviewed weekly, kept honest. A tool you must remember to tend is a tool you will abandon in three weeks and then feel bad about for a year. The graveyard of half-filled apps is not evidence of laziness. It is evidence that the tool put its own upkeep on the person least able to spare it.',
  'So this design started from the failure rather than the feature list. What would have to be true for the annual report, the unsigned NDA, the lapsing certification and the account about to go short to all appear on one page, ranked against each other, before any of them became urgent — with nobody having to remember to go and look?',
  'The answer is a system that does the noticing. It reads what already exists, decides what deserves attention this morning, and puts it in exactly one place at exactly one time. It does not ask to be maintained. Nothing accumulates as guilt: an item you did not get to yesterday is simply ranked again today, in its correct position, with no remark about the streak you broke — because there are no streaks to break.',
  'Reading that much of someone’s life demands a great deal in return, which is why half of this product is a list of things it deliberately cannot do. Read-only. No stored credentials. No scoring. No trackers. Those constraints came before the features, because this is the only version of it we would be willing to hand our own accounts to.',
];

export const EF_CARDS = [
  {
    label: 'Working memory',
    problem: 'Out of sight is genuinely out of mind.',
    answer:
      'Everything lives in one ranked list you never have to hold. Nothing in the system depends on you remembering that it exists.',
  },
  {
    label: 'Time blindness',
    problem: 'Eleven days feels like later, right until it feels like never.',
    answer:
      'Items are ranked by consequence and lead time, not date order. A renewal that takes six weeks to complete surfaces six weeks out, not the week it is due.',
  },
  {
    label: 'Task initiation',
    problem: 'The expensive part is the first move.',
    answer:
      'Every flagged item names why it is flagged and what the next action is, so there is nothing to decode before starting. No item is ever just a noun.',
  },
  {
    label: 'Maintenance load',
    problem: 'A system you have to tend is a system you will drop.',
    answer:
      'Nothing to file, tag, groom or review. Ignore it for a fortnight and it is still correct when you come back, because it was never depending on you.',
  },
  {
    label: 'Shame mechanics',
    problem: 'Streaks punish the people who most need the help.',
    answer:
      'There is no chain to break, no overdue counter turning red at you, and no congratulation for routine work. Yesterday is not held against today.',
  },
];

export const NOT_CARE = [
  {
    title: 'It does not diagnose',
    body: 'The product has no idea whether you have ADHD, and there is no assessment, screener or questionnaire anywhere in it.',
  },
  {
    title: 'It is not treatment',
    body: 'It is not therapy, medication management, or a substitute for either. If executive function is genuinely costing you, that is a conversation for a clinician.',
  },
  {
    title: 'It is not a coach',
    body: 'No encouragement, no nudges about your character, no opinion on how you spent your week. It reports and it ranks.',
  },
  {
    title: 'It is not watching you',
    body: 'Nothing is scored, no productivity metric is computed, and nobody — including us — is reviewing how you did.',
  },
];

export const PRINCIPLES = [
  {
    num: '01',
    title: 'It proposes, you approve',
    body: "Nothing acts on your behalf. The most a wrong ranking can cost you is a moment's attention.",
  },
  {
    num: '02',
    title: 'Every flag explains itself',
    body: 'One sentence, traceable to the record it came from. If it cannot explain itself, it does not get flagged.',
  },
  {
    num: '03',
    title: 'Do less, deliberately',
    body: 'Moving money, filing, sending and scoring are all things we could build and will not. The constraints are the product.',
  },
  {
    num: '04',
    title: 'Say what happened',
    body: 'No congratulation, no exclamation marks, no cheerful error messages. If something broke, we name the cause and the time.',
  },
  {
    num: '05',
    title: 'Absent means absent',
    body: 'A module you turn off is gone from the interface and, within thirty days, from storage.',
  },
  {
    num: '06',
    title: 'Assume we are in the threat model',
    body: 'The sensitive fields are encrypted so that we cannot read them, and every decryption is logged where we cannot alter it.',
  },
];

export interface Phase {
  num: string;
  title: string;
  status: string;
  tone: Tone;
  body: string;
}

export const PHASES: Phase[] = [
  {
    num: 'Phase 0',
    title: 'Decisions and foundations',
    status: 'In progress',
    tone: 'info',
    body: 'Cloud accounts, pipelines and the security model. Two open legal determinations — how health records are classified, and whether government contract data is ever stored — both of which change the architecture, so they get answered before code.',
  },
  {
    num: 'Phase 1',
    title: 'The spine',
    status: 'Next',
    tone: 'muted',
    body: 'Authentication, tenant isolation with database-level separation, the application shell, and the record and table patterns that most of the sixty-three screens are built from.',
  },
  {
    num: 'Phase 2',
    title: 'The 6:00 brief',
    status: 'Planned',
    tone: 'muted',
    body: 'Mail and calendar connections, the connection health model, and the ranking pipeline — with its evaluation harness built before any tuning, because a brief that cries wolf is worse than none.',
  },
  {
    num: 'Phase 3',
    title: 'Modules',
    status: 'Planned',
    tone: 'muted',
    body: 'Productivity, Plan, Business, Finances, Life, Research and Health, in that order. Each is the proven table pattern plus its own custom screens.',
  },
  {
    num: 'Phase 4',
    title: 'Hardening and launch',
    status: 'Planned',
    tone: 'muted',
    body: 'Third-party penetration test, accessibility audit, backup restore drill and an incident response rehearsal. Fourteen launch gates, none of them waivable.',
  },
  {
    num: 'Post-launch',
    title: 'Continuity and Social',
    status: 'Deliberately last',
    tone: 'risk',
    body: 'Emergency access is the highest-risk feature in the product and ships only after a dedicated external review. Social publishing waits on app review from each platform.',
  },
];

export const WAITLIST_FACTS = [
  {
    title: 'Early access is staged',
    body: 'Productivity and the brief first, then Plan, Business and Finances. You will not be handed an empty shell to evaluate.',
  },
  {
    title: 'One email, when it is your turn',
    body: 'No newsletter, no countdown, no launch-day blast. We will not share your address with anyone.',
  },
  {
    title: 'You can leave with your data',
    body: 'Export everything and delete the account in one action, at any point, including during early access.',
  },
  {
    title: 'Pricing before you are charged',
    body: 'Final pricing lands with early access and we will not start a subscription without you choosing one.',
  },
];
