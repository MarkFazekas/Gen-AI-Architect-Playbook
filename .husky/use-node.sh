# Sourced by the git hooks: put the Node version from .nvmrc first on PATH when it is installed
# through nvm, so the hooks work even when the shell's default Node is older than the workspace needs.
wanted="$(cat .nvmrc)"
node_bin="$(ls -d "${NVM_DIR:-$HOME/.nvm}/versions/node/v$wanted".*/bin 2>/dev/null | sort -V | tail -n 1)"
if [ -n "$node_bin" ]; then
  PATH="$node_bin:$PATH"
  export PATH
fi
