# Supabase Storage Setup Guide

## Overview

TravoMate menggunakan Supabase Storage untuk menyimpan foto-foto yang diupload oleh user (review/experience photos).

## Error yang Muncul Jika Belum Setup

```
Failed to load resource: status 406
StorageApiError: Bucket not found
```

## Langkah Setup

### 1. Via Supabase Dashboard (Recommended)

**A. Create Bucket:**
1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project TravoMate
3. Klik **Storage** di sidebar kiri
4. Klik tombol **"New bucket"**
5. Isi form:
   - **Name**: `culture-uploads`
   - **Public bucket**: ✅ **ON** (centang)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/*` (opsional)
6. Klik **"Create bucket"**

**B. Setup Policies:**
1. Klik bucket `culture-uploads` yang baru dibuat
2. Klik tab **"Policies"**
3. Klik **"New policy"** dan pilih **"Custom policy"**
4. Buat 4 policies berikut:

**Policy 1: Upload Photos**
```sql
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'culture-uploads' AND
  (storage.foldername(name))[1] = 'user-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

**Policy 2: Update Photos**
```sql
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'culture-uploads' AND
  (storage.foldername(name))[1] = 'user-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

**Policy 3: Delete Photos**
```sql
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'culture-uploads' AND
  (storage.foldername(name))[1] = 'user-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

**Policy 4: Public Read**
```sql
CREATE POLICY "Public read access to culture photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'culture-uploads');
```

### 2. Via SQL Editor (Automated)

1. Buka **SQL Editor** di Supabase Dashboard
2. Copy-paste isi file `supabase/storage-setup.sql`
3. Klik **"Run"**
4. Verify dengan query:
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'culture-uploads';
   ```

## Storage Structure

```
culture-uploads/
├── user-photos/
│   ├── {destination_id}/
│   │   ├── {user_id}_{timestamp}.jpg
│   │   ├── {user_id}_{timestamp}.png
│   │   └── ...
│   └── ...
└── ...
```

**Example Path:**
```
culture-uploads/user-photos/123/abc123-def456_1698765432000.jpg
                            ↑   ↑        ↑
                            │   │        └─ Timestamp
                            │   └─ User ID
                            └─ Destination ID
```

## Security Rules

### What Users CAN Do:
- ✅ Upload photos to their own folder (`user-photos/{destination_id}/{user_id}_*`)
- ✅ Update their own photos
- ✅ Delete their own photos
- ✅ View all public photos (anyone, even unauthenticated)

### What Users CANNOT Do:
- ❌ Upload to other users' folders
- ❌ Update/delete other users' photos
- ❌ Upload outside `user-photos/` directory

## Testing Upload Feature

1. Login ke aplikasi
2. Buka halaman detail destinasi
3. Klik tombol **"Saya Pernah Ke Sini"**
4. Upload foto (max 5MB, format: JPG/PNG)
5. Berikan rating dan caption
6. Klik **"Bagikan Foto"**

**Expected Result:**
- ✅ Foto terupload ke Supabase Storage
- ✅ Review tersimpan di database `reviews` table
- ✅ Public URL foto tersimpan di kolom `photos`

## Troubleshooting

### Error: "Bucket not found"
**Solution:** Jalankan `storage-setup.sql` atau create bucket manual via dashboard

### Error: "Access denied" / 403
**Solution:** Check RLS policies, pastikan user authenticated dan upload ke folder sendiri

### Error: "File too large"
**Solution:** Resize foto atau compress sebelum upload (max 5MB per file)

### Error: "Invalid file type"
**Solution:** Hanya accept image files (jpg, png, jpeg, gif, webp)

## Environment Variables

Tidak perlu environment variable tambahan. Storage menggunakan Supabase client yang sama dengan database.

```typescript
// Already configured in src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Storage usage:
await supabase.storage
  .from('culture-uploads')
  .upload(filePath, file);
```

## Migration Checklist

- [ ] Run `storage-setup.sql` di Supabase SQL Editor
- [ ] Verify bucket created: `SELECT * FROM storage.buckets WHERE id = 'culture-uploads'`
- [ ] Check policies di Storage → culture-uploads → Policies
- [ ] Test upload foto sebagai authenticated user
- [ ] Test public access (view foto tanpa login)
- [ ] Monitor storage usage di Supabase Dashboard

## Storage Limits

**Free Tier:**
- 1GB total storage
- 2GB bandwidth per month
- Unlimited requests

**Recommended Actions:**
- Setup image optimization (compress before upload)
- Implement image CDN untuk faster loading
- Monitor usage di Supabase Dashboard → Settings → Usage

## Related Files

- `supabase/storage-setup.sql` - SQL script untuk setup
- `src/components/social/BeenHerePhoto.tsx` - Upload component
- `src/services/reviews.ts` - Review service dengan foto support

---

**Last Updated:** October 31, 2025
