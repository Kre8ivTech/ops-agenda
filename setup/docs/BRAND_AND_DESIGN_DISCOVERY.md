# Brand & Design Discovery Guide

> **Establishing Visual Identity, Brand Guidelines, and Design System Before Development**

This guide ensures every project has a solid brand foundation before any code is written. It covers brand discovery, design systems, asset management, and integration with design tools.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Brand Discovery Intake](#2-brand-discovery-intake)
3. [Visual Identity Definition](#3-visual-identity-definition)
4. [Design System Setup](#4-design-system-setup)
5. [Asset Management](#5-asset-management)
6. [Figma Integration](#6-figma-integration)
7. [Brand Guide Template](#7-brand-guide-template)
8. [MCP Servers for Design](#8-mcp-servers-for-design)

---

## 1. Overview

### Why Brand Discovery First?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BRAND-FIRST DEVELOPMENT FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   BRAND      │───▶│   DESIGN     │───▶│    DEV       │                  │
│  │  DISCOVERY   │    │   SYSTEM     │    │  PLANNING    │                  │
│  │              │    │              │    │              │                  │
│  │ • Identity   │    │ • Components │    │ • Features   │                  │
│  │ • Voice      │    │ • Tokens     │    │ • Sprint     │                  │
│  │ • Colors     │    │ • Patterns   │    │ • Tasks      │                  │
│  │ • Typography │    │ • Figma      │    │              │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│         │                   │                   │                           │
│         ▼                   ▼                   ▼                           │
│  ┌─────────────────────────────────────────────────────┐                   │
│  │              BRAND GUIDE DOCUMENT                    │                   │
│  │  • Logo usage    • Color palette   • Typography     │                   │
│  │  • Tone of voice • Imagery style   • Components     │                   │
│  └─────────────────────────────────────────────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Deliverables Checklist

| Artifact | Description | Required |
|----------|-------------|----------|
| `BRAND_GUIDE.md` | Complete brand guidelines | ✅ Yes |
| `DESIGN_TOKENS.json` | Color, typography, spacing tokens | ✅ Yes |
| `assets/logo/` | Logo files in multiple formats | ✅ Yes |
| `assets/media/` | Brand imagery and icons | ⚠️ Recommended |
| `figma/` | Figma file links or exports | ⚠️ Recommended |
| `STYLE_GUIDE.md` | Component styling guidelines | ⚠️ Recommended |

---

## 2. Brand Discovery Intake

### Required Brand Discovery Questions

**CRITICAL**: Ask ALL of these questions before any design or development work begins.

#### 2.1 Brand Identity

```markdown
## Brand Identity Questions

### Core Identity
1. What is the company/product name?
2. What is the tagline or slogan (if any)?
3. What does the brand stand for? (Mission statement)
4. What are the brand's core values? (List 3-5)
5. What makes this brand unique? (Differentiators)

### Target Audience
6. Who is the primary target audience?
   - Age range:
   - Gender:
   - Location:
   - Income level:
   - Interests:
7. What problems does your audience face?
8. What emotions should users feel when interacting with your brand?

### Brand Personality
9. If your brand were a person, how would you describe them?
   - [ ] Professional & Corporate
   - [ ] Friendly & Approachable
   - [ ] Bold & Innovative
   - [ ] Elegant & Luxurious
   - [ ] Playful & Fun
   - [ ] Trustworthy & Reliable
   - [ ] Minimalist & Modern
   - [ ] Other: ___________

10. Select 5 adjectives that describe your brand:
    [ ] Innovative [ ] Traditional [ ] Playful [ ] Serious
    [ ] Luxurious [ ] Affordable [ ] Friendly [ ] Professional
    [ ] Bold [ ] Subtle [ ] Energetic [ ] Calm
    [ ] Modern [ ] Classic [ ] Trustworthy [ ] Edgy
```

#### 2.2 Visual Preferences

```markdown
## Visual Preference Questions

### Existing Assets
11. Do you have an existing logo?
    - [ ] Yes → Please attach files (SVG, PNG, AI)
    - [ ] No → We'll create one
    - [ ] Need refresh/update

12. Do you have existing brand guidelines?
    - [ ] Yes → Please attach document
    - [ ] No → We'll create them
    - [ ] Partial/outdated

13. Do you have existing brand colors?
    - [ ] Yes → Please provide hex codes
    - [ ] No → We'll define them
    - Primary: #_______
    - Secondary: #_______
    - Accent: #_______

### Color Preferences
14. What colors do you want to AVOID?
    - [ ] Red [ ] Orange [ ] Yellow [ ] Green
    - [ ] Blue [ ] Purple [ ] Pink [ ] Black
    - [ ] White [ ] Brown [ ] Gray

15. What mood should the colors convey?
    - [ ] Trust & Security (Blues)
    - [ ] Growth & Health (Greens)
    - [ ] Energy & Urgency (Reds/Oranges)
    - [ ] Creativity & Luxury (Purples)
    - [ ] Optimism & Warmth (Yellows)
    - [ ] Sophistication (Black/White)
    - [ ] Other: ___________

### Typography Preferences
16. What typography style fits your brand?
    - [ ] Modern Sans-Serif (Clean, minimal)
    - [ ] Classic Serif (Traditional, trustworthy)
    - [ ] Geometric (Tech, innovative)
    - [ ] Humanist (Friendly, approachable)
    - [ ] Display/Decorative (Unique, bold)
    - [ ] Monospace (Technical, developer-focused)
```

#### 2.3 Inspiration & References

```markdown
## Inspiration Questions

### Competitor Analysis
17. List 3-5 competitors or similar brands:
    1. ___________
    2. ___________
    3. ___________
    4. ___________
    5. ___________

18. What do you like about their branding?

19. What do you want to do DIFFERENTLY?

### Inspiration Brands
20. List 3-5 brands you admire (any industry):
    1. ___________ - What you like: ___________
    2. ___________ - What you like: ___________
    3. ___________ - What you like: ___________

### Visual References
21. Please attach 5-10 images that represent your desired aesthetic:
    - [ ] Screenshots of websites you like
    - [ ] Color palettes
    - [ ] Typography examples
    - [ ] Photography/imagery style
    - [ ] Icon/illustration style

### Mood Board
22. Describe the overall "feel" you want:
    [Free text response]
```

#### 2.4 Tone of Voice

```markdown
## Tone of Voice Questions

### Communication Style
23. How should your brand communicate?

    Formal ◯───◯───◯───◯───◯ Casual
    Serious ◯───◯───◯───◯───◯ Playful
    Reserved ◯───◯───◯───◯───◯ Enthusiastic
    Technical ◯───◯───◯───◯───◯ Simple
    Traditional ◯───◯───◯───◯───◯ Modern

24. Do's and Don'ts for brand voice:
    
    DO:
    - ___________
    - ___________
    - ___________
    
    DON'T:
    - ___________
    - ___________
    - ___________

### Writing Style
25. Sample phrases that sound like your brand:
    1. ___________
    2. ___________
    3. ___________

26. Words to ALWAYS use:
    1. ___________
    2. ___________
    3. ___________

27. Words to NEVER use:
    1. ___________
    2. ___________
    3. ___________
```

---

## 3. Visual Identity Definition

### Color Palette

```markdown
## Color System

### Primary Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Primary | #3B82F6 | 59, 130, 246 | Main actions, links |
| Primary Light | #60A5FA | 96, 165, 250 | Hover states |
| Primary Dark | #1D4ED8 | 29, 78, 216 | Active states |

### Secondary Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Secondary | #10B981 | 16, 185, 129 | Success, positive |
| Secondary Light | #34D399 | 52, 211, 153 | Highlights |
| Secondary Dark | #059669 | 5, 150, 105 | Emphasis |

### Neutral Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Gray 900 | #111827 | 17, 24, 39 | Primary text |
| Gray 700 | #374151 | 55, 65, 81 | Secondary text |
| Gray 500 | #6B7280 | 107, 114, 128 | Muted text |
| Gray 300 | #D1D5DB | 209, 213, 219 | Borders |
| Gray 100 | #F3F4F6 | 243, 244, 246 | Backgrounds |
| White | #FFFFFF | 255, 255, 255 | Base background |

### Semantic Colors
| Name | Hex | Usage |
|------|-----|-------|
| Error | #EF4444 | Error states, destructive actions |
| Warning | #F59E0B | Warning messages |
| Success | #10B981 | Success states |
| Info | #3B82F6 | Informational messages |
```

### Typography Scale

```markdown
## Typography System

### Font Families
- **Headings**: Inter, -apple-system, BlinkMacSystemFont, sans-serif
- **Body**: Inter, -apple-system, BlinkMacSystemFont, sans-serif
- **Code**: JetBrains Mono, Menlo, Monaco, monospace

### Type Scale
| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 48px | 700 | 1.1 | Hero headlines |
| H1 | 36px | 700 | 1.2 | Page titles |
| H2 | 30px | 600 | 1.25 | Section headers |
| H3 | 24px | 600 | 1.3 | Subsections |
| H4 | 20px | 600 | 1.35 | Card headers |
| Body Large | 18px | 400 | 1.5 | Lead paragraphs |
| Body | 16px | 400 | 1.5 | Default text |
| Body Small | 14px | 400 | 1.5 | Captions, help text |
| Caption | 12px | 400 | 1.4 | Labels, metadata |
```

### Spacing System

```markdown
## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Tight spacing |
| space-2 | 8px | Default gap |
| space-3 | 12px | Small padding |
| space-4 | 16px | Default padding |
| space-5 | 20px | Medium spacing |
| space-6 | 24px | Section gaps |
| space-8 | 32px | Large gaps |
| space-10 | 40px | Section padding |
| space-12 | 48px | Page sections |
| space-16 | 64px | Hero spacing |
```

---

## 4. Design System Setup

### Design Tokens (JSON)

```json
{
  "color": {
    "primary": {
      "50": "#EFF6FF",
      "100": "#DBEAFE",
      "200": "#BFDBFE",
      "300": "#93C5FD",
      "400": "#60A5FA",
      "500": "#3B82F6",
      "600": "#2563EB",
      "700": "#1D4ED8",
      "800": "#1E40AF",
      "900": "#1E3A8A"
    },
    "neutral": {
      "50": "#F9FAFB",
      "100": "#F3F4F6",
      "200": "#E5E7EB",
      "300": "#D1D5DB",
      "400": "#9CA3AF",
      "500": "#6B7280",
      "600": "#4B5563",
      "700": "#374151",
      "800": "#1F2937",
      "900": "#111827"
    },
    "semantic": {
      "error": "#EF4444",
      "warning": "#F59E0B",
      "success": "#10B981",
      "info": "#3B82F6"
    }
  },
  "typography": {
    "fontFamily": {
      "sans": "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      "mono": "JetBrains Mono, Menlo, Monaco, monospace"
    },
    "fontSize": {
      "xs": "12px",
      "sm": "14px",
      "base": "16px",
      "lg": "18px",
      "xl": "20px",
      "2xl": "24px",
      "3xl": "30px",
      "4xl": "36px",
      "5xl": "48px"
    },
    "fontWeight": {
      "normal": "400",
      "medium": "500",
      "semibold": "600",
      "bold": "700"
    },
    "lineHeight": {
      "tight": "1.1",
      "snug": "1.25",
      "normal": "1.5",
      "relaxed": "1.75"
    }
  },
  "spacing": {
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "8": "32px",
    "10": "40px",
    "12": "48px",
    "16": "64px"
  },
  "borderRadius": {
    "none": "0",
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px",
    "full": "9999px"
  },
  "shadow": {
    "sm": "0 1px 2px rgba(0, 0, 0, 0.05)",
    "md": "0 4px 6px rgba(0, 0, 0, 0.1)",
    "lg": "0 10px 15px rgba(0, 0, 0, 0.1)",
    "xl": "0 20px 25px rgba(0, 0, 0, 0.15)"
  }
}
```

### Tailwind Config Extension

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#8B5CF6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}
```

---

## 5. Asset Management

### Required Asset Formats

```markdown
## Logo Files

### Required Formats
assets/
└── logo/
    ├── logo-primary.svg          # Primary logo (vector)
    ├── logo-primary.png          # Primary logo (1024px)
    ├── logo-primary@2x.png       # Primary logo (2048px)
    ├── logo-white.svg            # White/light version
    ├── logo-black.svg            # Black/dark version
    ├── logo-icon.svg             # Icon/mark only
    ├── logo-icon-32.png          # Favicon size
    ├── logo-icon-192.png         # PWA icon
    ├── logo-icon-512.png         # PWA splash
    └── logo-social.png           # Social media (1200x630)

### Logo Usage Rules
- Minimum size: 32px height
- Clear space: 1x logo height on all sides
- Never stretch or distort
- Never change colors outside brand palette
- Never add effects (shadows, gradients) unless approved
```

### Media Assets

```markdown
## Media Library

assets/
└── media/
    ├── hero/                     # Hero images
    │   ├── hero-home.jpg
    │   └── hero-about.jpg
    ├── icons/                    # Custom icons
    │   ├── icon-feature-1.svg
    │   └── icon-feature-2.svg
    ├── illustrations/            # Brand illustrations
    │   ├── illustration-1.svg
    │   └── illustration-2.svg
    ├── photos/                   # Photography
    │   ├── team/
    │   └── product/
    └── social/                   # Social media assets
        ├── og-image.png          # Open Graph default
        └── twitter-card.png      # Twitter card
```

---

## 6. Figma Integration

### Figma MCP Servers

| Server | Stars | Purpose |
|--------|-------|---------|
| **Figma Context MCP** | 12,500+ | Read Figma designs in AI context |
| **Cursor Talk to Figma** | 5,900+ | Read/modify Figma from Cursor |

### Configuration

```jsonc
// .claude/mcp/design.json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-context-mcp"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "${FIGMA_ACCESS_TOKEN}"
      }
    },
    "cursor-figma": {
      "command": "npx",
      "args": ["-y", "@anthropic/cursor-talk-to-figma-mcp"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "${FIGMA_ACCESS_TOKEN}"
      }
    }
  }
}
```

### Figma File Structure

```markdown
## Recommended Figma Structure

📁 [Project Name] Design System
├── 📄 Cover
├── 📄 Brand Guidelines
│   ├── Logo Usage
│   ├── Color Palette
│   ├── Typography
│   └── Iconography
├── 📄 Components
│   ├── Buttons
│   ├── Forms
│   ├── Cards
│   ├── Navigation
│   └── Modals
├── 📄 Patterns
│   ├── Headers
│   ├── Footers
│   ├── Sidebars
│   └── Content Blocks
└── 📄 Pages
    ├── Home
    ├── Dashboard
    ├── Profile
    └── Settings
```

### Figma Variables for Tokens

```markdown
## Figma Variables Setup

### Color Variables
- Create a collection called "Brand Colors"
- Add modes: Light, Dark
- Define all brand colors as variables

### Typography Variables
- Create a collection called "Typography"
- Define font family, size, weight variables

### Spacing Variables
- Create a collection called "Spacing"
- Define spacing scale as number variables

### Sync to Code
Use Figma's Dev Mode to:
1. Export CSS variables
2. Export Tailwind config
3. Export design tokens JSON
```

---

## 7. Brand Guide Template

### Complete Brand Guide Document

```markdown
# Brand Guidelines

## [Company Name]

Version: 1.0
Last Updated: YYYY-MM-DD

---

## 1. Brand Overview

### Mission
[Company mission statement]

### Vision
[Company vision statement]

### Values
1. **[Value 1]**: [Description]
2. **[Value 2]**: [Description]
3. **[Value 3]**: [Description]

### Brand Personality
[Description of brand personality traits]

---

## 2. Logo

### Primary Logo
[Insert logo image]

#### Variations
- Primary (color on white)
- Reversed (white on dark)
- Monochrome (black or white)
- Icon only

#### Clear Space
Minimum clear space around logo equals [X]

#### Minimum Size
- Print: [X] inches / [X] mm
- Digital: [X] pixels

#### Incorrect Usage
- ❌ Do not stretch
- ❌ Do not rotate
- ❌ Do not change colors
- ❌ Do not add effects
- ❌ Do not place on busy backgrounds

---

## 3. Color Palette

### Primary Colors
| Color | Hex | RGB | Pantone | Usage |
|-------|-----|-----|---------|-------|
| [Name] | #XXXXXX | X, X, X | XXXX C | [Usage] |

### Secondary Colors
| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| [Name] | #XXXXXX | X, X, X | [Usage] |

### Color Accessibility
- All text must meet WCAG 2.1 AA contrast ratios
- Minimum contrast ratio: 4.5:1 for normal text
- Minimum contrast ratio: 3:1 for large text

---

## 4. Typography

### Primary Typeface
**[Font Name]**
- Headings: [Weight]
- Body: [Weight]

### Secondary Typeface
**[Font Name]**
- Used for: [Usage]

### Type Scale
| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| H1 | [Font] | [Size] | [Weight] | [LH] |
| H2 | [Font] | [Size] | [Weight] | [LH] |
| Body | [Font] | [Size] | [Weight] | [LH] |

---

## 5. Voice & Tone

### Brand Voice
[Description of how the brand speaks]

### Tone Guidelines

| Context | Tone | Example |
|---------|------|---------|
| Marketing | [Tone] | [Example] |
| Support | [Tone] | [Example] |
| Error Messages | [Tone] | [Example] |

### Writing Guidelines
- **DO**: [List of dos]
- **DON'T**: [List of don'ts]

### Vocabulary
- Use: [Preferred terms]
- Avoid: [Terms to avoid]

---

## 6. Imagery

### Photography Style
- [Style guidelines]
- [Mood/feeling]
- [Subject matter]

### Illustration Style
- [Style guidelines]
- [Color usage]
- [Line weight]

### Iconography
- Style: [Outlined/Filled/Duotone]
- Stroke width: [X]px
- Corner radius: [X]px

---

## 7. Applications

### Digital
- Website
- Mobile app
- Email templates
- Social media

### Print
- Business cards
- Letterhead
- Brochures

---

## 8. Resources

### File Downloads
- [Logo package link]
- [Font files link]
- [Template files link]
- [Figma library link]

### Contacts
- Brand questions: [email]
- Design requests: [email]
```

---

## 8. MCP Servers for Design

### Recommended Design Stack

```jsonc
// .claude/mcp/design-stack.json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-context-mcp"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "${FIGMA_ACCESS_TOKEN}"
      },
      "description": "Read Figma designs for AI context"
    },
    "magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic-mcp"],
      "description": "Generate UI components from descriptions"
    },
    "browser": {
      "command": "npx",
      "args": ["-y", "mcp-chrome"],
      "description": "Visual testing and screenshots"
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "description": "Tailwind/component library docs"
    }
  }
}
```

### Integration with Development

```markdown
## Design-to-Code Workflow

1. **Brand Discovery** → Complete intake questions
2. **Figma Design** → Create designs in Figma
3. **MCP Connection** → Connect Figma MCP to AI assistant
4. **Component Generation** → AI generates components from designs
5. **Token Sync** → Export design tokens to code
6. **Review** → Visual comparison and refinement
```

---

## Quick Reference

### Minimum Brand Requirements Checklist

Before starting ANY development:

- [ ] Brand discovery questions completed
- [ ] Logo files provided (SVG + PNG)
- [ ] Primary colors defined (hex codes)
- [ ] Typography selected
- [ ] Tone of voice documented
- [ ] Figma access token configured
- [ ] Design tokens JSON created
- [ ] Brand guide document drafted

### Environment Variables

```bash
# Add to .env
FIGMA_ACCESS_TOKEN=figd_xxxxxxxxxxxx
```

---

*This document should be completed BEFORE Phase 1 (Requirements) of development orchestration.*
*See `DEVELOPMENT_ORCHESTRATION.md` for the complete workflow.*
