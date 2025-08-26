# PowerShell equivalent of install-hooks.sh
$ROOT_DIR = Split-Path -Parent $PSScriptRoot
$HOOKS_DIR = Join-Path $ROOT_DIR ".git\hooks"

if (!(Test-Path $HOOKS_DIR)) {
    Write-Host "❗ .git/hooks not found. Run this after 'git init' or in a cloned repo."
    exit 0
}

# Create pre-commit hook
$hookContent = @"
#!/usr/bin/env bash
scripts/prevent_plaintext_commit.sh
"@

$hookPath = Join-Path $HOOKS_DIR "pre-commit"
Set-Content -Path $hookPath -Value $hookContent -Encoding UTF8

# For Windows, we also create a .bat version for compatibility
$batContent = @"
@echo off
bash scripts/prevent_plaintext_commit.sh
"@

$batPath = Join-Path $HOOKS_DIR "pre-commit.bat"
Set-Content -Path $batPath -Value $batContent -Encoding UTF8

Write-Host "✅ pre-commit hook installed (both bash and batch versions)."