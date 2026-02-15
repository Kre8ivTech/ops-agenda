# Ops Agenda — User Stories

**Version:** 1.0  
**Date:** February 15, 2026  
**Status:** Ready for Development

---

## Epic 1: Authentication & Onboarding

### US-001: Microsoft 365 Authentication

**As a** professional user  
**I want to** securely connect my Microsoft 365 account  
**So that** Ops Agenda can access my email and calendar data

**Acceptance Criteria:**
- [ ] User clicks "Connect Microsoft 365" button on landing page
- [ ] OAuth 2.0 flow redirects to Microsoft login
- [ ] User grants Mail.Read and Calendars.Read permissions
- [ ] OAuth tokens are encrypted with AES-256-GCM before storage
- [ ] User is redirected back to Ops Agenda dashboard
- [ ] Session is created and persisted in Supabase
- [ ] Error handling for failed auth (clear error messages)

**Priority:** P0 (Critical)  
**Sprint:** 1  
**Story Points:** 8

---

### US-002: User Onboarding Flow

**As a** new user  
**I want to** complete a guided setup process  
**So that** I understand how Ops Agenda works and configure my preferences

**Acceptance Criteria:**
- [ ] Welcome screen explains Ops Agenda value proposition
- [ ] Step 1: Connect Microsoft 365 account (US-001)
- [ ] Step 2: Initial sync starts automatically (loading indicator)
- [ ] Step 3: Preference selection (work hours, notification preferences)
- [ ] Progress indicator shows steps 1/3, 2/3, 3/3
- [ ] "Skip for now" option available for preferences
- [ ] Onboarding state tracked in user profile
- [ ] Completed onboarding redirects to Daily Ops Brief

**Priority:** P0 (Critical)  
**Sprint:** 1  
**Story Points:** 5

---

## Epic 2: Microsoft 365 Sync

### US-003: Initial Email Sync

**As a** connected user  
**I want** Ops Agenda to sync my recent emails  
**So that** I can see my inbox priorities

**Acceptance Criteria:**
- [ ] Sync triggered automatically after M365 connection
- [ ] Fetch last 7 days of emails from Inbox folder only
- [ ] Store only metadata (subject, from, to, date, hasAttachments, importance)
- [ ] Extract snippet (first 200 chars) — no full body storage
- [ ] Store delta token for incremental sync
- [ ] Background job runs via Inngest (async, non-blocking)
- [ ] Progress shown in UI (e.g., "Syncing emails... 45/120")
- [ ] Error handling with retry logic (3 attempts)
- [ ] RLS policy ensures tenant isolation

**Priority:** P0 (Critical)  
**Sprint:** 1  
**Story Points:** 13

---

### US-004: Incremental Email Sync

**As a** user  
**I want** new emails to sync automatically  
**So that** my dashboard stays up-to-date without manual refresh

**Acceptance Criteria:**
- [ ] Background job runs every 15 minutes (Inngest cron)
- [ ] Use Microsoft Graph delta query with stored delta token
- [ ] Fetch only new/changed emails since last sync
- [ ] Update emails_metadata table with new records
- [ ] Update delta token after successful sync
- [ ] Idempotent sync (no duplicate records)
- [ ] Handle Microsoft Graph throttling (429 errors)
- [ ] Log sync success/failure to audit_logs table

**Priority:** P0 (Critical)  
**Sprint:** 2  
**Story Points:** 8

---

### US-005: Calendar Events Sync

**As a** user  
**I want** my calendar events synced  
**So that** I can see my day's schedule in the Daily Ops Brief

**Acceptance Criteria:**
- [ ] Sync calendar events for next 7 days
- [ ] Support multiple calendars (fetch from all user calendars)
- [ ] Store event metadata (subject, start, end, location, attendees, isOnline)
- [ ] No body content stored — only title and metadata
- [ ] Incremental sync with delta tokens
- [ ] Background job via Inngest
- [ ] Identify meeting conflicts (overlapping events)
- [ ] RLS policy for tenant isolation

**Priority:** P0 (Critical)  
**Sprint:** 2  
**Story Points:** 8

---

## Epic 3: AI Processing Pipeline

### US-006: Priority Classification

**As a** user  
**I want** emails automatically classified by priority  
**So that** I can focus on what's most urgent

**Acceptance Criteria:**
- [ ] AI analyzes email metadata (subject, from, snippet) via OpenAI GPT-4o-mini
- [ ] Classify into 4 categories: P1 (Urgent), P2 (Important), P3 (Normal), FYSA (Info)
- [ ] Return confidence score (0.0-1.0) for each classification
- [ ] Use JSON structured output with schema validation
- [ ] Store classification in ai_classifications table with confidence score
- [ ] Background job triggered after email sync (Inngest event)
- [ ] Handle OpenAI API errors gracefully (retry with exponential backoff)
- [ ] Cost optimization: batch emails (max 50 per API call)
- [ ] User can correct classification (feedback tracked)

**Priority:** P0 (Critical)  
**Sprint:** 2  
**Story Points:** 13

**JSON Schema Example:**
```json
{
  "type": "object",
  "properties": {
    "classifications": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "email_id": {"type": "string"},
          "priority": {"type": "string", "enum": ["P1", "P2", "P3", "FYSA"]},
          "confidence": {"type": "number", "minimum": 0, "maximum": 1},
          "reasoning": {"type": "string"}
        },
        "required": ["email_id", "priority", "confidence"]
      }
    }
  }
}
```

---

### US-007: Due-Out Detection

**As a** user  
**I want** deadlines automatically extracted from emails  
**So that** I don't miss important due dates

**Acceptance Criteria:**
- [ ] AI analyzes email snippets for deadline phrases
- [ ] Extract due date, task description, and requester
- [ ] Detect patterns: "due by", "deadline", "needs by", "submit before", etc.
- [ ] Return confidence score for each detected due-out
- [ ] Store in due_outs table with link to source email
- [ ] JSON structured output with schema validation
- [ ] Background job via Inngest (triggered after email sync)
- [ ] Handle relative dates ("tomorrow", "next Friday", "EOD")
- [ ] Show detected due-outs in Daily Ops Brief

**Priority:** P0 (Critical)  
**Sprint:** 3  
**Story Points:** 13

**JSON Schema Example:**
```json
{
  "type": "object",
  "properties": {
    "due_outs": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "email_id": {"type": "string"},
          "task_description": {"type": "string"},
          "due_date": {"type": "string", "format": "date-time"},
          "requester": {"type": "string"},
          "confidence": {"type": "number", "minimum": 0, "maximum": 1}
        },
        "required": ["email_id", "task_description", "due_date", "confidence"]
      }
    }
  }
}
```

---

### US-008: Daily Narrative Generation

**As a** user  
**I want** a natural language summary of my day  
**So that** I can quickly understand what's ahead

**Acceptance Criteria:**
- [ ] AI generates 2-3 paragraph narrative summary
- [ ] Include: number of meetings, key priorities, deadlines, focus blocks
- [ ] Personalized tone (professional but conversational)
- [ ] JSON structured output with narrative text
- [ ] Generated fresh every morning at 6 AM (Inngest cron)
- [ ] Cached in Upstash Redis for fast dashboard load
- [ ] Regenerated if user manually refreshes
- [ ] Handle days with no meetings/emails gracefully

**Priority:** P0 (Critical)  
**Sprint:** 3  
**Story Points:** 8

---

## Epic 4: Daily Ops Brief Dashboard

### US-009: Dashboard Layout

**As a** user  
**I want** a single-screen dashboard  
**So that** I can see my entire day at a glance

**Acceptance Criteria:**
- [ ] Header: Logo, user profile, date, refresh button
- [ ] Section 1: Daily narrative (AI-generated summary)
- [ ] Section 2: Top 3 priorities (ranked by AI)
- [ ] Section 3: Timeline (visual calendar with meetings + focus blocks)
- [ ] Section 4: Due-outs (deadlines with countdown)
- [ ] Section 5: Meeting prep (upcoming meetings with context)
- [ ] Responsive design (desktop + tablet + mobile)
- [ ] Dashboard loads in < 2 seconds (p95)
- [ ] Data fetched from Upstash Redis cache (fallback to DB)
- [ ] Loading states for each section (skeleton loaders)

**Priority:** P0 (Critical)  
**Sprint:** 3  
**Story Points:** 13

---

### US-010: Top 3 Priorities Display

**As a** user  
**I want** to see my Top 3 priorities ranked by AI  
**So that** I know what to focus on first

**Acceptance Criteria:**
- [ ] Display 3 highest-priority items (P1 emails + due-outs combined)
- [ ] Show: title, source (email/due-out), time/deadline, confidence score
- [ ] Ranked by: priority level + deadline proximity + AI confidence
- [ ] Click to view full email or due-out details
- [ ] Empty state: "No priorities today — you're all caught up!"
- [ ] User can manually reorder (drag-and-drop)
- [ ] Manual changes tracked as user feedback

**Priority:** P0 (Critical)  
**Sprint:** 4  
**Story Points:** 8

---

### US-011: Visual Timeline

**As a** user  
**I want** a visual timeline of my day  
**So that** I can see meetings and available focus time

**Acceptance Criteria:**
- [ ] Horizontal timeline (8 AM - 6 PM default, user-configurable)
- [ ] Meetings shown as colored blocks with title + time
- [ ] Focus blocks suggested in gaps (≥ 1 hour between meetings)
- [ ] Current time indicator (red line)
- [ ] Hover over meeting shows attendees, location, join link
- [ ] Click meeting to see full details or join (if online)
- [ ] Conflicts highlighted in red (overlapping events)
- [ ] Responsive: stacks vertically on mobile

**Priority:** P0 (Critical)  
**Sprint:** 4  
**Story Points:** 13

---

### US-012: Due-Outs Section

**As a** user  
**I want** to see all detected deadlines  
**So that** I don't miss important due dates

**Acceptance Criteria:**
- [ ] List all due-outs sorted by due date (soonest first)
- [ ] Show: task description, due date/time, requester, source email
- [ ] Visual indicators: overdue (red), today (orange), upcoming (green)
- [ ] Countdown timer (e.g., "Due in 3 hours")
- [ ] Click to view source email
- [ ] Mark as complete (checkmark button)
- [ ] Completed due-outs archived (not deleted)
- [ ] Empty state: "No upcoming deadlines"

**Priority:** P0 (Critical)  
**Sprint:** 4  
**Story Points:** 8

---

## Epic 5: Priority Inbox

### US-013: Priority Inbox View

**As a** user  
**I want** to see my emails organized by priority  
**So that** I can triage efficiently

**Acceptance Criteria:**
- [ ] 4 tabs: P1 (Urgent), P2 (Important), P3 (Normal), FYSA (Info)
- [ ] Email list shows: subject, sender, snippet, time, attachments icon
- [ ] Badge shows unread count per tab
- [ ] Default view: P1 tab
- [ ] Click email to view details (modal or side panel)
- [ ] Mark as read/unread
- [ ] AI confidence score shown (subtle badge)
- [ ] User can reclassify (move to different tab)
- [ ] Pagination or infinite scroll (50 emails per page)

**Priority:** P0 (Critical)  
**Sprint:** 5  
**Story Points:** 13

---

### US-014: Email Detail View

**As a** user  
**I want** to view email details  
**So that** I can read and respond

**Acceptance Criteria:**
- [ ] Modal or slide-out panel shows email details
- [ ] Display: subject, from, to, date, AI classification, confidence score
- [ ] Snippet only (no full body — link to open in Outlook)
- [ ] "Open in Outlook" button (deep link to email)
- [ ] AI-detected due-out highlighted (if present)
- [ ] Reclassify dropdown (P1/P2/P3/FYSA)
- [ ] User reclassification triggers feedback logging
- [ ] Close modal with ESC key or X button

**Priority:** P0 (Critical)  
**Sprint:** 5  
**Story Points:** 5

---

## Epic 6: Meeting Intelligence

### US-015: Meeting Prep Cards

**As a** user  
**I want** to see prep materials for upcoming meetings  
**So that** I can prepare efficiently

**Acceptance Criteria:**
- [ ] Show next 3 upcoming meetings (within 24 hours)
- [ ] For each meeting: title, time, attendees, agenda (if available)
- [ ] AI-generated prep checklist (based on meeting title/attendees)
- [ ] Related emails shown (emails from attendees about meeting topic)
- [ ] "Join Meeting" button (if online meeting with join link)
- [ ] Expand/collapse card for details
- [ ] Empty state: "No meetings in the next 24 hours"

**Priority:** P1 (High)  
**Sprint:** 5  
**Story Points:** 8

---

## Epic 7: Weekly Outlook

### US-016: Weekly Summary

**As a** user  
**I want** a week-ahead summary  
**So that** I can plan my week strategically

**Acceptance Criteria:**
- [ ] Accessible from navigation (separate page from Daily Ops Brief)
- [ ] AI-generated narrative summary of the week ahead
- [ ] Week-at-a-glance calendar grid (Mon-Fri)
- [ ] Total meeting hours per day
- [ ] Identified focus days (days with < 3 hours of meetings)
- [ ] Due-outs for the week (grouped by day)
- [ ] Generated every Monday at 6 AM (Inngest cron)
- [ ] Manual refresh button

**Priority:** P1 (High)  
**Sprint:** 6  
**Story Points:** 8

---

## Epic 8: Draft Reply (Optional)

### US-017: AI Draft Reply Suggestion

**As a** user  
**I want** AI-suggested draft replies  
**So that** I can respond to emails faster

**Acceptance Criteria:**
- [ ] Available from email detail view (US-014)
- [ ] "Suggest Reply" button triggers AI generation
- [ ] AI generates 2-3 response options (brief, detailed, decline)
- [ ] JSON structured output with reply text
- [ ] User can edit draft before copying
- [ ] "Copy to Clipboard" button
- [ ] "Open in Outlook" to compose with draft pre-filled
- [ ] User feedback: thumbs up/down on draft quality
- [ ] Feature flag (can be disabled in settings)

**Priority:** P2 (Medium)  
**Sprint:** 6  
**Story Points:** 8

---

## Epic 9: Settings & Preferences

### US-018: User Settings Page

**As a** user  
**I want** to configure my preferences  
**So that** Ops Agenda works the way I want

**Acceptance Criteria:**
- [ ] Work hours configuration (start/end time for timeline)
- [ ] Notification preferences (email, push)
- [ ] Data retention period (7/14/30/60 days)
- [ ] AI features toggle (enable/disable draft replies, due-out detection)
- [ ] Disconnect Microsoft 365 account (with confirmation)
- [ ] Delete all data (with double confirmation)
- [ ] Export data (GDPR compliance)
- [ ] Changes saved automatically (toast confirmation)

**Priority:** P1 (High)  
**Sprint:** 6  
**Story Points:** 5

---

## Epic 10: Testing & Quality

### US-019: Unit Test Coverage

**As a** developer  
**I want** comprehensive unit tests  
**So that** the codebase is reliable

**Acceptance Criteria:**
- [ ] > 80% code coverage (measured by Vitest)
- [ ] All utility functions tested
- [ ] All API routes tested (mocked external APIs)
- [ ] All React components tested (React Testing Library)
- [ ] CI/CD pipeline fails if coverage < 80%

**Priority:** P0 (Critical)  
**Sprint:** 7  
**Story Points:** 13

---

### US-020: E2E Testing

**As a** developer  
**I want** end-to-end tests for critical paths  
**So that** user flows work correctly

**Acceptance Criteria:**
- [ ] Playwright tests for critical user journeys:
  - [ ] Onboarding flow (connect M365, complete setup)
  - [ ] Daily Ops Brief load (all sections render)
  - [ ] Priority Inbox navigation (tab switching, email open)
  - [ ] Settings update (change work hours, save)
- [ ] Tests run in CI/CD pipeline
- [ ] Screenshots on failure for debugging

**Priority:** P0 (Critical)  
**Sprint:** 7  
**Story Points:** 8

---

## Epic 11: Security & Compliance

### US-021: Security Audit

**As a** developer  
**I want** security vulnerabilities identified and fixed  
**So that** user data is protected

**Acceptance Criteria:**
- [ ] Run SonarQube SAST scan (no critical/high vulnerabilities)
- [ ] Run Snyk dependency scan (no critical/high vulnerabilities)
- [ ] Manual code review for OWASP Top 10
- [ ] Verify OAuth token encryption (AES-256-GCM)
- [ ] Verify RLS policies on all Supabase tables
- [ ] Verify no raw email bodies stored
- [ ] Document findings in SECURITY_AUDIT.md

**Priority:** P0 (Critical)  
**Sprint:** 7  
**Story Points:** 8

---

## Epic 12: Deployment

### US-022: Production Deployment

**As a** developer  
**I want** the app deployed to production  
**So that** users can access it

**Acceptance Criteria:**
- [ ] Deploy to Vercel (connected to GitHub main branch)
- [ ] Environment variables configured in Vercel dashboard
- [ ] Supabase production database created with RLS enabled
- [ ] Inngest production environment configured
- [ ] Upstash Redis production instance created
- [ ] Custom domain configured (ops-agenda.com)
- [ ] HTTPS/TLS 1.3 enforced
- [ ] Monitoring with Sentry configured
- [ ] Health check endpoint (/api/health)

**Priority:** P0 (Critical)  
**Sprint:** 8  
**Story Points:** 5

---

## Summary

**Total Stories:** 22  
**Total Story Points:** 198  
**Estimated Sprints:** 8 (2-week sprints = 16 weeks)

**Sprint Breakdown:**
- **Sprint 1:** Auth + Onboarding + Initial Sync (26 points)
- **Sprint 2:** Incremental Sync + Calendar + AI Priority (29 points)
- **Sprint 3:** Due-Outs + Narrative + Dashboard Layout (34 points)
- **Sprint 4:** Top 3 + Timeline + Due-Outs UI (29 points)
- **Sprint 5:** Priority Inbox + Meeting Prep (26 points)
- **Sprint 6:** Weekly Outlook + Draft Reply + Settings (21 points)
- **Sprint 7:** Testing + Security Audit (29 points)
- **Sprint 8:** Deployment (5 points)

**Next Step:** Sprint planning and architecture design for Sprint 1
