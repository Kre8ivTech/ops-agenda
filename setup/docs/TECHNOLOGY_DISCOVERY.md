# Technology Discovery Guide

> **Define Application Type, Capabilities, and Tech Stack Before Development**

This guide ensures the right technology decisions are made early by systematically discovering requirements, capabilities, and constraints before any code is written.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Application Type Selection](#2-application-type-selection)
3. [Capabilities Discovery](#3-capabilities-discovery)
4. [Tech Stack Refinement](#4-tech-stack-refinement)
5. [Infrastructure Requirements](#5-infrastructure-requirements)
6. [Integration Requirements](#6-integration-requirements)
7. [Decision Matrix](#7-decision-matrix)
8. [Recommended Stacks](#8-recommended-stacks)

---

## 1. Overview

### When to Use This Guide

Complete Technology Discovery **AFTER** Brand Discovery and **BEFORE** detailed requirements:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PROJECT INITIATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐  │
│  │   BRAND      │───▶│  TECHNOLOGY  │───▶│  CONCEPTION  │───▶│REQUIREMENTS│ │
│  │  DISCOVERY   │    │  DISCOVERY   │    │              │    │          │  │
│  │              │    │              │    │              │    │          │  │
│  │ • Identity   │    │ • App Type   │    │ • Vision     │    │ • User   │  │
│  │ • Colors     │    │ • Capabilities│   │ • Goals      │    │   Stories│  │
│  │ • Typography │    │ • Tech Stack │    │ • Scope      │    │ • Specs  │  │
│  │ • Tone       │    │ • Integrations│   │ • Constraints│    │          │  │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────┘  │
│         │                   │                   │                  │        │
│         ▼                   ▼                   ▼                  ▼        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ARCHITECTURE & PLANNING                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Deliverables

| Artifact | Description |
|----------|-------------|
| `TECH_DISCOVERY.md` | Completed discovery responses |
| `TECH_STACK.md` | Finalized technology decisions |
| `INTEGRATIONS.md` | Third-party integration requirements |
| `INFRASTRUCTURE.md` | Hosting and deployment requirements |

---

## 2. Application Type Selection

### Primary Application Type Questions

```markdown
## Application Type Discovery

### Question 1: What type of application are you building?

Select ONE primary type:

#### Websites & CMS
- [ ] **WordPress Plugin** - Extend WordPress functionality
- [ ] **WordPress Theme** - Custom WordPress theme
- [ ] **WordPress Full Site** - Complete WordPress solution
- [ ] **Static Website** - Marketing/landing pages (no backend)
- [ ] **Blog/Content Site** - Content-focused with CMS

#### Web Applications
- [ ] **SaaS Application** - Multi-tenant software service
- [ ] **Internal Tool** - Business/admin dashboard
- [ ] **E-commerce Store** - Online shopping platform
- [ ] **Marketplace** - Multi-vendor platform
- [ ] **Social Platform** - Community/social features
- [ ] **Booking/Reservation System** - Scheduling application

#### Mobile Applications
- [ ] **Mobile App (iOS)** - Native iOS application
- [ ] **Mobile App (Android)** - Native Android application
- [ ] **Cross-Platform Mobile** - React Native/Flutter
- [ ] **Progressive Web App (PWA)** - Installable web app

#### APIs & Services
- [ ] **REST API** - Backend API service
- [ ] **GraphQL API** - GraphQL backend
- [ ] **Microservices** - Distributed services
- [ ] **Serverless Functions** - Event-driven functions

#### Other
- [ ] **Browser Extension** - Chrome/Firefox extension
- [ ] **Desktop Application** - Electron/native desktop
- [ ] **CLI Tool** - Command-line application
- [ ] **Other**: _______________
```

### Question 2: Platform Constraints

```markdown
## Platform Constraints

### Do you have existing platform requirements?

#### Existing Infrastructure
- [ ] Must integrate with existing WordPress site
- [ ] Must use existing Laravel application
- [ ] Must deploy to existing servers
- [ ] Must use specific cloud provider
- [ ] No constraints - greenfield project

#### If WordPress:
- Existing theme: _______________
- Required plugins: _______________
- PHP version: _______________
- Hosting: _______________

#### If Existing Application:
- Framework: _______________
- Version: _______________
- Database: _______________
- Hosting: _______________

#### Preferred/Required Technologies:
- [ ] Must use: _______________
- [ ] Must avoid: _______________
- [ ] Team expertise in: _______________
```

---

## 3. Capabilities Discovery

### Core Capabilities Checklist

```markdown
## Required Capabilities

### Question 3: What capabilities does your application need?

Check ALL that apply and provide details:

---

### 🔐 AUTHENTICATION & USERS

#### User Authentication
- [ ] **Email/Password Login**
- [ ] **Social Login** (Google, Facebook, Apple, GitHub)
  - Which providers? _______________
- [ ] **Magic Link / Passwordless**
- [ ] **Two-Factor Authentication (2FA)**
- [ ] **Single Sign-On (SSO)** / Enterprise
  - Providers? (Okta, Auth0, Azure AD) _______________
- [ ] **No authentication needed** (public only)

#### User Management
- [ ] **User Registration** (self-service)
- [ ] **User Profiles**
- [ ] **Role-Based Access Control (RBAC)**
  - Roles needed? (Admin, Editor, User, etc.) _______________
- [ ] **Teams/Organizations**
- [ ] **Invitations**
- [ ] **User Impersonation** (admin feature)

---

### 💳 PAYMENTS & BILLING

#### Payment Processing
- [ ] **One-time Payments**
- [ ] **Subscription/Recurring Billing**
  - Billing cycles? (Monthly, Annual) _______________
- [ ] **Usage-based Billing**
- [ ] **Marketplace Payments** (split payments)
- [ ] **Invoicing**
- [ ] **No payments needed**

#### Payment Providers
- [ ] **Stripe** (recommended)
- [ ] **PayPal**
- [ ] **Square**
- [ ] **Braintree**
- [ ] **Paddle** (for SaaS)
- [ ] **Other**: _______________

#### Additional Billing Features
- [ ] **Free Trials**
- [ ] **Coupons/Discounts**
- [ ] **Multiple Currencies**
- [ ] **Tax Calculation**
- [ ] **Refunds**

---

### 📧 COMMUNICATION

#### Email
- [ ] **Transactional Emails** (welcome, reset password)
- [ ] **Marketing Emails** / Newsletters
- [ ] **Email Templates**
- [ ] **Email Provider**:
  - [ ] SendGrid
  - [ ] Postmark
  - [ ] AWS SES
  - [ ] Resend
  - [ ] Mailgun
  - [ ] Other: _______________

#### Notifications
- [ ] **In-app Notifications**
- [ ] **Push Notifications** (mobile/web)
- [ ] **SMS Notifications**
  - Provider? (Twilio, etc.) _______________
- [ ] **Slack/Discord Integration**
- [ ] **Webhooks** (outgoing)

---

### 📁 DATA & STORAGE

#### Database
- [ ] **Relational Database** (PostgreSQL, MySQL)
- [ ] **NoSQL Database** (MongoDB, DynamoDB)
- [ ] **Real-time Database** (Firebase, Supabase)
- [ ] **Search Engine** (Elasticsearch, Algolia)

#### File Storage
- [ ] **User File Uploads**
  - File types? _______________
  - Max size? _______________
- [ ] **Image Processing** (resize, crop, optimize)
- [ ] **Video Hosting/Processing**
- [ ] **Document Storage** (PDF, etc.)
- [ ] **CDN** for assets

#### Storage Providers
- [ ] **AWS S3**
- [ ] **Cloudflare R2**
- [ ] **Supabase Storage**
- [ ] **Uploadthing**
- [ ] **Other**: _______________

---

### 🎨 FRONTEND

#### Rendering Strategy
- [ ] **Server-Side Rendering (SSR)**
- [ ] **Static Site Generation (SSG)**
- [ ] **Client-Side Rendering (CSR)** / SPA
- [ ] **Hybrid** (mix of above)

#### UI Requirements
- [ ] **Responsive Design** (mobile-first)
- [ ] **Dark Mode**
- [ ] **Accessibility (WCAG 2.1 AA)**
- [ ] **Internationalization (i18n)**
  - Languages needed? _______________
- [ ] **RTL Support** (Arabic, Hebrew)

#### UI Components
- [ ] **Custom Design System** (from Figma)
- [ ] **Component Library**:
  - [ ] shadcn/ui
  - [ ] Chakra UI
  - [ ] Material UI
  - [ ] Ant Design
  - [ ] Tailwind UI
  - [ ] Other: _______________

---

### 🔧 BACKEND & API

#### API Type
- [ ] **REST API**
- [ ] **GraphQL**
- [ ] **tRPC** (TypeScript)
- [ ] **gRPC** (microservices)

#### Backend Features
- [ ] **Background Jobs** / Queues
- [ ] **Scheduled Tasks** (cron)
- [ ] **Webhooks** (incoming)
- [ ] **Rate Limiting**
- [ ] **API Versioning**

#### Real-time Features
- [ ] **WebSockets**
- [ ] **Server-Sent Events (SSE)**
- [ ] **Real-time Collaboration**
- [ ] **Live Updates** / Subscriptions

---

### 📊 ANALYTICS & MONITORING

#### Analytics
- [ ] **Page Analytics** (views, sessions)
- [ ] **Event Tracking** (clicks, actions)
- [ ] **User Behavior** (heatmaps, recordings)
- [ ] **Conversion Tracking**
- [ ] **A/B Testing**

#### Analytics Providers
- [ ] **Google Analytics 4**
- [ ] **Plausible** (privacy-focused)
- [ ] **PostHog**
- [ ] **Mixpanel**
- [ ] **Amplitude**
- [ ] **Other**: _______________

#### Monitoring
- [ ] **Error Tracking** (Sentry)
- [ ] **Performance Monitoring**
- [ ] **Uptime Monitoring**
- [ ] **Log Management**

---

### 🔒 SECURITY & COMPLIANCE

#### Security Features
- [ ] **SSL/TLS** (HTTPS)
- [ ] **CSRF Protection**
- [ ] **XSS Prevention**
- [ ] **SQL Injection Prevention**
- [ ] **Rate Limiting**
- [ ] **DDoS Protection**

#### Compliance
- [ ] **GDPR** (EU data protection)
- [ ] **CCPA** (California privacy)
- [ ] **HIPAA** (healthcare)
- [ ] **SOC 2**
- [ ] **PCI-DSS** (payment cards)

---

### 🔌 THIRD-PARTY INTEGRATIONS

#### CRM & Marketing
- [ ] **HubSpot**
- [ ] **Salesforce**
- [ ] **Mailchimp**
- [ ] **Intercom**
- [ ] **Other**: _______________

#### Productivity
- [ ] **Slack**
- [ ] **Discord**
- [ ] **Notion**
- [ ] **Linear**
- [ ] **Jira**
- [ ] **Other**: _______________

#### AI & ML
- [ ] **OpenAI / GPT**
- [ ] **Anthropic / Claude**
- [ ] **Image Generation**
- [ ] **Speech-to-Text**
- [ ] **Custom ML Models**

#### Other Integrations
List any other integrations needed:
1. _______________
2. _______________
3. _______________
```

---

## 4. Tech Stack Refinement

### Question 4: Priority & Constraints

```markdown
## Project Priorities

### What are your TOP 3 priorities?

Rank 1-3 (1 = highest priority):

___ **Speed to Market** - Launch quickly, iterate later
___ **Scalability** - Handle growth, high traffic
___ **Performance** - Fast load times, responsiveness
___ **Security** - Maximum protection, compliance
___ **Cost Efficiency** - Minimize hosting/infrastructure costs
___ **Developer Experience** - Easy to maintain, good DX
___ **SEO** - Search engine optimization critical
___ **Offline Support** - Works without internet
___ **Real-time Features** - Live updates essential

### Budget Constraints

#### Development Budget
- [ ] Under $5,000
- [ ] $5,000 - $25,000
- [ ] $25,000 - $100,000
- [ ] $100,000+
- [ ] Not specified

#### Monthly Infrastructure Budget
- [ ] Under $50/month (serverless, free tiers)
- [ ] $50 - $200/month
- [ ] $200 - $1,000/month
- [ ] $1,000+/month
- [ ] Not specified

### Timeline
- Target launch date: _______________
- MVP needed by: _______________
- Full release: _______________

### Team Constraints
- Team size: _______________
- Technical expertise: _______________
- Preferred languages: _______________
```

---

## 5. Infrastructure Requirements

### Question 5: Deployment & Hosting

```markdown
## Infrastructure Discovery

### Hosting Preference

#### Managed Platforms (Recommended for most)
- [ ] **Vercel** - Best for Next.js, serverless
- [ ] **Netlify** - Static sites, serverless functions
- [ ] **Railway** - Full-stack, databases included
- [ ] **Render** - Docker, databases, cron jobs
- [ ] **Fly.io** - Global edge deployment
- [ ] **Cloudflare Pages/Workers** - Edge-first

#### Cloud Providers
- [ ] **AWS** - Full control, complex
- [ ] **Google Cloud** - Good for ML/data
- [ ] **Azure** - Enterprise, .NET
- [ ] **DigitalOcean** - Simple VPS

#### WordPress/PHP Hosting
- [ ] **WP Engine** - Managed WordPress
- [ ] **Kinsta** - Premium WordPress
- [ ] **SiteGround** - Budget WordPress
- [ ] **cPanel/WHM** - Traditional hosting
- [ ] **Custom VPS** - Full control

### Database Hosting
- [ ] **Supabase** (PostgreSQL + Auth + Storage)
- [ ] **PlanetScale** (MySQL, serverless)
- [ ] **Neon** (PostgreSQL, serverless)
- [ ] **MongoDB Atlas** (NoSQL)
- [ ] **AWS RDS** (managed relational)
- [ ] **Self-hosted** on VPS

### Additional Infrastructure
- [ ] **Redis** (caching, sessions)
- [ ] **Elasticsearch** (search)
- [ ] **Message Queue** (RabbitMQ, SQS)
- [ ] **CDN** (Cloudflare, AWS CloudFront)
```

---

## 6. Integration Requirements

### Question 6: External Services

```markdown
## Integration Details

For each integration selected above, provide:

### Integration: [Name]
- **Purpose**: Why is this needed?
- **Direction**: 
  - [ ] We call their API
  - [ ] They call our webhooks
  - [ ] Bidirectional
- **Data exchanged**: What data flows?
- **Frequency**: Real-time / Hourly / Daily / On-demand
- **Existing account?**: Yes / No
- **API credentials available?**: Yes / No
- **Documentation URL**: _______________
```

---

## 7. Decision Matrix

### Stack Selection Flowchart

```
START
  │
  ├─▶ WordPress Plugin/Theme needed?
  │     │
  │     YES ──▶ PHP + WordPress
  │     │
  │     NO
  │       │
  │       ├─▶ Need mobile app?
  │       │     │
  │       │     YES ──▶ React Native / Expo
  │       │     │       + API Backend
  │       │     │
  │       │     NO
  │       │       │
  │       │       ├─▶ Real-time critical?
  │       │       │     │
  │       │       │     YES ──▶ Supabase / Firebase
  │       │       │            + Next.js
  │       │       │     │
  │       │       │     NO
  │       │       │       │
  │       │       │       ├─▶ SEO critical?
  │       │       │       │     │
  │       │       │       │     YES ──▶ Next.js (SSR/SSG)
  │       │       │       │     │
  │       │       │       │     NO
  │       │       │       │       │
  │       │       │       │       ├─▶ Enterprise/Complex?
  │       │       │       │       │     │
  │       │       │       │       │     YES ──▶ Laravel / .NET
  │       │       │       │       │     │
  │       │       │       │       │     NO ──▶ Next.js + Supabase
```

---

## 8. Recommended Stacks

### Stack: WordPress Plugin

```markdown
## WordPress Plugin Stack

### When to Use
- Extending existing WordPress site
- Selling on WordPress marketplace
- Client requires WordPress

### Stack
- **Language**: PHP 8.1+
- **Framework**: WordPress Plugin API
- **Frontend**: Alpine.js or vanilla JS
- **Styling**: Tailwind CSS
- **Build**: Webpack or Vite
- **Testing**: PHPUnit, Cypress

### Hosting
- Any WordPress host
- WHM/cPanel
- WP Engine, Kinsta

### MCP Servers
- GitHub MCP
- Context7 (PHP docs)
```

### Stack: Next.js SaaS

```markdown
## Next.js SaaS Stack

### When to Use
- SaaS applications
- Marketing sites with app
- SEO-important applications
- TypeScript preference

### Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase/Neon)
- **Auth**: Clerk or Supabase Auth
- **ORM**: Prisma or Drizzle
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Payments**: Stripe
- **Email**: Resend
- **Monitoring**: Sentry

### Hosting
- **Frontend**: Vercel
- **Database**: Supabase / Neon
- **Storage**: Cloudflare R2

### MCP Servers
- GitHub, Supabase, Playwright
- Stripe, Sentry, Vercel
```

### Stack: Laravel CMS

```markdown
## Laravel CMS Stack

### When to Use
- Complex backend logic
- PHP team expertise
- Custom CMS requirements
- Enterprise applications

### Stack
- **Framework**: Laravel 11+
- **Language**: PHP 8.2+
- **Frontend**: Livewire + Alpine.js OR Inertia + Vue/React
- **Database**: PostgreSQL or MySQL
- **Auth**: Laravel Breeze/Jetstream
- **Admin**: Filament
- **Queue**: Laravel Horizon + Redis
- **Search**: Meilisearch

### Hosting
- **App**: Laravel Forge + DigitalOcean
- **Database**: Managed PostgreSQL
- **Cache**: Redis

### MCP Servers
- GitHub, Docker
- SonarQube, Sentry
```

### Stack: React Native Mobile

```markdown
## React Native Mobile Stack

### When to Use
- Cross-platform mobile app
- Shared codebase iOS/Android
- JavaScript/TypeScript team

### Stack
- **Framework**: Expo (managed)
- **Language**: TypeScript
- **Navigation**: Expo Router
- **State**: Zustand or Jotai
- **API**: tRPC or React Query
- **Backend**: Supabase or custom API
- **Styling**: NativeWind (Tailwind)

### Backend Options
- Next.js API routes
- Supabase (serverless)
- Custom Node.js/Express

### MCP Servers
- GitHub, Supabase
- Sentry (mobile), Figma
```

### Stack: Cloudflare Edge

```markdown
## Cloudflare Edge Stack

### When to Use
- Global low-latency requirements
- Cost-sensitive
- Serverless preference
- Edge computing

### Stack
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1 (SQLite)
- **KV Store**: Cloudflare KV
- **Storage**: Cloudflare R2
- **Auth**: Clerk
- **Frontend**: Astro / Next.js on Pages

### Hosting
- **All**: Cloudflare (Workers, Pages, D1, R2)

### MCP Servers
- GitHub, Cloudflare API
- Sentry, Context7
```

---

## Quick Reference: Tech Stack by Use Case

| Use Case | Recommended Stack | Why |
|----------|-------------------|-----|
| WordPress Plugin | PHP + WP API | Native integration |
| Marketing Site | Next.js + Vercel | SEO, speed, easy deploy |
| SaaS App | Next.js + Supabase + Stripe | Full-featured, scalable |
| Mobile App | Expo + Supabase | Cross-platform, fast dev |
| E-commerce | Next.js + Shopify OR Laravel + custom | Depends on complexity |
| Internal Tool | Laravel + Filament OR Retool | Rapid admin development |
| Real-time App | Next.js + Supabase Realtime | Built-in real-time |
| Enterprise CMS | Laravel + Filament | Complex business logic |
| API-only | Hono + Cloudflare OR Laravel | Edge vs traditional |
| Static Site | Astro + Cloudflare Pages | Maximum performance |

---

## Completion Checklist

Before proceeding to Architecture phase:

- [ ] Application type selected
- [ ] All required capabilities identified
- [ ] Tech stack finalized
- [ ] Hosting/infrastructure decided
- [ ] Integrations documented
- [ ] Budget and timeline confirmed
- [ ] Team capabilities assessed
- [ ] TECH_STACK.md created
- [ ] INTEGRATIONS.md created

---

*Complete this discovery BEFORE detailed requirements.*
*See `DEVELOPMENT_ORCHESTRATION.md` for the full workflow.*
