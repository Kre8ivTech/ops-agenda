# Subagents and MCP Servers Guide

> **Comprehensive catalog of subagents and MCP servers for AI-assisted web/mobile development**

This guide documents subagents and MCP (Model Context Protocol) servers that can enhance AI coding assistants across platforms for planning, execution, testing, and security audits.

---

## Table of Contents

1. [Platform Compatibility Matrix](#platform-compatibility-matrix)
2. [Essential MCP Servers](#essential-mcp-servers)
3. [Planning & Project Management](#planning--project-management)
4. [Code Quality & Testing](#code-quality--testing)
5. [Security & Auditing](#security--auditing)
6. [Database & Backend](#database--backend)
7. [Frontend & Design](#frontend--design)
8. [DevOps & Infrastructure](#devops--infrastructure)
9. [Agent Frameworks](#agent-frameworks)
10. [Setup Instructions](#setup-instructions)

---

## Platform Compatibility Matrix

### MCP Server Support by Platform

| Platform | MCP Support | Configuration Location |
|----------|-------------|------------------------|
| **Claude Code** | ✅ Full | `.claude/mcp/*.json` |
| **Cursor** | ✅ Full | Settings → MCP Servers |
| **Windsurf** | ✅ Full | Settings → MCP |
| **Cline** | ✅ Full | `.cline/mcp_settings.json` |
| **VS Code + Continue** | ✅ Full | `.continue/config.json` |
| **GitHub Copilot** | ⚠️ Limited | Agent extensions |
| **Gemini CLI** | ⚠️ Partial | Custom integration |
| **Blackbox/Codex** | ❌ None | N/A |

---

## Essential MCP Servers

### Top-Tier (10,000+ Stars)

| Server | Stars | Description | URL |
|--------|-------|-------------|-----|
| **context7** | 41,800+ | Up-to-date documentation for LLMs | [upstash/context7](https://github.com/upstash/context7) |
| **GitHub MCP** | 25,800+ | GitHub's official MCP server | [github/github-mcp-server](https://github.com/github/github-mcp-server) |
| **Playwright MCP** | 25,400+ | Browser automation & testing | [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) |
| **FastMCP** | 21,900+ | Fast Pythonic MCP server builder | [jlowin/fastmcp](https://github.com/jlowin/fastmcp) |
| **Serena** | 18,500+ | Semantic code retrieval & editing | [oraios/serena](https://github.com/oraios/serena) |
| **Figma Context MCP** | 12,500+ | Figma layout for AI coding | [GLips/Figma-Context-MCP](https://github.com/GLips/Figma-Context-MCP) |
| **GenAI Toolbox** | 12,300+ | Database MCP server | [googleapis/genai-toolbox](https://github.com/googleapis/genai-toolbox) |
| **PAL MCP** | 10,800+ | Multi-model coordination | [BeehiveInnovations/pal-mcp-server](https://github.com/BeehiveInnovations/pal-mcp-server) |
| **Chrome MCP** | 9,900+ | Browser control & automation | [hangwin/mcp-chrome](https://github.com/hangwin/mcp-chrome) |
| **MCP-Use** | 8,900+ | Custom agent MCP interaction | [mcp-use/mcp-use](https://github.com/mcp-use/mcp-use) |

### Curated Lists

| Resource | Stars | Description | URL |
|----------|-------|-------------|-----|
| **Awesome MCP Servers** | 78,700+ | Comprehensive MCP server list | [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) |
| **MCP Registry** | 6,200+ | Official community registry | [modelcontextprotocol/registry](https://github.com/modelcontextprotocol/registry) |
| **ACI.dev** | 4,600+ | 600+ tools unified platform | [aipotheosis-labs/aci](https://github.com/aipotheosis-labs/aci) |

---

## Planning & Project Management

### Task & Issue Tracking

| Server | Stars | Description | Use Case |
|--------|-------|-------------|----------|
| **Linear MCP** | 340+ | Linear project management | Sprint planning, issue tracking |
| **Jira MCP** | 60+ | Jira integration | Enterprise issue management |
| **Notion MCP** | 3,700+ | Official Notion server | Documentation, task lists |
| **GitHub MCP** | 25,800+ | Issues, PRs, projects | Code-first planning |

### Configuration Examples

```jsonc
// .claude/mcp/planning.json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "@anthropic/linear-mcp-server"],
      "env": {
        "LINEAR_API_KEY": "${LINEAR_API_KEY}"
      }
    },
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "NOTION_API_KEY": "${NOTION_API_KEY}"
      }
    }
  }
}
```

---

## Code Quality & Testing

### Testing Automation

| Server | Stars | Description | Use Case |
|--------|-------|-------------|----------|
| **Playwright MCP** | 25,400+ | Browser testing & automation | E2E testing, visual testing |
| **Jest MCP** | 1+ | Jest test runner | Unit test execution |
| **SonarQube MCP** | 345+ | Code quality analysis | Quality gates, tech debt |

### Static Analysis & Linting

| Server | Stars | Description | Use Case |
|--------|-------|-------------|----------|
| **Semgrep MCP** | 2+ | SAST vulnerability scanning | Security rules, code patterns |
| **SonarQube MCP** | 345+ | Code quality metrics | Coverage, duplication, bugs |

### Configuration Examples

```jsonc
// .claude/mcp/testing.json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic/playwright-mcp-server"]
    },
    "sonarqube": {
      "command": "npx",
      "args": ["-y", "sonarqube-mcp-server"],
      "env": {
        "SONAR_HOST_URL": "${SONAR_HOST_URL}",
        "SONAR_TOKEN": "${SONAR_TOKEN}"
      }
    }
  }
}
```

---

## Security & Auditing

### Security Scanning

| Server | Stars | Description | Use Case |
|--------|-------|-------------|----------|
| **HexStrike AI** | 5,900+ | 150+ security tools | Pentesting, vulnerability discovery |
| **Semgrep MCP** | 2+ | SAST scanning | Code vulnerability analysis |
| **Snyk MCP** | 2+ | Dependency scanning | Supply chain security |
| **GhidraMCP** | 7,000+ | Reverse engineering | Binary analysis |

### Error Monitoring

| Server | Stars | Description | Use Case |
|--------|-------|-------------|----------|
| **Sentry MCP** | 499+ | Error tracking | Production monitoring |

### Configuration Examples

```jsonc
// .claude/mcp/security.json
{
  "mcpServers": {
    "hexstrike": {
      "command": "npx",
      "args": ["-y", "hexstrike-ai"],
      "env": {
        "HEXSTRIKE_API_KEY": "${HEXSTRIKE_API_KEY}"
      }
    },
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server"],
      "env": {
        "SENTRY_AUTH_TOKEN": "${SENTRY_AUTH_TOKEN}",
        "SENTRY_ORG": "${SENTRY_ORG}"
      }
    }
  }
}
```

---

## Database & Backend

### Database Servers

| Server | Stars | Description | Use Case |
|--------|-------|-------------|----------|
| **Supabase MCP** | 2,380+ | Supabase integration | Postgres, Auth, Storage |
| **GenAI Toolbox** | 12,300+ | Multi-database support | MySQL, Postgres, SQLite |
| **Neon MCP** | 10+ | Serverless Postgres | Neon database |

### API & Integration

| Server | Stars | Description | Use Case |
|--------|-------|-------------|----------|
| **Postman MCP** | 145+ | API testing & collections | API development |
| **OpenAPI MCP** | 168+ | OpenAPI spec integration | API documentation |
| **Stripe MCP** | 1+ | Payment integration | E-commerce |

### Configuration Examples

```jsonc
// .claude/mcp/database.json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "supabase-mcp"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}"
      }
    },
    "postman": {
      "command": "npx",
      "args": ["-y", "@postman/mcp-server"],
      "env": {
        "POSTMAN_API_KEY": "${POSTMAN_API_KEY}"
      }
    }
  }
}
```

---

## Frontend & Design

### Design Tools

| Server | Stars | Description | Use Case |
|--------|-------|-------------|----------|
| **Figma Context MCP** | 12,500+ | Figma design integration | Design-to-code |
| **Cursor Talk to Figma** | 5,900+ | Figma read/modify | Agentic design updates |
| **Magic MCP** | 4,100+ | Frontend like magic | Component generation |

### Web Scraping & Research

| Server | Stars | Description | Use Case |
|--------|-------|-------------|----------|
| **Firecrawl MCP** | 5,200+ | Web scraping & search | Research, data extraction |
| **Chrome MCP** | 9,900+ | Browser automation | Web interaction |
| **Browser MCP** | 5,400+ | Browser control | Testing, automation |

### Configuration Examples

```jsonc
// .claude/mcp/frontend.json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-context-mcp"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "${FIGMA_ACCESS_TOKEN}"
      }
    },
    "magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic-mcp"]
    }
  }
}
```

---

## DevOps & Infrastructure

### Cloud Providers

| Server | Stars | Description | Use Case |
|--------|-------|-------------|----------|
| **AWS MCP** | 7,800+ | AWS service integration | Cloud resources |
| **Cloudflare API MCP** | 24+ | Cloudflare management | Workers, D1, R2 |
| **Vercel API MCP** | 19+ | Vercel deployment | Frontend hosting |

### Container & Deployment

| Server | Stars | Description | Use Case |
|--------|-------|-------------|----------|
| **Docker MCP** | 443+ | Docker operations | Container management |
| **Desktop Commander** | 5,200+ | Terminal & file control | System operations |

### Configuration Examples

```jsonc
// .claude/mcp/devops.json
{
  "mcpServers": {
    "docker": {
      "command": "npx",
      "args": ["-y", "docker-mcp"]
    },
    "aws": {
      "command": "npx",
      "args": ["-y", "@aws/mcp"],
      "env": {
        "AWS_REGION": "${AWS_REGION}",
        "AWS_ACCESS_KEY_ID": "${AWS_ACCESS_KEY_ID}",
        "AWS_SECRET_ACCESS_KEY": "${AWS_SECRET_ACCESS_KEY}"
      }
    },
    "cloudflare": {
      "command": "npx",
      "args": ["-y", "cloudflare-api-mcp"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "${CLOUDFLARE_API_TOKEN}"
      }
    }
  }
}
```

---

## Agent Frameworks

### Multi-Agent Systems

| Framework | Stars | Description | URL |
|-----------|-------|-------------|-----|
| **Vibe-Tools** | 4,600+ | AI Team & Advanced Skills | [eastlondoner/vibe-tools](https://github.com/eastlondoner/vibe-tools) |
| **Claudable** | 3,500+ | Multi-agent web builder | [opactorai/Claudable](https://github.com/opactorai/Claudable) |
| **CCManager** | 749+ | Session manager for agents | [kbwo/ccmanager](https://github.com/kbwo/ccmanager) |
| **Spec-Kitty** | 337+ | AI workflow dashboard | [Priivacy-ai/spec-kitty](https://github.com/Priivacy-ai/spec-kitty) |
| **ActivePieces** | 20,300+ | Workflow automation | [activepieces/activepieces](https://github.com/activepieces/activepieces) |

### Cursor-Specific Agents

| Agent | Stars | Description | URL |
|-------|-------|-------------|-----|
| **Cursor Agent Master Prompt** | 157+ | Master prompt template | [maxfahl/cursor-agent-master-prompt](https://github.com/maxfahl/cursor-agent-master-prompt) |
| **Cursor Agents** | 13+ | Multi-agent template | [pridiuksson/cursor-agents](https://github.com/pridiuksson/cursor-agents) |
| **Cursor Agents 2** | 14+ | QA.tech agents | [pridiuksson/cursor-agents-2](https://github.com/pridiuksson/cursor-agents-2) |

### Copilot Agent Extensions

| Extension | Stars | Description | URL |
|-----------|-------|-------------|-----|
| **Copilot Agent Mode Starter** | 23+ | Starter kit | [bradcstevens/github-copilot-agent-mode-starter-kit](https://github.com/bradcstevens/github-copilot-agent-mode-starter-kit) |
| **Copilot Task Delegate** | 6+ | Task delegation extension | [dvcrn/copilot-task-delegate](https://github.com/dvcrn/copilot-task-delegate) |

---

## Setup Instructions

### Claude Code Setup

1. **Create MCP directory**:
```bash
mkdir -p .claude/mcp
```

2. **Create configuration file**:
```jsonc
// .claude/mcp/servers.json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic/github-mcp-server"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic/playwright-mcp-server"]
    }
  }
}
```

3. **Set environment variables**:
```bash
# .env or export
export GITHUB_TOKEN="ghp_..."
```

### Cursor Setup

1. **Open Settings** → **MCP Servers**

2. **Add server configuration**:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic/github-mcp-server"],
      "env": {
        "GITHUB_TOKEN": "ghp_..."
      }
    }
  }
}
```

### Cline Setup

1. **Create config file**:
```bash
mkdir -p .cline
touch .cline/mcp_settings.json
```

2. **Add configuration**:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic/github-mcp-server"],
      "env": {
        "GITHUB_TOKEN": "ghp_..."
      }
    }
  }
}
```

### Windsurf Setup

1. **Open Settings** → **MCP**

2. **Add servers via UI or config file**

---

## Recommended Stack by Project Type

### Web Application (React/Next.js + Supabase)

```jsonc
{
  "mcpServers": {
    "github": { /* ... */ },
    "supabase": { /* ... */ },
    "playwright": { /* ... */ },
    "figma": { /* ... */ },
    "sentry": { /* ... */ },
    "vercel": { /* ... */ }
  }
}
```

### Mobile Application (React Native)

```jsonc
{
  "mcpServers": {
    "github": { /* ... */ },
    "figma": { /* ... */ },
    "firebase": { /* ... */ },
    "sentry": { /* ... */ },
    "postman": { /* ... */ }
  }
}
```

### Enterprise Application (Laravel/WordPress)

```jsonc
{
  "mcpServers": {
    "github": { /* ... */ },
    "jira": { /* ... */ },
    "sonarqube": { /* ... */ },
    "docker": { /* ... */ },
    "sentry": { /* ... */ }
  }
}
```

### Security-Focused Project

```jsonc
{
  "mcpServers": {
    "github": { /* ... */ },
    "hexstrike": { /* ... */ },
    "semgrep": { /* ... */ },
    "snyk": { /* ... */ },
    "sonarqube": { /* ... */ }
  }
}
```

---

## Installing MCP Servers

### Global Installation (Recommended)

```bash
# Install commonly used servers globally
npm install -g @anthropic/github-mcp-server
npm install -g @anthropic/playwright-mcp-server
npm install -g supabase-mcp
npm install -g sonarqube-mcp-server
npm install -g docker-mcp
```

### Per-Project Installation

```bash
# Add to devDependencies
npm install --save-dev @anthropic/github-mcp-server
npm install --save-dev @anthropic/playwright-mcp-server
```

### Using npx (On-Demand)

```jsonc
{
  "command": "npx",
  "args": ["-y", "package-name"]
}
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Server not found | Install with `npm install -g` or use `npx -y` |
| Authentication failed | Check environment variables |
| Timeout errors | Increase timeout in config |
| Permission denied | Check API key permissions |

### Debugging

```bash
# Test MCP server manually
npx -y @anthropic/github-mcp-server

# Check environment variables
env | grep GITHUB

# Verify npm packages
npm list -g | grep mcp
```

---

## Resources

### Official Documentation

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP Registry](https://github.com/modelcontextprotocol/registry)
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)

### Community Resources

- [MCP Inspector](https://github.com/modelcontextprotocol/inspector) - Visual testing tool
- [FastMCP](https://github.com/jlowin/fastmcp) - Build custom servers quickly

---

*Last Updated: January 2026*
