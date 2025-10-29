# 🚨 Storage Upload Errors - Complete Troubleshooting Guide

## Error: "No API key found in request"

### 🎯 Root Cause Analysis

**Error Message:**
```json
{
  "message": "No API key found in request",
  "hint": "No `apikey` request header or url param was found."
}
```

**What This Means:**
- Supabase Storage request tidak include authentication header
- Bisa terjadi karena:
  1. User tidak authenticated (session expired)
  2. RLS policies terlalu strict
  3. Storage policies tidak configured dengan benar

---

## ✅ Solution Steps (10 Menit)

### Step 1: Verify User is Logged In (1 menit)

1. Check browser console, pastikan tidak ada auth errors
2. Verify: User dropdown (top right) shows username
3. Try **logout dan login kembali**
4. Try upload lagi after fresh login

**Why:** Session bisa expired, re-login akan refresh auth token.

---

### Step 2: Create Storage Bucket (2 menit)

**Buka Supabase Dashboard → Storage:**

1. Click **"New bucket"**
2. Name: `destination-images`
3. **✅ CENTANG "Public bucket"**
4. Click **"Create bucket"**

---

### Step 3: Run Storage Policies SQL (3 menit) ⚠️ CRITICAL!

**This is the most important step!**

1. Navigate ke **SQL Editor** di Supabase Dashboard
2. Click **"New query"**
3. Copy-paste isi file lengkap: **`supabase/migrations/add_storage_policies.sql`**
4. Click **"Run"** ✅

**What this does:**
- Drops any existing conflicting policies
- Creates 4 new policies:
  - ✅ Public READ access (anyone can view images)
  - ✅ Authenticated UPLOAD access (logged in users can upload)
  - ✅ Authenticated UPDATE access
  - ✅ Authenticated DELETE access

---

### Step 4: Verify Policies Created (2 menit)

Run this SQL query:

```sql
-- Should return 4 policies
SELECT 
  policyname,
  cmd,
  roles::text,
  qual::text as using_check,
  with_check::text
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%destination%'
ORDER BY cmd;
```

**Expected Output:**

| policyname | cmd | roles | using_check | with_check |
|------------|-----|-------|-------------|------------|
| Authenticated users can delete destination images | DELETE | {public} | Contains `auth.role()` | - |
| Authenticated users can upload destination images | INSERT | {public} | - | Contains `auth.role()` |
| Public can view destination images | SELECT | {public} | Contains `bucket_id` | - |
| Authenticated users can update destination images | UPDATE | {public} | Contains `auth.role()` | Contains `auth.role()` |

**If not 4 rows:** Policies tidak terbuat! Ulangi Step 3.

---

### Step 5: Verify Auth Session (1 menit)

Open browser console, run:

```javascript
// Check if user authenticated
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('User:', session?.user?.email);
```

**Expected:**
- `session` is not null
- `session.user.email` shows your admin email
- `session.access_token` exists

**If null:** User not authenticated! Logout and login again.

---

### Step 6: Test Upload (1 menit)

1. Navigate ke `/admin/destinations/new`
2. Fill minimal form fields (name, city, province, type, coordinates, hours, duration, description, price, transportation)
3. Choose image file (JPG/PNG, < 5MB)
4. Click upload button
5. Wait for preview to appear
6. Submit form

**Expected:**
- ✅ Upload successful
- ✅ Image preview shows
- ✅ Form submits without error
- ✅ New destination appears in table with image

---

## 🔍 Deep Dive: Why This Error Happens

### Authentication Flow

```
User Login
    ↓
Supabase creates session
    ↓
Session stored in localStorage
    ↓
All requests include: Authorization: Bearer {access_token}
    ↓
Storage checks RLS policies
    ↓
If policy allows → Upload succeeds ✅
If policy denies → "No API key" error ❌
```

### Common Misconception

**What people think:**
> "Public bucket" = Anyone can upload ❌

**Reality:**
> - "Public bucket" = Anyone can READ/VIEW ✅
> - Upload requires explicit INSERT policy with auth check ⚠️
> - Without proper policy → "No API key" error

---

## 🛠️ Advanced Troubleshooting

### Check 1: Verify Supabase Client Configuration

File: `src/lib/supabase.ts`

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**Verify:**
- `.env` file exists with correct values
- `VITE_SUPABASE_URL` format: `https://xxxxx.supabase.co`
- `VITE_SUPABASE_ANON_KEY` is anon key (NOT service role key!)

### Check 2: Network Request Headers

Open DevTools → Network tab → Try upload → Check request:

**Expected Headers:**
```
Authorization: Bearer eyJhbG...
apikey: eyJhbG...
Content-Type: image/jpeg
```

**If missing Authorization/apikey:**
- User not authenticated
- Session expired
- Auth context not working

### Check 3: Storage Bucket Configuration

Navigate to: Storage → `destination-images` → Configuration

**Verify:**
- Public: ✅ Yes
- File size limit: 5MB (optional)
- Allowed MIME types: `image/*` (optional)

### Check 4: RLS Policies on storage.objects

Run SQL:

```sql
-- Check all storage policies
SELECT * FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects';
```

**Look for:**
- Policies for bucket `destination-images`
- INSERT policy with `auth.role() = 'authenticated'` check
- No conflicting DENY policies

---

## 🔄 If Still Not Working

### Nuclear Option: Reset Everything

```sql
-- 1. Drop all destination-images policies
DROP POLICY IF EXISTS "Public can view destination images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload destination images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update destination images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete destination images" ON storage.objects;

-- 2. Recreate policies (run full migration)
-- Copy-paste entire: supabase/migrations/add_storage_policies.sql
```

### Verify Session Not Expired

```javascript
// In browser console
const { data: { session }, error } = await supabase.auth.getSession();
if (error) console.error('Auth error:', error);
if (!session) console.error('No session! Please login.');
console.log('Session expires at:', new Date(session.expires_at * 1000));
```

### Force Session Refresh

```javascript
// In browser console
const { data, error } = await supabase.auth.refreshSession();
console.log('Session refreshed:', data);
```

### Clear Browser Storage and Re-login

1. Open DevTools → Application → Storage
2. Clear:
   - Local Storage (all supabase keys)
   - Session Storage
   - Cookies
3. Close browser completely
4. Reopen, navigate to app
5. Login fresh
6. Try upload

---

## 📋 Complete Checklist

Before asking for help, verify ALL of these:

- [ ] Bucket `destination-images` exists
- [ ] Bucket is Public (not Private)
- [ ] Migration `add_storage_policies.sql` has been run
- [ ] 4 policies exist (verified via SQL query)
- [ ] User is logged in (check console)
- [ ] Session is valid (not expired)
- [ ] `.env` file has correct Supabase keys
- [ ] No CORS errors in console
- [ ] No other JavaScript errors in console
- [ ] Network tab shows Authorization header in requests
- [ ] Tried logout + login again
- [ ] Tried clearing browser storage
- [ ] Tried different browser (to rule out cache)

---

## 🎓 Understanding Storage Security

### Three Layers of Security

1. **Bucket Level**
   - Public vs Private
   - File size limits
   - MIME type restrictions

2. **RLS Policies**
   - Who can SELECT (read)?
   - Who can INSERT (upload)?
   - Who can UPDATE/DELETE?

3. **Authentication**
   - Is user logged in?
   - Is session valid?
   - Does token have permissions?

**All three must align for upload to work!**

---

## 💡 Pro Tips

### For Development

Use more permissive policies for easier testing:

```sql
-- Allow any authenticated user to upload (current approach)
CREATE POLICY "Authenticated users can upload destination images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'destination-images'
  AND auth.role() = 'authenticated'
);
```

### For Production

Restrict to admin only:

```sql
-- Only admins can upload
CREATE POLICY "Only admins can upload destination images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'destination-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);
```

---

## 📚 Related Documentation

- **Storage Setup**: `docs/SUPABASE_STORAGE_SETUP.md`
- **Admin Setup**: `docs/ADMIN_SETUP_QUICK.md`
- **Migration File**: `supabase/migrations/add_storage_policies.sql`
- **Supabase Docs**: https://supabase.com/docs/guides/storage

---

## 🆘 Still Having Issues?

**Check:**
1. Supabase project status (not paused/billing issue)
2. API rate limits (storage has limits)
3. File size (must be < 5MB)
4. File format (must be image/jpeg or image/png)
5. Network connectivity

**Debug Steps:**
1. Check browser console for errors
2. Check Network tab for failed requests
3. Check Supabase Dashboard → Logs for server errors
4. Try with curl/Postman to isolate frontend vs backend issue

---

**Last Updated:** 2025-10-29  
**Status:** Complete troubleshooting guide for "No API key found" error ✅
