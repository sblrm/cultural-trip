# 🛡️ Admin Dashboard Documentation

## 📋 Overview

Admin Dashboard adalah panel kontrol untuk mengelola destinasi budaya di TravoMate. Dashboard ini dilengkapi dengan:
- ✅ CRUD (Create, Read, Update, Delete) destinasi
- ✅ Upload gambar langsung
- ✅ Form validation lengkap
- ✅ Statistics dashboard
- ✅ Role-based access control
- ✅ Production-ready security
- ✅ **Search, Filter & Pagination** (NEW!)

> **Note:** Untuk dokumentasi lengkap Search, Filter & Pagination, lihat [ADMIN_SEARCH_FILTER_PAGINATION.md](./ADMIN_SEARCH_FILTER_PAGINATION.md)

---

## 🚀 Setup Admin User

### 1. Jalankan Migration

```bash
# Jalankan di Supabase SQL Editor
# File: supabase/migrations/add_admin_role.sql
```

Migration ini akan:
- Menambah kolom `role` ke tabel `profiles`
- Membuat function `is_admin()`
- Update RLS policies untuk admin

### 2. Set User Pertama sebagai Admin

Setelah registrasi akun, jalankan query ini di Supabase SQL Editor:

```sql
-- Ganti dengan email admin Anda
UPDATE public.profiles 
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com'
);
```

### 3. Verifikasi Admin Access

Login dengan akun admin, klik dropdown user di header → **Admin Dashboard**

---

## 🎯 Fitur Admin Dashboard

### 1. **Dashboard Utama** (`/admin`)

**Features:**
- 📊 Statistics Cards:
  - Total Destinasi
  - Total Review
  - Total Booking
- � **Search & Filter Bar**:
  - Real-time search (nama, kota, provinsi, tipe)
  - Filter by Province (dropdown dengan semua provinsi)
  - Filter by Type (dropdown dengan semua tipe)
  - Sort by (name/price/created date)
  - Sort order toggle (ascending/descending)
  - Reset filters button
  - Results counter (menampilkan X dari Y destinasi)
- 📄 **Pagination Controls**:
  - Items per page selector (5, 10, 25, 50, 100)
  - Smart page navigation (First, Prev, Page Numbers, Next, Last)
  - Auto-ellipsis untuk page counts > 7
  - Page info display (Halaman X dari Y)
- �📋 Tabel Destinasi dengan:
  - Thumbnail gambar
  - Info lokasi & tipe
  - Harga
  - Status
  - Action buttons (View, Edit, Delete)
- ➕ Button "Tambah Destinasi"

**Data Management:**
- Search bekerja real-time tanpa API calls (client-side)
- Filters dapat dikombinasikan (cumulative filtering)
- Pagination otomatis menyesuaikan dengan filter results
- Reset page ke 1 saat filter berubah
- Responsive design untuk mobile

**Actions:**
- View: Lihat detail destinasi di public page
- Edit: Edit destinasi yang ada
- Delete: Hapus destinasi (dengan konfirmasi)

> **Dokumentasi Lengkap**: Lihat [ADMIN_SEARCH_FILTER_PAGINATION.md](./ADMIN_SEARCH_FILTER_PAGINATION.md) untuk technical details, algorithms, dan configuration options

---

### 2. **Form Tambah/Edit Destinasi** (`/admin/destinations/new` & `/admin/destinations/edit/:id`)

**Fields:**

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Nama Destinasi | Text | Min 3 karakter | Unique |
| Kota | Text | Min 2 karakter | - |
| Provinsi | Dropdown | Required | 38 provinsi Indonesia |
| Tipe | Dropdown | Required | 8 kategori budaya |
| Latitude | Number | -90 to 90 | Koordinat GPS |
| Longitude | Number | -180 to 180 | Koordinat GPS |
| Jam Buka | Time | Format HH:MM | 24 jam |
| Jam Tutup | Time | Format HH:MM | 24 jam |
| Durasi | Number | 15-1440 menit | Durasi kunjungan |
| Harga | Number | >= 0 | Dalam Rupiah |
| Transportasi | Text | Min 1 item | Comma-separated |
| Deskripsi | Textarea | Min 50 karakter | Deskripsi lengkap |
| Gambar | File Upload | Max 5MB | JPG, PNG |

**Features:**
- Real-time validation
- Image upload dengan preview
- Auto-save image ke Supabase Storage
- Responsive form layout
- Loading states
- Error handling

**Upload Gambar:**
- Format: JPG, PNG, JPEG
- Max size: 5MB
- Auto upload ke Supabase Storage bucket `public`
- Auto generate public URL
- Preview sebelum save

---

## 🔐 Security Features

### 1. **Role-Based Access Control (RBAC)**

**Roles:**
- `user` - Regular user (default)
- `admin` - Admin access ke dashboard
- `superadmin` - Reserved for future features

**Protection:**
- Client-side: Check admin status sebelum render
- Server-side: RLS policies di Supabase
- Function `is_admin()` untuk validasi

### 2. **Row Level Security (RLS)**

**Destinations Table Policies:**
```sql
-- Everyone can view
SELECT: authenticated, anon (all users)

-- Only admins can insert/update/delete
INSERT, UPDATE, DELETE: authenticated (with is_admin() = true)
```

### 3. **Route Protection**

Admin routes automatically:
- Check authentication status
- Verify admin role
- Redirect non-admin to home
- Show loading state during verification

---

## 📊 Statistics Dashboard

**Metrics:**
- **Total Destinasi**: Count dari tabel `destinations`
- **Total Review**: Count dari tabel `reviews`
- **Total Booking**: Count dari tabel `bookings`

**Update:** Real-time after add/edit/delete operations

---

## 🎨 UI/UX Design

**Components Used:**
- shadcn/ui components (modern, accessible)
- Tailwind CSS for styling
- Lucide React icons
- Responsive design (mobile-friendly)

**Color Coding:**
- Blue: Primary actions (Add, Edit)
- Red: Destructive actions (Delete)
- Green: Success states
- Gray: Neutral/secondary

---

## 🔧 Technical Stack

**Frontend:**
- React 18.3
- TypeScript
- React Hook Form + Zod validation
- React Router v6

**Backend:**
- Supabase (PostgreSQL)
- Supabase Storage (image hosting)
- Row Level Security (RLS)

**State Management:**
- useState for local state
- useEffect for data fetching
- Custom hooks for admin check

---

## 📝 Usage Examples

### Tambah Destinasi Baru

1. Navigate to `/admin`
2. Click "Tambah Destinasi"
3. Fill form:
   - Nama: "Candi Prambanan"
   - Kota: "Sleman"
   - Provinsi: "DI Yogyakarta"
   - Tipe: "Candi & Warisan Sejarah"
   - Latitude: -7.7522
   - Longitude: 110.4917
   - Jam Buka: 06:00
   - Jam Tutup: 17:00
   - Durasi: 90 (menit)
   - Harga: 50000
   - Transportasi: Bus, Taksi, Rental Mobil
   - Deskripsi: (min 50 karakter)
   - Upload gambar
4. Click "Tambah Destinasi"
5. Auto redirect ke `/admin` dengan toast success

### Edit Destinasi

1. Navigate to `/admin`
2. Click icon "Edit" (pencil) pada row destinasi
3. Form auto-populated dengan data existing
4. Edit field yang diperlukan
5. Click "Update Destinasi"
6. Auto redirect dengan toast success

### Hapus Destinasi

1. Navigate to `/admin`
2. Click icon "Hapus" (trash) pada row destinasi
3. Confirm di dialog
4. Destinasi terhapus dengan cascade delete (reviews, bookings)
5. Table auto-refresh

---

## 🚨 Error Handling

**Client-side:**
- Form validation errors (red text below fields)
- Toast notifications untuk success/error
- Loading states untuk async operations
- Disabled states saat processing

**Server-side:**
- RLS policies mencegah unauthorized access
- Database constraints mencegah invalid data
- Try-catch blocks untuk error handling

---

## 🎯 Best Practices

### Untuk Admin:

1. **Koordinat Akurat**
   - Gunakan Google Maps untuk cari koordinat
   - Klik kanan → "What's here?" → Copy koordinat

2. **Gambar Berkualitas**
   - Resolusi min: 1920x1080px
   - Ratio: 16:9
   - Size max: 5MB
   - Format: JPG (recommended untuk file size)

3. **Deskripsi Lengkap**
   - Minimal 50 karakter
   - Jelaskan sejarah, keunikan, fasilitas
   - Gunakan bahasa Indonesia yang baik

4. **Harga Realistis**
   - Cek harga official dari destinasi
   - Update berkala jika ada perubahan

5. **Transportasi Akurat**
   - List semua opsi yang tersedia
   - Pisahkan dengan koma
   - Contoh: "Bus, Kereta, Taksi, Ojek Online"

6. **Menggunakan Search & Filter**
   - Gunakan search untuk cari destinasi spesifik dengan cepat
   - Kombinasikan filter untuk narrow down results (Province + Type)
   - Gunakan sort untuk prioritas (harga terendah/tertinggi, terbaru/terlama)
   - Reset filters saat ingin kembali ke full view
   - Adjust items per page sesuai kebutuhan (5 untuk mobile, 25-50 untuk desktop)

7. **Managing Large Datasets**
   - Gunakan pagination untuk navigate data besar
   - Set items per page 50-100 untuk bulk review
   - Gunakan sort by "created_at desc" untuk lihat entry terbaru
   - Filter by province saat ingin review destinasi per wilayah
   - Gunakan search untuk instant lookup saat ada report dari user

### Security:

1. **Jangan share kredensial admin**
2. **Regular audit user roles**
3. **Review logs untuk suspicious activity**
4. **Keep Supabase API keys secure**

---

## 🔄 Future Enhancements

**Planned Features:**
- [ ] Bulk upload destinations (CSV/JSON)
- [ ] Image optimization & resize
- [ ] Draft mode (unpublished destinations)
- [ ] Activity logs (audit trail)
- [ ] User management (promote/demote admin)
- [ ] Analytics dashboard
- [ ] Export data (Excel/PDF)
- [ ] Advanced search & filters
- [ ] Column sorting (click table headers)
- [ ] Bulk actions (multi-select for batch edit/delete)
- [ ] Debounced search (optimize typing performance)
- [ ] URL state preservation (save filters in URL params)
- [ ] Saved filter presets
- [ ] Export filtered results
- [ ] Advanced filters (price range, date range, rating)

**Recently Added:**
- ✅ Real-time search (multi-field)
- ✅ Province & Type filters
- ✅ Sort by name/price/date with order toggle
- ✅ Smart pagination with ellipsis
- ✅ Configurable items per page (5-100)
- ✅ Results counter
- ✅ Reset filters button

---

## 🆘 Troubleshooting

### "Akses ditolak" Error
**Solution:** 
1. Check role di Supabase: `SELECT role FROM profiles WHERE id = auth.uid()`
2. Update role jika perlu: `UPDATE profiles SET role = 'admin' WHERE id = '{user_id}'`

### Upload gambar gagal
**Solution:**
1. Check file size < 5MB
2. Check format (JPG, PNG)
3. Verify Supabase Storage bucket `public` exists
4. Check storage policies allow authenticated uploads

### Form validation error tidak hilang
**Solution:**
1. Fix invalid field sesuai error message
2. Refresh page jika stuck
3. Clear form dan isi ulang

### Destinasi tidak muncul di dashboard
**Solution:**
1. Check RLS policies enabled
2. Verify destinasi exists di Supabase
3. Refresh browser
4. Check console untuk errors

### Search tidak menemukan hasil
**Solution:**
1. Coba search term yang lebih spesifik atau lebih general
2. Check filter Province/Type tidak terlalu restrictive
3. Reset filters dengan button "Reset"
4. Verify data destinasi mengandung keyword yang dicari

### Pagination tidak muncul
**Solution:**
1. Pastikan total destinasi > items per page
2. Check filtered results bukan 0
3. Refresh page jika stuck
4. Increase items per page untuk lihat semua data

### Filter tidak bekerja
**Solution:**
1. Check console untuk JavaScript errors
2. Verify filtered data bukan kosong (coba reset filters)
3. Refresh page untuk reset state
4. Check kombinasi filters masuk akal (contoh: jangan filter "Jawa Barat" + "Candi" jika tidak ada)

---

## 📚 Additional Documentation

- **Search, Filter & Pagination**: [ADMIN_SEARCH_FILTER_PAGINATION.md](./ADMIN_SEARCH_FILTER_PAGINATION.md)
- **Setup Guide**: [ADMIN_SETUP_QUICK.md](./ADMIN_SETUP_QUICK.md)
- **Adding Destinations**: [ADD_DESTINATIONS.md](./ADD_DESTINATIONS.md)
- **Database Schema**: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
**Solution:**
1. Check RLS policies: `SELECT * FROM destinations` should work
2. Refresh page (F5)
3. Check browser console untuk errors

---

## 📞 Support

Jika ada masalah atau pertanyaan:
1. Check browser console untuk error logs
2. Check Supabase logs untuk database errors
3. Verify user role di database
4. Contact superadmin

---

## ✅ Checklist Setup

- [ ] Migration `add_admin_role.sql` dijalankan
- [ ] Admin user pertama di-set rolenya
- [ ] Test login sebagai admin
- [ ] Test tambah destinasi baru
- [ ] Test edit destinasi existing
- [ ] Test delete destinasi
- [ ] Test upload gambar
- [ ] Verify RLS policies working
- [ ] Test non-admin user access (should be denied)

---

**Production Ready! ✨**

Admin Dashboard siap digunakan untuk production dengan security dan UX yang solid.
