# Installation guide for Windows dependencies
Write-Host "🔧 VTU EduMate - Installing Encryption Dependencies for Windows"
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (!$isAdmin) {
    Write-Host "⚠️  For best results, run PowerShell as Administrator"
    Write-Host ""
}

# Check for winget
$winget = Get-Command "winget" -ErrorAction SilentlyContinue
if ($winget) {
    Write-Host "✅ Windows Package Manager (winget) found"
    
    Write-Host ""
    Write-Host "📦 Installing 7-Zip..."
    try {
        & winget install --id 7zip.7zip --silent --accept-package-agreements --accept-source-agreements
        Write-Host "✅ 7-Zip installed successfully"
    } catch {
        Write-Host "❌ Failed to install 7-Zip via winget"
        Write-Host "   Manual download: https://www.7-zip.org/"
    }
    
    Write-Host ""
    Write-Host "🔐 Installing GPG..."
    try {
        & winget install --id GnuPG.GnuPG --silent --accept-package-agreements --accept-source-agreements
        Write-Host "✅ GPG installed successfully"
    } catch {
        Write-Host "❌ Failed to install GPG via winget"
        Write-Host "   Manual download: https://www.gpg4win.org/"
    }
} else {
    Write-Host "❗ Windows Package Manager (winget) not found"
    Write-Host ""
    Write-Host "📋 Manual Installation Required:"
    Write-Host "   1. 7-Zip: https://www.7-zip.org/"
    Write-Host "   2. GPG4Win: https://www.gpg4win.org/"
    Write-Host ""
    Write-Host "   After installation, ensure both 7z.exe and gpg.exe are in your PATH"
}

Write-Host ""
Write-Host "🔄 Please restart your PowerShell session after installation"
Write-Host "📋 Then run: ./scripts/encrypt_data.ps1 (to encrypt data)"
Write-Host "📋 Or run: ./scripts/decrypt_data.ps1 (to decrypt data)"