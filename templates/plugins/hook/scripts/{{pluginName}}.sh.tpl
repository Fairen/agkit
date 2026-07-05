#!/usr/bin/env bash
# {{pluginTitle}} — PostToolUse hook (fires after Write|Edit succeeds).
# Claude Code pipes the event JSON on stdin. Exit 0 = OK; exit 2 = block
# with feedback (stderr is shown to Claude). Other events: PreToolUse,
# UserPromptSubmit, SessionStart, Stop... (see hooks reference).
set -euo pipefail

input=$(cat)
file_path=$(printf '%s' "$input" | grep -o '"file_path"[^,}]*' | head -1 | cut -d'"' -f4 || true)

# TODO: implement your check. Example: fail if a TODO marker slips in.
# if [ -n "$file_path" ] && grep -q "DO-NOT-COMMIT" "$file_path"; then
#   echo "Blocked: $file_path contains DO-NOT-COMMIT" >&2
#   exit 2
# fi

exit 0
