#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_DIR="$ROOT_DIR/.git/hooks"

if [ ! -d "$HOOKS_DIR" ]; then
  echo "❗ .git/hooks not found. Run this after 'git init' or in a cloned repo."
  exit 0
fi

chmod +x "$ROOT_DIR/scripts/prevent_plaintext_commit.sh"
cat > "$HOOKS_DIR/pre-commit" <<'EOF'
#!/usr/bin/env bash
scripts/prevent_plaintext_commit.sh
EOF
chmod +x "$HOOKS_DIR/pre-commit"
echo "✅ pre-commit hook installed."