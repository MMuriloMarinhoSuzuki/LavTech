#!/usr/bin/env bash
# Inicia o Lavanderia System no Linux/macOS (modo on-premise, porta única).
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"
exec node scripts/start.mjs
