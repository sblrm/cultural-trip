# 🚀 Quick Setup: Admin Dashboard

## ⚡ 5 Menit Setup

### Step 1: Jalankan Migration (1 menit)

```bash
# Buka Supabase Dashboard → SQL Editor
# Copy-paste isi file ini:
```

📁 File: `supabase/migrations/add_admin_role.sql`

Klik **RUN** ✅

---

### Step 2: Set Admin User (30 detik)

Di Supabase SQL Editor, jalankan:

```sql
-- GANTI EMAIL INI dengan email admin Anda!
UPDATE public.profiles 
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

Klik **RUN** ✅

---

### Step 3: Setup Storage Bucket (3 menit) ⚠️ CRITICAL!

**Buka Supabase Dashboard → Storage:**

1. Click **"New bucket"**
2. Name: `destination-images`
3. **✅ Centang "Public bucket"** (penting!)
4. Click **"Create bucket"**

**THEN run policies SQL (bucket public saja tidak cukup!):**

1. Navigate ke **SQL Editor**
2. Copy-paste isi file: **`supabase/migrations/add_storage_policies.sql`**
3. Click **"Run"** ✅
4. Verify: Should create 4 policies

**Verify policies created:**
```sql
-- Should return 4 rows
SELECT policyname FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
AND policyname LIKE '%destination%';
```

> 📖 Detail guide: [`docs/SUPABASE_STORAGE_SETUP.md`](./SUPABASE_STORAGE_SETUP.md)

---

### Step 4: Verifikasi (30 detik)

```sql
-- Cek apakah role berhasil diupdate
SELECT email, role 
FROM auth.users 
JOIN profiles ON auth.users.id = profiles.id 
WHERE email = 'your-email@example.com';
```

Harusnya muncul: `role: admin` ✅

---

### Step 5: Login & Access (1 menit)

1. Buka aplikasi TravoMate
2. Login dengan akun admin
3. Klik dropdown user (kanan atas)
4. Pilih **"Admin Dashboard"** 🛡️
5. Dashboard terbuka! 🎉

---

## 📋 Quick Test Checklist

- [ ] Migration berhasil dijalankan
- [ ] User role = 'admin'
- [ ] Storage bucket `destination-images` created & public
- [ ] Bisa akses `/admin`
- [ ] Bisa klik "Tambah Destinasi"
- [ ] Form muncul dengan lengkap
- [ ] Test upload gambar (< 5MB) ✅
- [ ] Test submit form
- [ ] Destinasi baru muncul di tabel
- [ ] Test edit destinasi
- [ ] Test delete destinasi (dengan konfirmasi)

---

## ✅ Yang Sudah Siap

### UI Components ✨
- Admin Dashboard page (`/admin`)
- Form Add/Edit Destinasi (`/admin/destinations/new`, `/admin/destinations/edit/:id`)
- Statistics cards (Total Destinasi, Reviews, Bookings)
- Data table dengan actions (View, Edit, Delete)
- Image upload dengan preview
- Form validation real-time

### Security 🔐
- Role-based access control
- RLS policies di Supabase
- Client-side route protection
- Admin-only operations

### Features 🎯
- **Create**: Form lengkap dengan validation
- **Read**: Dashboard dengan tabel & statistics
- **Update**: Edit form auto-populated
- **Delete**: Dengan confirmation dialog
- **Upload**: Image upload ke Supabase Storage
- **Validation**: Real-time dengan Zod schema

---

## 🎨 UI Preview

**Dashboard:**
```
┌─────────────────────────────────────────────┐
│  🛡️ Admin Dashboard      [+ Tambah Destinasi]│
├─────────────────────────────────────────────┤
│  📊 Total Destinasi  ⭐ Total Review  📦 Total│
│      14                 45              28   │
├─────────────────────────────────────────────┤
│  📋 Daftar Destinasi                         │
│  ┌───────────────────────────────────────┐  │
│  │ID │ Nama │ Lokasi │ Harga │ [Actions]│  │
│  │1  │Borobudur│Magelang│50000│👁️ ✏️ 🗑️ │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**Form:**
```
┌─────────────────────────────────────────────┐
│  ← Kembali                                   │
│                                              │
│  Tambah Destinasi Baru                       │
│  ─────────────────────────                   │
│  Nama Destinasi *     [______________]       │
│  Kota *               [______________]       │
│  Provinsi *           [▼ Pilih provinsi]     │
│  Tipe *               [▼ Pilih tipe]         │
│  Latitude *           [______________]       │
│  Longitude *          [______________]       │
│  ...                                         │
│  Upload Gambar        [📁 Choose file]       │
│  [Preview Image]                             │
│                                              │
│  [Batal]  [Tambah Destinasi]                │
└─────────────────────────────────────────────┘
```

---

## 🎯 Usage Flow

### Menambah Destinasi:
1. Click "Tambah Destinasi"
2. Fill form (semua field dengan * wajib diisi)
3. Upload gambar
4. Click "Tambah Destinasi"
5. ✅ Auto redirect ke dashboard dengan toast success

### Mengedit Destinasi:
1. Click icon edit (✏️) di row destinasi
2. Form auto-populated
3. Edit field yang perlu
4. Click "Update Destinasi"
5. ✅ Auto redirect dengan toast success

### Menghapus Destinasi:
1. Click icon delete (🗑️) di row destinasi
2. Confirm di dialog
3. ✅ Destinasi terhapus, tabel refresh

---

## 🔧 Troubleshooting

**Problem:** Tidak bisa akses `/admin`
```sql
-- Check role di Supabase:
SELECT id, email, role 
FROM auth.users 
JOIN profiles ON auth.users.id = profiles.id 
WHERE email = 'your-email@example.com';

-- Fix jika role = 'user':
UPDATE profiles SET role = 'admin' WHERE id = '{user_id}';
```

**Problem:** Upload gambar error "Bucket not found"
**Solution:**
1. Buka Supabase Dashboard → Storage
2. Create bucket: `destination-images`
3. ✅ **Centang "Public bucket"** (critical!)
4. **Run policies SQL**: `supabase/migrations/add_storage_policies.sql`
5. Refresh admin page, try upload lagi
6. Lihat guide lengkap: [`SUPABASE_STORAGE_SETUP.md`](./SUPABASE_STORAGE_SETUP.md)

**Problem:** Upload error "new row violates row-level security policy" ⚠️
**This is the most common error!**

**Solution:**
1. **MUST run policies SQL**: `supabase/migrations/add_storage_policies.sql`
2. Bucket public saja **TIDAK CUKUP**, need policies!
3. Verify with SQL:
   ```sql
   SELECT policyname FROM pg_policies 
   WHERE schemaname = 'storage' AND policyname LIKE '%destination%';
   ```
4. Should return **4 policies**. If not, run migration!

**Problem:** Upload gambar error "Permission denied"
- Check bucket is **Public**
- Verify policies di Storage → Policies
- Pastikan authenticated users bisa INSERT

**Problem:** Form validation error
- Red text di bawah field menjelaskan error
- Fix sesuai instruksi (contoh: "Min 50 karakter")

---

## 📚 Full Documentation

Untuk dokumentasi lengkap, lihat:
- **Admin Guide**: `docs/ADMIN_DASHBOARD.md`
- **Storage Setup**: `docs/SUPABASE_STORAGE_SETUP.md` ⭐ NEW!
- **Add Destinations**: `docs/ADD_DESTINATIONS.md`
- **Search/Filter/Pagination**: `docs/ADMIN_SEARCH_FILTER_PAGINATION.md`
- **Testing Guide**: `docs/ADMIN_TESTING_GUIDE.md`

---

## ✨ Production Ready!

Admin Dashboard sudah siap digunakan dengan:
- ✅ Security (RLS, RBAC)
- ✅ Validation (Zod schema)
- ✅ Error handling
- ✅ Loading states
- ✅ Responsive design
- ✅ User-friendly UX

**Total Setup Time:** ~5 menit
**Difficulty:** Mudah ⭐

Happy managing! 🚀
