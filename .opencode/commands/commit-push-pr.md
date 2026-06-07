---
name: commit-push-pr
description: Complete workflow — commit, push, and create a pull request in one step
---

Dispatch the `commit-push-pr-agent` to commit changes, push to a new branch, and open a PR.

## Runtime

Dispatch the agent with the `task` tool:

```
task({ subagent_type: "commit-push-pr-agent", description: "<short task>", prompt: "<full request>" })
```

Pass the enforcement level and target path through `prompt` so the subagent has the full context.
