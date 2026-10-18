# Khoj Worker ke secrets set karta hai. Is file mein koi key nahi hai.
# Chalao: powershell -ExecutionPolicy Bypass -File .\set-secrets.ps1
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function New-Code([int]$n) {
  $chars = 'abcdefghjkmnpqrstuvwxyz23456789'.ToCharArray()
  $bytes = New-Object byte[] $n
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
}

Write-Host ''
Write-Host '1/4  Claude key (console.anthropic.com). "Enter a secret value" aaye to paste karke Enter dabao. Key screen pe nahi dikhegi.' -ForegroundColor Yellow
npx wrangler secret put ANTHROPIC_API_KEY

Write-Host ''
Write-Host '2/4  Gemini key (aistudio.google.com, billing wali). Paste karke Enter.' -ForegroundColor Yellow
npx wrangler secret put GEMINI_API_KEY

$code = New-Code 10
$admin = New-Code 32
Write-Host ''
Write-Host '3/4  ACCESS_CODE apne aap bana raha hoon...' -ForegroundColor Yellow
$code | npx wrangler secret put ACCESS_CODE
Write-Host '4/4  ADMIN_TOKEN apne aap bana raha hoon...' -ForegroundColor Yellow
$admin | npx wrangler secret put ADMIN_TOKEN

Write-Host ''
Write-Host '================ YE DONO SAVE KAR LO (password manager mein) ================' -ForegroundColor Green
Write-Host "ACCESS_CODE : $code   (game mein AI ke liye)"
Write-Host "ADMIN_TOKEN : $admin   (admin.html ke liye, kisi ko mat dena)"
Write-Host '=============================================================================' -ForegroundColor Green
Write-Host 'Ho gaya. Ye window band karne se pehle dono codes copy kar lena.'
