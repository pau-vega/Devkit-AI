---
name: commit
description: Create a git commit with an automatically generated message based on staged and unstaged changes
---

Dispatch the `commit-agent` to stage changes and create a commit with an appropriate message.

## Runtime

Dispatch the agent with the `task` tool:

```
task({ subagent_type: "commit-agent", description: "<short task>", prompt: "<full request>" })
```

Pass the enforcement level and target path through `prompt` so the subagent has the full context.
