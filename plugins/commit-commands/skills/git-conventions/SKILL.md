---
name: git-conventions
description: >
  Git workflow conventions for committing, branching, and PRs. Covers commit
  message style, branch naming, and PR structure. Consult when creating commits
  or pull requests in any project.
---

# Git Conventions

## Commit Messages

Follow conventional commits format when appropriate:

```
<type>: <short summary>

<optional body>
```

### Types

| Type     | Usage                                      |
|----------|--------------------------------------------|
| `feat`   | A new feature                              |
| `fix`    | A bug fix                                  |
| `refactor` | A code change that neither fixes nor adds |
| `chore`  | Maintenance, config, deps                  |
| `docs`   | Documentation only                         |
| `style`  | Formatting, missing semicolons, etc.       |
| `test`   | Adding or correcting tests                 |

### Guidelines

- Use imperative mood in the subject line ("Add feature" not "Added feature")
- Keep the subject line under 72 characters
- Capitalize the subject line
- Do not end the subject line with a period
- Use the body to explain what and why, not how

## Branch Naming

Use descriptive branch names with a type prefix:

```
<type>/<short-description>
```

Examples: `feat/add-user-auth`, `fix/login-error`, `refactor/api-client`.

## PR Descriptions

Include in every PR description:

- **Summary** — 1-3 bullet points of what changed
- **Test plan** — checklist of what was verified

## Secrets Protection

Never stage or commit files that contain secrets:
- `.env` files
- `credentials.json`
- `*.pem` private keys
- Any file with API keys, tokens, or passwords

Always check `.gitignore` before staging files.
