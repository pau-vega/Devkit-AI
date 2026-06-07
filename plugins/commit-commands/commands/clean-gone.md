---
name: clean-gone
description: Clean up local branches that have been deleted from the remote repository
allowed-tools:
  - Agent
---

Dispatch the `clean-gone-agent` to remove local branches marked as [gone] and their associated worktrees.
