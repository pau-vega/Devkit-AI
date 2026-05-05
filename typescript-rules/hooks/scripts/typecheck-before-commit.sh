#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command' || true)

# Only intercept git commit commands
if ! echo "$COMMAND" | sed 's/&&/\n/g; s/||/\n/g; s/;/\n/g' | grep -qE '^\s*git\s+commit\b'; then
  exit 0
fi

# Run typecheck before allowing the commit
TSC_OUTPUT=$(pnpm typecheck 2>&1)
TSC_EXIT=$?

if [ $TSC_EXIT -ne 0 ]; then
  echo "Blocked: typecheck failed. Fix type errors before committing:" >&2
  echo "$TSC_OUTPUT" >&2
  exit 2
fi

exit 0
