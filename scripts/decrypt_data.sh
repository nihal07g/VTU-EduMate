#!/usr/bin/env bash
# Purpose: Decrypt data.sec.tar.gz.gpg into ./data/ (overwrites existing ./data)
# REQUIRES: gpg (gnupg)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f "data.sec.tar.gz.gpg" ]; then
  echo "❗ Encrypted file data.sec.tar.gz.gpg not found in repo root."
  exit 1
fi

# Decrypt to stdout then extract
if [ -n "${GPG_PASSPHRASE:-}" ]; then
  echo "🔓 Decrypting non-interactively (env: GPG_PASSPHRASE)"
  gpg --batch --yes --passphrase "$GPG_PASSPHRASE" -d data.sec.tar.gz.gpg | tar -xz
else
  echo "🔓 Decrypting (you will be prompted for passphrase) and extracting to ./data"
  gpg -d data.sec.tar.gz.gpg | tar -xz
fi

echo "✅ Decrypted and extracted into ./data/"