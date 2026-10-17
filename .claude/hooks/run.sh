#!/usr/bin/env sh
# Runs a hook script with the Node version from .nvmrc when it is installed through nvm,
# so hooks work even when the shell's default Node is older than the workspace needs.
dir="${CLAUDE_PROJECT_DIR:-.}"
wanted="$(cat "$dir/.nvmrc")"
node_bin="$(ls -d "${NVM_DIR:-$HOME/.nvm}/versions/node/v$wanted".*/bin 2>/dev/null | sort -V | tail -n 1)"
if [ -n "$node_bin" ]; then
  PATH="$node_bin:$PATH"
  export PATH
fi
exec node "$dir/.claude/hooks/$1"
