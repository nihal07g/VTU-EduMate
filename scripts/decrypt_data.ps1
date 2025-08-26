# PowerShell equivalent of decrypt_data.sh for Windows
# Purpose: Decrypt data.sec.tar.gz.gpg into ./data/ (overwrites existing ./data)
# REQUIRES: 7-Zip (for decompression) and GPG4Win (for decryption)

$ROOT_DIR = Split-Path -Parent $PSScriptRoot
Set-Location $ROOT_DIR

if (!(Test-Path "data.sec.tar.gz.gpg")) {
    Write-Host "❗ Encrypted file data.sec.tar.gz.gpg not found in repo root."
    exit 1
}

# Check for required tools
$sevenZip = Get-Command "7z" -ErrorAction SilentlyContinue
if (!$sevenZip) {
    Write-Host "❗ 7-Zip not found. Please install 7-Zip from https://www.7-zip.org/"
    exit 1
}

$gpg = Get-Command "gpg" -ErrorAction SilentlyContinue
if (!$gpg) {
    Write-Host "❗ GPG not found. Please install GPG4Win from https://www.gpg4win.org/"
    exit 1
}

# Decrypt the archive
if ($env:GPG_PASSPHRASE) {
    Write-Host "🔓 Decrypting non-interactively (env: GPG_PASSPHRASE)"
    $env:TMPFILE = [System.IO.Path]::GetTempFileName()
    $env:GPG_PASSPHRASE | Out-File -FilePath $env:TMPFILE -Encoding UTF8
    & gpg --batch --yes --passphrase-file $env:TMPFILE -d data.sec.tar.gz.gpg > data.tar.gz
    Remove-Item $env:TMPFILE -Force
} else {
    Write-Host "🔓 Decrypting (you will be prompted for passphrase)"
    & gpg -d data.sec.tar.gz.gpg > data.tar.gz
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to decrypt archive"
    exit 1
}

# Extract the archive
Write-Host "📂 Extracting to ./data/"
if (Test-Path "data") {
    Write-Host "⚠️  Removing existing ./data directory"
    Remove-Item "data" -Recurse -Force
}

& 7z x data.tar.gz
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to extract archive"
    Remove-Item "data.tar.gz" -Force -ErrorAction SilentlyContinue
    exit 1
}

# Clean up
Remove-Item "data.tar.gz" -Force -ErrorAction SilentlyContinue

Write-Host "✅ Decrypted and extracted into ./data/"