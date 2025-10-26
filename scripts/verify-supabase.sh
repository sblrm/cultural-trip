#!/bin/bash

# CulturalTrip - Supabase Setup Script
# This script helps you verify your Supabase setup

echo "🏛️  CulturalTrip - Supabase Setup Verification"
echo "=============================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ File .env.local tidak ditemukan!"
    echo "📝 Membuat .env.local dari template..."
    cp .env.example .env.local
    echo "✅ File .env.local berhasil dibuat"
    echo "⚠️  PENTING: Edit .env.local dan isi dengan credentials Supabase Anda!"
    echo ""
    echo "Buka Supabase Dashboard → Settings → API untuk mendapatkan:"
    echo "  - VITE_SUPABASE_URL"
    echo "  - VITE_SUPABASE_ANON_KEY"
    echo ""
    exit 1
fi

echo "✅ File .env.local ditemukan"
echo ""

# Check if environment variables are set
source .env.local

if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ VITE_SUPABASE_URL belum diset di .env.local"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ VITE_SUPABASE_ANON_KEY belum diset di .env.local"
    exit 1
fi

echo "✅ Environment variables configured"
echo "   Supabase URL: ${VITE_SUPABASE_URL}"
echo ""

# Test connection
echo "🔍 Testing Supabase connection..."
echo ""

# Run the test script
bun run tsx src/test-connection.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Koneksi ke Supabase berhasil!"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Pastikan semua migrations sudah dijalankan"
    echo "  2. Jalankan seed-data.sql untuk insert data destinasi"
    echo "  3. Run aplikasi: bun run dev"
    echo ""
else
    echo ""
    echo "❌ Koneksi ke Supabase gagal!"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "  1. Cek apakah Project Supabase sudah fully initialized"
    echo "  2. Verifikasi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY"
    echo "  3. Pastikan schema.sql sudah dijalankan di SQL Editor"
    echo "  4. Cek koneksi internet"
    echo ""
    exit 1
fi
