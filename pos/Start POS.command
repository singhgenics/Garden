#!/bin/zsh
# Double-click on the counter Mac to start the POS. Keep this window open during service.
cd "$(dirname "$0")"
# Already running? Then just open it.
if curl -s -m 2 -o /dev/null http://localhost:8080/api/me; then
  echo "The POS is already running. Opening it in the browser."
  open "http://localhost:8080"
  exit 0
fi
# Node may be installed through nvm, which a double-clicked script doesn't load by itself
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"
command -v node >/dev/null || { echo "Node.js is not installed. Get the LTS version from https://nodejs.org and try again."; read; exit 1; }
(sleep 2; open "http://localhost:8080") &
node server.js
