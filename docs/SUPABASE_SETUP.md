# 🗄️ Panduan Setup Database Supabase - CulturalTrip

Dokumen ini berisi langkah-langkah lengkap untuk setup database Supabase untuk aplikasi CulturalTrip.

## 📋 Prasyarat

1. Akun Supabase (daftar di [supabase.com](https://supabase.com))
2. Project Supabase yang sudah dibuat
3. Akses ke Supabase Dashboard

## 🚀 Langkah Setup

### 1. Buat Project Baru di Supabase

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Klik "New Project"
3. Isi detail project:
   - **Name**: CulturalTrip (atau nama yang Anda inginkan)
   - **Database Password**: Simpan password ini dengan aman!
   - **Region**: Pilih region terdekat (Southeast Asia - Singapore)
4. Klik "Create new project" dan tunggu hingga selesai (~2 menit)

### 2. Aktifkan PostGIS Extension

PostGIS diperlukan untuk fitur geospatial (lokasi peta).

1. Di Supabase Dashboard, buka **Database** → **Extensions**
2. Cari "postgis" di search bar
3. Klik toggle untuk enable PostGIS extension
4. Tunggu hingga status menjadi "Enabled"

### 3. Jalankan Schema Utama

1. Di Supabase Dashboard, buka **SQL Editor**
2. Klik "New Query"
3. Copy seluruh isi file `supabase/schema.sql` dan paste ke editor
4. Klik **Run** atau tekan `Ctrl+Enter`
5. Pastikan tidak ada error (akan muncul "Success. No rows returned")

**Yang dibuat:**
- ✅ Custom type `hours_type` untuk jam operasional
- ✅ Tabel `destinations` dengan kolom geography (PostGIS)
- ✅ Tabel `plans` untuk rencana perjalanan user
- ✅ Tabel `plan_destinations` untuk relasi many-to-many
- ✅ Tabel `profiles` untuk profil user
- ✅ RLS (Row Level Security) policies
- ✅ Triggers untuk auto-update `updated_at`
- ✅ Indexes untuk performa query

### 4. Jalankan Migrations

Jalankan migration files satu per satu dalam urutan berikut:

#### a. Add Profiles Insert Policy
```sql
-- File: supabase/migrations/add_profiles_insert_policy.sql
```
1. Buka file `supabase/migrations/add_profiles_insert_policy.sql`
2. Copy isinya ke SQL Editor baru
3. Run query

#### b. Add Handle New User Profile
```sql
-- File: supabase/migrations/add_handle_new_user_profile.sql
```
1. Buka file `supabase/migrations/add_handle_new_user_profile.sql`
2. Copy isinya ke SQL Editor baru
3. Run query

**Fungsi ini otomatis membuat profile saat user baru register!**

#### c. Add Profiles Security Features
```sql
-- File: supabase/migrations/add_profiles_security_features.sql
```
1. Buka file `supabase/migrations/add_profiles_security_features.sql`
2. Copy isinya ke SQL Editor baru
3. Run query

#### d. Add Tickets Table
```sql
-- File: supabase/migrations/add_tickets_table.sql
```
1. Buka file `supabase/migrations/add_tickets_table.sql`
2. Copy isinya ke SQL Editor baru
3. Run query

**Ini membuat tabel untuk sistem booking tiket!**

#### e. Add Bookings, Purchases, Refunds
```sql
-- File: supabase/migrations/add_bookings_purchases_refunds.sql
```
1. Buka file `supabase/migrations/add_bookings_purchases_refunds.sql`
2. Copy isinya ke SQL Editor baru
3. Run query

#### f. Add Upsert Profile RPC
```sql
-- File: supabase/migrations/add_upsert_profile_rpc.sql
```
1. Buka file `supabase/migrations/add_upsert_profile_rpc.sql`
2. Copy isinya ke SQL Editor baru
3. Run query

### 5. Insert Data Destinasi

1. Buka file `supabase/seed-data.sql`
2. Copy seluruh isinya ke SQL Editor baru
3. Run query
4. Verifikasi: Buka **Table Editor** → `destinations` → Anda harus melihat 10 destinasi

**Data yang diinsert:**
- 🕌 Candi Prambanan (Yogyakarta)
- 🏘️ Desa Adat Penglipuran (Bali)
- ⚰️ Tana Toraja (Sulawesi Selatan)
- 🎨 Kampung Batik Trusmi (Jawa Barat)
- 👑 Keraton Yogyakarta
- 🏔️ Desa Adat Wae Rebo (NTT)
- 🕌 Candi Borobudur (Jawa Tengah)
- 🏘️ Kampung Naga (Jawa Barat)
- 🏰 Istana Maimun (Medan)
- 🏘️ Desa Tenganan Pegringsingan (Bali)

### 6. Setup Environment Variables

1. Di Supabase Dashboard, buka **Settings** → **API**
2. Copy credentials berikut:

**Project URL:**
```
https://[project-id].supabase.co
```

**API Keys - anon public:**
```
eyJhbGc...
```

3. Buat file `.env.local` di root project Anda:

```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_GEMINI_API_KEY=your_gemini_api_key
```

4. **JANGAN COMMIT** file `.env.local` ke Git!

### 7. Konfigurasi Authentication

1. Di Supabase Dashboard, buka **Authentication** → **Providers**
2. Enable **Email** provider:
   - ✅ Enable Email provider
   - ✅ Confirm email (recommended untuk production)
3. (Opsional) Enable social login jika diperlukan

### 8. Test Koneksi Database

Jalankan test script untuk memastikan koneksi berhasil:

```bash
# Di terminal
bun run tsx src/test-connection.ts
```

Output yang diharapkan:
```
Successfully connected to Supabase!
```

### 9. Verifikasi PostGIS

Jalankan query test PostGIS:

1. Buka SQL Editor
2. Copy query dari `supabase/test-postgis.sql`
3. Run dan pastikan tidak ada error

## 🔍 Verifikasi Setup

Checklist untuk memastikan setup berhasil:

- [ ] PostGIS extension enabled
- [ ] 4 tables created: `destinations`, `plans`, `plan_destinations`, `profiles`
- [ ] Additional tables: `tickets`, `bookings`, `purchases`, `refunds`
- [ ] 10 destinations data inserted
- [ ] RLS policies enabled
- [ ] Triggers created untuk `updated_at`
- [ ] Authentication email provider enabled
- [ ] Environment variables configured
- [ ] Test connection berhasil

## 📊 Struktur Database

```
┌─────────────────┐
│   auth.users    │  (Supabase built-in)
└────────┬────────┘
         │
         ├─────────────┐
         │             │
┌────────▼────────┐ ┌──▼───────────┐
│    profiles     │ │    plans     │
└─────────────────┘ └──────┬───────┘
                           │
                    ┌──────▼──────────────┐
                    │ plan_destinations   │
                    └──────┬──────────────┘
                           │
                    ┌──────▼────────┐
                    │ destinations  │ (with PostGIS)
                    └───────────────┘
```

## 🔐 Row Level Security (RLS) Policies

| Tabel | Policy | Deskripsi |
|-------|--------|-----------|
| `destinations` | SELECT (public) | Semua orang bisa lihat destinasi |
| `plans` | SELECT (owner only) | User hanya bisa lihat plan sendiri |
| `plan_destinations` | SELECT (owner only) | User hanya bisa lihat plan destinations sendiri |
| `profiles` | SELECT (public) | Semua orang bisa lihat profiles |
| `profiles` | UPDATE (owner only) | User hanya bisa update profile sendiri |
| `tickets` | All (owner only) | User hanya bisa manage tickets sendiri |

## 🐛 Troubleshooting

### Error: "extension postgis does not exist"
**Solusi**: Aktifkan PostGIS extension via Dashboard → Database → Extensions

### Error: "permission denied for table destinations"
**Solusi**: Pastikan RLS policies sudah dibuat dengan benar

### Error: "relation destinations does not exist"
**Solusi**: Jalankan schema.sql terlebih dahulu

### Tidak ada data destinasi
**Solusi**: Jalankan seed-data.sql untuk insert data awal

### Test connection gagal
**Solusi**: 
1. Cek VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.local
2. Pastikan project Supabase sudah fully initialized (tunggu ~2 menit)
3. Cek internet connection

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostGIS Documentation](https://postgis.net/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🎉 Selesai!

Database Supabase Anda sekarang sudah siap digunakan! 

Jalankan aplikasi dengan:
```bash
bun run dev
```

Kemudian buka http://localhost:8080 dan coba:
1. Register user baru
2. Lihat halaman Destinations
3. Test fitur Trip Planner
4. Coba booking tiket

---

**Need help?** Contact: subhan.larasati@gmail.com
