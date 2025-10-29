# 🗄️ Supabase Storage Setup - Destination Images

## 📋 Overview

Admin Dashboard membutuhkan Storage Bucket untuk menyimpan gambar destinasi yang di-upload. Setup ini hanya perlu dilakukan **satu kali**.

---

## 🚀 Quick Setup (5 menit)

### Step 1: Buka Supabase Dashboard

1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project TravoMate
3. Navigate ke **Storage** di sidebar kiri

### Step 2: Create New Bucket

1. Click button **"New bucket"** atau **"Create a new bucket"**
2. Isi form dengan:
   - **Name**: `destination-images`
   - **Public bucket**: ✅ **CENTANG** (penting!)
   - **File size limit**: `5242880` (5MB in bytes) - optional
   - **Allowed MIME types**: `image/jpeg,image/png,image/jpg,image/webp` - optional
3. Click **"Create bucket"**

### Step 3: Set Policies (Otomatis untuk Public Bucket)

Jika bucket sudah public, policies otomatis terbuat. Tapi untuk memastikan, verify policies:

**Expected Policies:**
- ✅ **SELECT (read)**: `true` for everyone
- ✅ **INSERT (upload)**: `authenticated` users only
- ✅ **UPDATE**: `authenticated` users only
- ✅ **DELETE**: `authenticated` users only

---

## 🔐 Manual Policy Setup (Jika Diperlukan)

Jika policies tidak otomatis terbuat, buat manual:

### 1. Allow Public Read Access

```sql
-- Policy: "Public can view images"
CREATE POLICY "Public can view destination images"
ON storage.objects FOR SELECT
USING (bucket_id = 'destination-images');
```

### 2. Allow Authenticated Upload

```sql
-- Policy: "Authenticated users can upload"
CREATE POLICY "Authenticated users can upload destination images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'destination-images' 
  AND auth.role() = 'authenticated'
);
```

### 3. Allow Authenticated Update/Delete

```sql
-- Policy: "Authenticated users can update their uploads"
CREATE POLICY "Authenticated users can update destination images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'destination-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: "Authenticated users can delete their uploads"
CREATE POLICY "Authenticated users can delete destination images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'destination-images' 
  AND auth.role() = 'authenticated'
);
```

---

## 🎯 Admin-Only Upload (Stricter Security - Optional)

Jika ingin hanya admin yang bisa upload, gunakan policy ini:

```sql
-- Drop existing insert policy first
DROP POLICY IF EXISTS "Authenticated users can upload destination images" ON storage.objects;

-- Create admin-only upload policy
CREATE POLICY "Only admins can upload destination images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'destination-images' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);
```

**Note:** Pastikan tabel `profiles` sudah punya kolom `role` (dari migration `add_admin_role.sql`).

---

## 🧪 Test Upload

### Via Admin Dashboard UI

1. Login sebagai admin
2. Navigate ke `/admin/destinations/new`
3. Upload gambar test (max 5MB, format JPG/PNG)
4. Submit form
5. Check di Supabase Dashboard → Storage → `destination-images`
6. File harus muncul dengan nama random (contoh: `abc123-1234567890.jpg`)

### Via Browser Console (Quick Test)

```javascript
// Open browser console di admin page
const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

// Import service
import { uploadDestinationImage } from '@/services/adminService';

// Try upload
uploadDestinationImage(testFile)
  .then(url => console.log('✅ Upload success:', url))
  .catch(err => console.error('❌ Upload failed:', err));
```

---

## 🗂️ Bucket Configuration

### Recommended Settings

| Setting | Value | Keterangan |
|---------|-------|------------|
| **Bucket Name** | `destination-images` | Nama bucket untuk gambar destinasi |
| **Public Bucket** | ✅ Yes | Agar gambar bisa diakses public |
| **File Size Limit** | 5MB (5242880 bytes) | Cegah upload file terlalu besar |
| **Allowed MIME Types** | `image/jpeg`, `image/png`, `image/jpg`, `image/webp` | Hanya gambar |
| **Cache Control** | 3600 seconds (1 hour) | CDN caching |

### File Naming Convention

Upload menggunakan format:
```
{random_id}-{timestamp}.{extension}

Contoh:
abc123def456-1730188930123.jpg
xyz789uvw012-1730188945678.png
```

**Why random naming?**
- ✅ Prevent filename conflicts
- ✅ Prevent overwrite existing images
- ✅ Security (no predictable paths)
- ✅ Unique identifier

---

## 📁 Folder Structure

```
destination-images/ (bucket)
├── abc123def456-1730188930123.jpg
├── xyz789uvw012-1730188945678.png
├── qrs345mno678-1730189001234.jpg
└── ... (all uploaded images directly in root)
```

**No subfolders** - semua file langsung di root bucket untuk simplicity.

---

## 🔍 Verify Setup

### Checklist

- [ ] Bucket `destination-images` created
- [ ] Bucket set as **Public**
- [ ] Policies allow:
  - [ ] Public read (SELECT)
  - [ ] Authenticated upload (INSERT)
  - [ ] Authenticated update/delete
- [ ] File size limit set (optional)
- [ ] MIME types restricted (optional)
- [ ] Test upload berhasil
- [ ] Image URL accessible dari browser

### SQL Query to Check Policies

```sql
-- Check existing policies for storage bucket
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%destination%';
```

---

## 🚨 Troubleshooting

### Error: "Bucket not found"

**Solution:**
1. Pastikan bucket name **exactly** `destination-images`
2. Check typo atau case sensitivity
3. Refresh Supabase Dashboard page

### Error: "Permission denied"

**Solution:**
1. Pastikan user sudah login (authenticated)
2. Check policies dengan query SQL di atas
3. Verify user role = 'admin' di tabel `profiles`

### Error: "File too large"

**Solution:**
1. Resize gambar sebelum upload (recommended: 1920x1080px)
2. Compress dengan tools seperti TinyPNG
3. Atau increase file size limit di bucket settings

### Error: "Invalid file type"

**Solution:**
1. Pastikan file format JPG, PNG, atau WebP
2. Check MIME type di bucket configuration
3. Rename file extension jika perlu

### Image uploaded tapi tidak muncul

**Solution:**
1. Check bucket is **Public** (bukan private)
2. Verify public URL format: `https://{project-ref}.supabase.co/storage/v1/object/public/destination-images/{filename}`
3. Try akses URL langsung di browser baru (incognito)
4. Check RLS policies allow SELECT for public

---

## 🔄 Migration from Old Setup

Jika sebelumnya menggunakan bucket `public` atau folder `culture-uploads/`:

### Option 1: Move Files

```sql
-- List all files in old location
SELECT * FROM storage.objects 
WHERE bucket_id = 'public' 
  AND name LIKE 'culture-uploads/%';

-- Manual: Download & re-upload via admin dashboard
```

### Option 2: Update Image Paths in Database

```sql
-- Update old paths to new bucket
UPDATE destinations
SET image = REPLACE(
  image,
  'culture-uploads/',
  'destination-images/'
)
WHERE image LIKE '%culture-uploads%';
```

### Option 3: Keep Both (Recommended)

- Old images tetap di `public/culture-uploads/`
- New uploads masuk ke `destination-images/`
- No breaking changes untuk existing data

---

## 📊 Storage Monitoring

### Check Storage Usage

```sql
-- Get total storage used
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_bytes,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_mb
FROM storage.objects
WHERE bucket_id = 'destination-images'
GROUP BY bucket_id;
```

### List Recent Uploads

```sql
-- Get last 10 uploads
SELECT 
  name,
  created_at,
  metadata->>'size' as size_bytes,
  metadata->>'mimetype' as mime_type
FROM storage.objects
WHERE bucket_id = 'destination-images'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 Best Practices

1. **Image Optimization**
   - Resize to 1920x1080px before upload
   - Use JPG for photos (smaller file size)
   - Use PNG for graphics with transparency
   - Compress with tools like TinyPNG

2. **Security**
   - Only allow authenticated users to upload
   - Consider admin-only upload policy
   - Set file size limits
   - Restrict MIME types

3. **Performance**
   - Enable CDN caching (already set: 3600s)
   - Use WebP format for better compression
   - Serve responsive images on frontend

4. **Maintenance**
   - Regular backup important images
   - Clean up unused images periodically
   - Monitor storage quota

---

## 📚 Additional Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Storage Policies Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [Image Optimization Tips](https://web.dev/fast/#optimize-your-images)

---

## ✅ Setup Complete Checklist

After setup, verify:

- [x] Bucket `destination-images` created
- [x] Bucket is Public
- [x] Policies configured
- [x] Test upload successful
- [x] Image URL works in browser
- [x] Admin dashboard upload form works
- [x] File size/type restrictions working

**Setup Time:** ~5 minutes  
**Difficulty:** ⭐ Easy

---

**Status**: Ready for production! 🚀
