#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command' || true)

# Only intercept git commit commands
if ! echo "$COMMAND" | sed 's/&&/\n/g; s/||/\n/g; s/;/\n/g' | grep -qE '^\s*git\s+commit\b'; then
  exit 0
fi

# Run lint check before allowing the commit
LINT_OUTPUT=$(pnpm lint 2>&1)
LINT_EXIT=$?

if [ $LINT_EXIT -ne 0 ]; then
  echo "Blocked: lint check failed. Fix lint errors before committing:" >&2
  echo "$LINT_OUTPUT" >&2
  exit 2
fi

exit 0
