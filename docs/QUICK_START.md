# 🚀 Quick Start - Supabase Setup

Setup database Supabase untuk CulturalTrip dalam 5 menit!

## Langkah Cepat

### 0. Install Dependencies
Pilih salah satu:

**Opsi A: Menggunakan Bun (Recommended - Lebih Cepat)**
```bash
# Install Bun terlebih dahulu (lihat docs/INSTALL_BUN.md)
powershell -c "irm bun.sh/install.ps1|iex"

# Install dependencies
bun install
```

**Opsi B: Menggunakan npm (Jika Bun belum terinstall)**
```bash
npm install
```

> 📖 **Panduan install Bun lengkap**: [docs/INSTALL_BUN.md](./INSTALL_BUN.md)

### 1. Buat Project Supabase
1. Buka [supabase.com](https://supabase.com) dan login
2. Create New Project
3. Pilih region: **Southeast Asia (Singapore)**
4. Simpan database password!

### 2. Enable PostGIS
Dashboard → Database → Extensions → Enable **"postgis"**

### 3. Run Setup SQL
1. Dashboard → SQL Editor → New Query
2. Copy-paste file **`supabase/complete-setup.sql`**
3. Klik **Run** (Ctrl+Enter)
4. Tunggu hingga selesai (~10 detik)

### 4. Insert Data Destinasi
1. SQL Editor → New Query
2. Copy-paste file **`supabase/seed-data.sql`**
3. Run

### 5. Setup Environment
1. Dashboard → Settings → API
2. Copy **Project URL** dan **anon public key**
3. Buat file `.env.local`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_GEMINI_API_KEY=your_gemini_key
```

### 6. Test Connection

**Menggunakan Bun:**
```bash
bun run test:connection
```

**Menggunakan npm:**
```bash
npm run test:connection
```

### 7. Run App

**Menggunakan Bun:**
```bash
bun run dev
```

**Menggunakan npm:**
```bash
npm run dev
```

Buka http://localhost:8080 🎉

---

## Verifikasi Setup

**Menggunakan Bun:**
```bash
bun run setup:check
```

**Menggunakan npm:**
```bash
npm run setup:check
```

## Troubleshooting

**Error: "bun is not recognized"**
→ Install Bun atau gunakan npm. Lihat [docs/INSTALL_BUN.md](./INSTALL_BUN.md)

**Error: postgis not found**
→ Enable PostGIS di Extensions

**Error: connection failed**
→ Cek `.env.local`, pastikan URL dan key benar

**No data shown**
→ Jalankan `seed-data.sql`

---

📖 **Dokumentasi lengkap**: [docs/SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
