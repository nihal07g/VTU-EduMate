#!/usr/bin/env bash
# Purpose: Encrypt the local ./data/ directory into a single encrypted artifact
# Output: data.sec.tar.gz.gpg (committable)
# REQUIRES: gpg (gnupg)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -d "data" ]; then
  echo "❗ No ./data directory found. Create it and place your private files, then re-run."
  exit 1
fi

# Create a clean tarball
echo "📦 Packing ./data -> data.tar.gz"
tar -czf data.tar.gz data

# Interactive passphrase by default; CI-friendly if GPG_PASSPHRASE is set
if [ -n "${GPG_PASSPHRASE:-}" ]; then
  echo "🔐 Encrypting non-interactively (env: GPG_PASSPHRASE)"
  gpg --batch --yes --passphrase "$GPG_PASSPHRASE" -c data.tar.gz
else
  echo "🔐 Encrypting (you will be prompted for a passphrase)"
  gpg -c data.tar.gz
fi

# Rename to a stable, professional name
mv -f data.tar.gz.gpg data.sec.tar.gz.gpg

# Remove plaintext artifacts
rm -f data.tar.gz

echo "✅ Encrypted artifact ready: data.sec.tar.gz.gpg (safe to commit)"