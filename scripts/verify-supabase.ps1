# CulturalTrip - Supabase Setup Script (PowerShell)
# This script helps you verify your Supabase setup

Write-Host "🏛️  CulturalTrip - Supabase Setup Verification" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ File .env.local tidak ditemukan!" -ForegroundColor Red
    Write-Host "📝 Membuat .env.local dari template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
    Write-Host "✅ File .env.local berhasil dibuat" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  PENTING: Edit .env.local dan isi dengan credentials Supabase Anda!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Buka Supabase Dashboard → Settings → API untuk mendapatkan:"
    Write-Host "  - VITE_SUPABASE_URL"
    Write-Host "  - VITE_SUPABASE_ANON_KEY"
    Write-Host ""
    exit 1
}

Write-Host "✅ File .env.local ditemukan" -ForegroundColor Green
Write-Host ""

# Read environment variables
$envContent = Get-Content ".env.local" -Raw
$supabaseUrl = if ($envContent -match 'VITE_SUPABASE_URL=(.+)') { $matches[1].Trim() } else { $null }
$supabaseKey = if ($envContent -match 'VITE_SUPABASE_ANON_KEY=(.+)') { $matches[1].Trim() } else { $null }

if (-not $supabaseUrl) {
    Write-Host "❌ VITE_SUPABASE_URL belum diset di .env.local" -ForegroundColor Red
    exit 1
}

if (-not $supabaseKey) {
    Write-Host "❌ VITE_SUPABASE_ANON_KEY belum diset di .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environment variables configured" -ForegroundColor Green
Write-Host "   Supabase URL: $supabaseUrl" -ForegroundColor Gray
Write-Host ""

# Test connection
Write-Host "🔍 Testing Supabase connection..." -ForegroundColor Cyan
Write-Host ""

# Run the test script
$testResult = & bun run tsx src/test-connection.ts 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Koneksi ke Supabase berhasil!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Pastikan semua migrations sudah dijalankan"
    Write-Host "  2. Jalankan seed-data.sql untuk insert data destinasi"
    Write-Host "  3. Run aplikasi: bun run dev"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Koneksi ke Supabase gagal!" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Cek apakah Project Supabase sudah fully initialized"
    Write-Host "  2. Verifikasi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY"
    Write-Host "  3. Pastikan schema.sql sudah dijalankan di SQL Editor"
    Write-Host "  4. Cek koneksi internet"
    Write-Host ""
    exit 1
}
