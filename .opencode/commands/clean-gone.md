---
name: clean-gone
description: Clean up local branches that have been deleted from the remote repository
---

Dispatch the `clean-gone-agent` to remove local branches marked as [gone] and their associated worktrees.

## Runtime

Dispatch the agent with the `task` tool:

```
task({ subagent_type: "clean-gone-agent", description: "<short task>", prompt: "<full request>" })
```

Pass the enforcement level and target path through `prompt` so the subagent has the full context.
