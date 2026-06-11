#!/bin/bash
INPUT=$(cat)

. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/settings-lib.sh"
settings_rule_enabled "typescript-rules" "no_package_json_edit" || exit 0

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path')

if echo "$FILE_PATH" | grep -q 'package\.json$'; then
  echo "Blocked: do not manually edit package.json — use 'pnpm add' or 'pnpm remove' instead" >&2
  exit 2
fi

exit 0
