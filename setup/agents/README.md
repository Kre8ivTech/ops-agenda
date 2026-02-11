# External Agent Library

This directory houses agent prompt files sourced from the
[`wshobson/agents`](https://github.com/wshobson/agents) repository. The files are
vendored here so contributors can reference them without needing a network
connection. A curated subset of critical agents lives in `agents/critical/` so
the most important roles are always available even if the upstream library is
not synced.

## Updating the agent library

Run the sync script from the repository root:

```bash
./scripts/sync-agents.sh
```

Review the changes and commit any updated agent files alongside your work.
