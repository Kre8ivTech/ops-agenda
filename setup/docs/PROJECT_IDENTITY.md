# Project Identity Intake

> **The FIRST Questions Asked - Before Anything Else**

This document captures the essential project metadata that must be collected before any other discovery phase begins. These details are used throughout all documentation, code files, and legal notices.

---

## Required Project Identity

**CRITICAL**: Complete this section FIRST, before Brand Discovery or any other phase.

```markdown
## Project Identity Form

### 1. Application Name
┌─────────────────────────────────────────────────────────────────────────────┐
│ What is the name of the application/product?                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Application Name: _________________________________________________         │
│                                                                              │
│ Short Name (if different): ________________________________________         │
│                                                                              │
│ Code Name (internal): _____________________________________________         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

### 2. Company/Organization Name
┌─────────────────────────────────────────────────────────────────────────────┐
│ Who owns this application?                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Company Name: _____________________________________________________         │
│                                                                              │
│ Legal Entity Name (if different): _________________________________         │
│                                                                              │
│ DBA / Trading As (if applicable): _________________________________         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

### 3. Author/Creator
┌─────────────────────────────────────────────────────────────────────────────┐
│ Who is the primary author or creator?                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Author Name: ______________________________________________________         │
│                                                                              │
│ Author Title/Role: ________________________________________________         │
│                                                                              │
│ Additional Authors (if any):                                                │
│ - _________________________________________________________________         │
│ - _________________________________________________________________         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

### 4. License Type
┌─────────────────────────────────────────────────────────────────────────────┐
│ What type of license will this project use?                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ License Type (select one):                                                   │
│                                                                              │
│ PROPRIETARY (Most Common for Commercial Projects)                           │
│ [ ] Proprietary / All Rights Reserved                                       │
│ [ ] Proprietary with Limited License                                        │
│ [ ] Commercial License                                                       │
│                                                                              │
│ OPEN SOURCE                                                                  │
│ [ ] MIT License                                                              │
│ [ ] Apache 2.0                                                               │
│ [ ] GPL v3                                                                   │
│ [ ] BSD 3-Clause                                                             │
│ [ ] ISC                                                                      │
│ [ ] Other: ________________________________________________________         │
│                                                                              │
│ Copyright Year: ______ (default: current year)                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

### 5. Contact Information
┌─────────────────────────────────────────────────────────────────────────────┐
│ Primary contact for this project                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Contact Email: ____________________________________________________         │
│                                                                              │
│ Support Email (if different): _____________________________________         │
│                                                                              │
│ Website URL: ______________________________________________________         │
│                                                                              │
│ Phone (optional): _________________________________________________         │
│                                                                              │
│ Address (optional): _______________________________________________         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Intake Version

For rapid project setup, use this condensed format:

```markdown
## Project Identity (Required)

| Field | Value |
|-------|-------|
| **Application Name** | |
| **Company Name** | |
| **Author Name** | |
| **License** | Proprietary / MIT / Apache 2.0 / Other: ___ |
| **Copyright Year** | 2025 |
| **Contact Email** | |
```

---

## AI Prompt to Start

Use this prompt to begin any new project:

```
I'm starting a new project. Before we begin any discovery, 
I need to capture the project identity:

1. What is the application name?
2. What is the company/organization name?
3. Who is the author/creator?
4. What license type? (Proprietary is default for commercial projects)
5. What is the primary contact email?
```

---

## Generated Artifacts

Once Project Identity is captured, automatically generate:

### LICENSE File

**For Proprietary (Default):**
```
Copyright (c) [YEAR] [COMPANY NAME]. All Rights Reserved.

This software and associated documentation files (the "Software") are 
proprietary and confidential. Unauthorized copying, distribution, 
modification, or use of this Software, via any medium, is strictly 
prohibited.

For licensing inquiries, contact: [CONTACT EMAIL]
```

**For MIT:**
```
MIT License

Copyright (c) [YEAR] [COMPANY NAME]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Package.json Fields

```json
{
  "name": "[application-name-kebab-case]",
  "author": "[AUTHOR NAME] <[CONTACT EMAIL]>",
  "license": "[LICENSE TYPE]",
  "repository": {
    "type": "git",
    "url": "https://github.com/[company]/[application-name]"
  },
  "bugs": {
    "email": "[CONTACT EMAIL]"
  },
  "homepage": "[WEBSITE URL]"
}
```

### Composer.json Fields (PHP)

```json
{
  "name": "[company]/[application-name]",
  "description": "[Application description]",
  "license": "[LICENSE TYPE]",
  "authors": [
    {
      "name": "[AUTHOR NAME]",
      "email": "[CONTACT EMAIL]"
    }
  ]
}
```

### README Header

```markdown
# [APPLICATION NAME]

> [Short description]

**Company:** [COMPANY NAME]  
**Author:** [AUTHOR NAME]  
**License:** [LICENSE TYPE]  
**Contact:** [CONTACT EMAIL]

---
```

### File Headers (for source code)

```javascript
/**
 * [APPLICATION NAME]
 * 
 * @copyright [YEAR] [COMPANY NAME]. All Rights Reserved.
 * @author [AUTHOR NAME]
 * @license [LICENSE TYPE]
 * @contact [CONTACT EMAIL]
 */
```

```php
<?php
/**
 * [APPLICATION NAME]
 *
 * @package     [ApplicationName]
 * @author      [AUTHOR NAME]
 * @copyright   [YEAR] [COMPANY NAME]. All Rights Reserved.
 * @license     [LICENSE TYPE]
 * @link        [WEBSITE URL]
 */
```

---

## Project Identity Template File

Create this file at project root:

### `PROJECT_IDENTITY.json`

```json
{
  "$schema": "./schemas/project-identity.json",
  "application": {
    "name": "",
    "shortName": "",
    "codeName": "",
    "description": ""
  },
  "company": {
    "name": "",
    "legalName": "",
    "tradingAs": ""
  },
  "author": {
    "name": "",
    "title": "",
    "email": ""
  },
  "additionalAuthors": [],
  "license": {
    "type": "Proprietary",
    "spdxId": "",
    "copyrightYear": 2025
  },
  "contact": {
    "email": "",
    "supportEmail": "",
    "website": "",
    "phone": "",
    "address": ""
  },
  "repository": {
    "type": "github",
    "url": ""
  }
}
```

---

## Integration with Workflow

### Updated Phase Order

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PROJECT INITIATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   PROJECT    │───▶│   BRAND      │───▶│  TECHNOLOGY  │                  │
│  │   IDENTITY   │    │  DISCOVERY   │    │  DISCOVERY   │                  │
│  │ ★ FIRST ★   │    │              │    │              │                  │
│  │              │    │              │    │              │                  │
│  │ • App Name   │    │ • Identity   │    │ • App Type   │                  │
│  │ • Company    │    │ • Colors     │    │ • Capabilities│                  │
│  │ • Author     │    │ • Typography │    │ • Tech Stack │                  │
│  │ • License    │    │ • Tone       │    │ • Integrations│                 │
│  │ • Contact    │    │ • Assets     │    │              │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│         │                   │                   │                           │
│         ▼                   ▼                   ▼                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │         Continue to Conception → Requirements → Development...       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Guardrail: Project Identity is ALWAYS Required

```markdown
## Enforcement Rule

Before ANY other question is asked, capture:

1. ✅ Application Name
2. ✅ Company Name
3. ✅ Author Name
4. ✅ License Type
5. ✅ Contact Email

These 5 items are NON-NEGOTIABLE and must be captured 
before proceeding to Brand Discovery or any other phase.

If client says "I don't know yet":
- Application Name: Use code name or working title
- Company Name: Use individual's name if sole proprietor
- Author Name: Use whoever is leading the project
- License: Default to "Proprietary" unless specified
- Contact Email: Required - cannot proceed without
```

---

## Checklist

Before proceeding to Brand Discovery:

- [ ] Application Name captured
- [ ] Company Name captured
- [ ] Author Name captured
- [ ] License Type selected (default: Proprietary)
- [ ] Contact Email captured
- [ ] PROJECT_IDENTITY.json created (optional but recommended)
- [ ] LICENSE file generated
- [ ] README header template ready

---

*This is Phase -1: The absolute first step before any other discovery.*
*See `DEVELOPMENT_ORCHESTRATION.md` for the complete workflow.*
