# PowerShell equivalent of encrypt_data.sh for Windows
# Purpose: Encrypt the local ./data/ directory into a single encrypted artifact  
# Output: data.sec.tar.gz.gpg (committable)
# REQUIRES: 7-Zip (for compression) and GPG4Win (for encryption)

$ROOT_DIR = Split-Path -Parent $PSScriptRoot
Set-Location $ROOT_DIR

if (!(Test-Path "data")) {
    Write-Host "❗ No ./data directory found. Create it and place your private files, then re-run."
    exit 1
}

# Check for required tools
$sevenZip = Get-Command "7z" -ErrorAction SilentlyContinue
if (!$sevenZip) {
    Write-Host "❗ 7-Zip not found. Please install 7-Zip from https://www.7-zip.org/"
    Write-Host "   Add 7z.exe to PATH or install via: winget install 7zip.7zip"
    exit 1
}

$gpg = Get-Command "gpg" -ErrorAction SilentlyContinue
if (!$gpg) {
    Write-Host "❗ GPG not found. Please install GPG4Win from https://www.gpg4win.org/"
    Write-Host "   Or install via: winget install GnuPG.GnuPG"
    exit 1
}

# Create compressed archive
Write-Host "📦 Packing ./data -> data.tar.gz"
& 7z a -tgzip data.tar.gz data/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create archive"
    exit 1
}

# Encrypt the archive
if ($env:GPG_PASSPHRASE) {
    Write-Host "🔐 Encrypting non-interactively (env: GPG_PASSPHRASE)"
    $env:TMPFILE = [System.IO.Path]::GetTempFileName()
    $env:GPG_PASSPHRASE | Out-File -FilePath $env:TMPFILE -Encoding UTF8
    & gpg --batch --yes --passphrase-file $env:TMPFILE --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 --s2k-digest-algo SHA512 --s2k-count 65536 --force-mdc -c data.tar.gz
    Remove-Item $env:TMPFILE -Force
} else {
    Write-Host "🔐 Encrypting (you will be prompted for a passphrase)"
    & gpg --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 --s2k-digest-algo SHA512 --s2k-count 65536 --force-mdc -c data.tar.gz
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to encrypt archive"
    Remove-Item "data.tar.gz" -Force -ErrorAction SilentlyContinue
    exit 1
}

# Rename to stable name
if (Test-Path "data.tar.gz.gpg") {
    Move-Item "data.tar.gz.gpg" "data.sec.tar.gz.gpg" -Force
}

# Clean up
Remove-Item "data.tar.gz" -Force -ErrorAction SilentlyContinue

Write-Host "✅ Encrypted artifact ready: data.sec.tar.gz.gpg (safe to commit)"