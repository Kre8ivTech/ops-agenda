# Coding Standards Builder

Build tools for compiling coding standards rules into AGENTS.md documents optimized for AI agents and LLMs.

## Usage

From a coding standards skill directory (e.g., `skills/wordpress-best-practices/`):

```bash
# Build AGENTS.md from rules
node ../../tools/coding-standards-builder/src/build.js .

# Validate all rule files
node ../../tools/coding-standards-builder/src/validate.js .

# Extract test cases for LLM evaluation
node ../../tools/coding-standards-builder/src/extract-tests.js .
```

## Expected Directory Structure

Each coding standards skill should have:

```
skills/{tech}-best-practices/
├── rules/
│   ├── _sections.md      # Section definitions
│   ├── _template.md      # Template for new rules
│   └── {prefix}-*.md     # Individual rule files
├── metadata.json         # Document metadata
├── SKILL.md              # Skill definition
├── README.md             # Contributor instructions
├── package.json          # Local build scripts
└── AGENTS.md             # Generated output
```

## Rule File Format

```markdown
---
title: Rule Title Here
impact: CRITICAL|HIGH|MEDIUM-HIGH|MEDIUM|LOW-MEDIUM|LOW
impactDescription: Optional description of impact
tags: tag1, tag2, tag3
---

## Rule Title Here

Brief explanation of the rule and why it matters.

**Incorrect (description):**

\`\`\`language
// Bad code example
\`\`\`

**Correct (description):**

\`\`\`language
// Good code example
\`\`\`

Optional additional explanation.

Reference: [Link](https://example.com)
```

## Section File Format (_sections.md)

```markdown
# Sections

## 1. Section Name (prefix)

**Impact:** CRITICAL
**Description:** Why this section matters.

## 2. Another Section (prefix2)

**Impact:** HIGH
**Description:** Description here.
```

## Impact Levels

| Level | Description |
|-------|-------------|
| CRITICAL | Highest priority, major performance/security gains |
| HIGH | Significant improvements |
| MEDIUM-HIGH | Moderate-high gains |
| MEDIUM | Moderate improvements |
| LOW-MEDIUM | Low-medium gains |
| LOW | Incremental improvements |
