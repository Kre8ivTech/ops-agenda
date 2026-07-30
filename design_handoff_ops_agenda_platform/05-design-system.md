# 5. Design system

Authoritative sources in `design/`: **Ops Agenda - Design System.dc.html** (tokens, components, voice) and **Ops Agenda - Brand Guide.dc.html** (mark, lockups, collateral). Values below are lifted from them verbatim.

## 1. Colour

Every colour in the product. **There are no others.** If a screen appears to need a new colour, it needs a decision instead.

| Token | Hex | Where it is allowed |
|---|---|---|
| `ink` | `#16201B` | Body type, headings, primary buttons, sidebar |
| `signal` | `#25724D` | The mark, links, on-track state, primary button hover |
| `paper` | `#F7F7F2` | App canvas. Cards sit on it in white |
| `white` | `#FFFFFF` | Cards, inputs, table rows |
| `border` | `#DBE2DB` | Every 1px division. Never a shadow instead |
| `wash` | `#EEF2EC` | Table headers, quiet buttons, inert pills |
| `wash-green` | `#DCECE2` | Settled pills, status rings, icon tiles |
| `text-secondary` | `#5C6861` | Supporting copy, labels, meta. Never on ink |
| `signal-on-ink` | `#8FD3AE` | Green accents on dark surfaces only. **Never the mark** |
| `risk` | `#A33B32` | Needs a person today. Errors, degraded sync |
| `risk-wash` | `#F2DFDD` | Backing for at-risk pills and banners |
| `info` | `#315D8F` | Neutral notices. Never urgent |
| `info-wash` | `#DFE9F5` | Backing for informational pills and banners |

Disabled state is `text-secondary` at 55% opacity — not a new grey.

**Semantics are strict.** Green = settled or on track. Red = at risk, needs a person today. Blue = informational, never urgent. Grey = inert. *A screen with three reds has failed the user before they read a word* — if that happens, the ranking is wrong, not the palette.

## 2. Typography

Two families. Self-host both with `next/font/local`.

- **Geist** — everything a user reads. 400 body, 600 labels and nav, 700 emphasis inside sentences, 800 headings and buttons.
- **Geist Mono** — only what a machine produced: timestamps, IDs, priorities, counts, hex values, eyebrow labels. **Never for prose.**
- **Poppins ExtraBold** — the logotype only, uppercase, `.02em`. ⚠️ Under review; a switch to Geist 900 is being considered. Implement the lockup as one component so this is a one-line change.

| Role | Spec |
|---|---|
| Display | 2.3rem / 800 / `-.02em` |
| Heading | 1.7rem / 800 / `-.02em` |
| Row title | 1rem / 700 |
| Body | .95rem / 400 / 1.5 |
| Field label | .8rem / 800 |
| Eyebrow | .74rem / 800 / uppercase |
| Data (mono) | .8rem / 700 / `.02em` |

Body copy caps at 62ch, supporting text at 44ch. `text-wrap: pretty` on every paragraph.

## 3. Space, radius, elevation

4px base. Steps: 4, 8, 12, 18, 24, 48. Gaps inside a card 8–14; between cards 18–20; section padding 48 horizontal / 76 vertical.

Radius: `7px` dense, `8px` default, `12px` panel, `999px` pill. **Pills are only for filters, status and avatars — never for a button that performs an action.**

One shadow: `0 22px 60px rgba(35,45,40,.12)`, floating panels only. Everything else separates with a 1px `border` line.

## 4. Components

Build these as the shared primitive set; every screen composes from them.

**Buttons** — three sizes, one primary per view.

| Size | Spec | Used for |
|---|---|---|
| Large | h48 · r8 · 800 | Page-level primary action |
| Medium | h36 · r8 · .83rem | Toolbars, row actions |
| Small | h34 · r7 · .82rem | Inside list rows only |

Variants: primary (`ink` bg, white text, hover → `signal`), secondary (white, `border`, hover → border `ink`), quiet (`wash`, hover → `wash-green`), ghost (transparent, `text-secondary`, hover → `ink`). **Hover is a colour change only** — no lift, no scale, no shadow growth.

**Inputs** — h46 · r8 · 1px `border`; focus border `signal`; error border and message `risk`. Label above (800, always visible — no placeholder-only fields), hint below, error replaces the hint. Placeholders show a real example, never a restatement of the label. Errors name the cause, not the rule.

**Checkbox** 16px r4; **toggle** 42×24 pill with an 18px knob, 150ms ease.

**Status** — priority pills in mono 800 .7rem, r999: P1 `wash-green`/`signal`, P1 at risk `risk-wash`/`risk`, P2 `info-wash`/`info`, P3 `wash`/`text-secondary`. Connection dots 8px with a 3px wash ring: synced `signal`, degraded `risk`, pending `text-secondary`.

**Banners** — 1px `border`, r8, tinted wash background, 7px dot, one sentence. Three kinds only: at-risk, informational, settled.

**Metric card** — r8, 1px border, white: eyebrow (.74rem 800 uppercase `text-secondary`), value (1.35rem `-.02em`, coloured by state), note (.78rem `text-secondary`).

**Record row** — grid `auto 1fr auto`: priority pill, title (600, truncates), meta (right, `risk` + 700 when at risk). A flagged row carries a **3px left border in its status colour**; a handled row drops to a plain border. **Never a strikethrough, never grey text** for handled.

**Evidence quote** — `text-secondary` .82rem behind a 2px `border` left rule, no colour. This is where the why-flagged sentence lives.

**Panel** — r8, 1px border, the one shadow; header in `wash` with a mono uppercase label and a live-state dot.

**Sidebar** — `ink` background, items ~h40 r8, active `rgba(255,255,255,.08)` with white 800 text, inactive `rgba(255,255,255,.72)` 600, counts in mono. Group headers collapse. Modules the plan excludes are **absent**, not disabled.

**Filter chips** — h34 pills with a live count, always visible. Selected fills with `wash` and gets an `ink` border — **never signal green**; green means state, not selection.

**Table (the big one)** — see `06-screens.md §2`. Header row in `wash`, mono uppercase labels, 1px row dividers, row expansion into a detail panel, per-row actions, filter chips with live counts, search. ~35 screens depend on this single component being right.

## 5. The mark

Files in `design/brand/`: `ops-agenda-mark-signal.svg`, `-ink.svg`, `-paper.svg`, `favicon.svg`. **Vector only. Never redraw it.**

Construction: a 31-unit open ring (the working day) at 11.2 stroke weight in a 99×80 viewBox; a check rising on a 55° axis; and an ascent that carries the **A** of Agenda through the ring and out, legs landing flat on a shared baseline. The ring is cut where the ascent crosses it. Scale the mark, never the weight.

Rules that the build must respect:

- **Minimum 24px tall** on screen (7mm print). Below that, the optical gaps close — use the favicon.
- **Clear space = ½ mark height on all sides.** The A-leg reaches the bottom edge of the viewBox, so it will collide with adjacent type unless spacing is explicit.
- **Surfaces**: signal green on paper; **paper on ink and on signal green**. Never signal green on ink — that pairing is in the guide's misuse list and fails contrast (2.86:1).
- Never stretch, rotate, recolour the parts, or use the lockup as an avatar.

Lockups: primary (mark + logotype horizontal, gap = ⅓ mark width), stacked (narrow slots, tracking opens to `.07em`), mark only (product chrome, avatars, favicons). Implement as one `<Lockup>` component with `variant` and `surface` props.

## 6. Motion

150ms ease for state changes, 220ms for panels entering. **Nothing animates on load, nothing bounces, nothing loops.** If motion isn't showing cause and effect, remove it. Respect `prefers-reduced-motion` by disabling all non-essential transitions.

## 7. Voice

Flat, specific, and non-congratulatory. Say what happened.

**Write this:** "Procurement is the only thing at risk before noon." · "Two accounts stopped returning calendar data at 4:12 AM." · "Marked handled. It will drop off tomorrow's brief."

**Not this:** "Oops! Looks like something needs your attention 🎯" · "An error occurred. Please try again later." · "Great job! You're all caught up!"

No emoji. No exclamation marks. No praise for routine actions. Errors state the cause and the next step. Empty states say what will appear here and why it is empty — never a celebration.

⚠️ Several strings are **regulatory representations**, not marketing copy: "read-only", "cannot move money", "credentials are held by the provider, never by us", "will never store credentials", "it does not assess you", "Ops Agenda does not file". Treat these as a specification. If the implementation diverges from the sentence, change the implementation — the sentence is an enforceable promise (`03-security-compliance.md §3c`).

## 8. Accessibility — WCAG 2.2 AA, verified in CI

- Contrast: the palette is compliant **as paired in this document**. The known trap is `signal` on `ink` (2.86:1) — use `signal-on-ink` `#8FD3AE` for green accents on dark, and `paper` for the mark.
- Never colour alone: every status pill carries a text label, every dot has an adjacent word.
- Full keyboard operation, including table row expansion, filter chips, the command palette (⌘K) and the entity switcher. Visible focus rings — do not remove outlines.
- Tables: real `<table>` semantics with `<caption>`, `scope` on headers, and `aria-expanded` on expandable rows. Row actions are real buttons.
- Forms: label/input association, `aria-describedby` for hints and errors, `aria-invalid`, and an error summary that receives focus on submit.
- Live regions for the sync banner and filter-count changes, `aria-live="polite"`.
- Target size 24×24 minimum (2.2 AA); 44×44 on any touch surface.
- Density is high — do not let it fall below the 24px mark minimum or the 12px type floor.
