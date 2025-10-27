# 📱 Phone Number Management Feature

## Overview

Users can now save up to **3 phone numbers** in their profile and easily select them during checkout, eliminating the need to type phone numbers repeatedly.

## Features

### ✅ Profile Management (MyAccount Page)

1. **Add Phone Numbers** - Up to 3 numbers
2. **Set Primary Phone** - Mark one as default for notifications
3. **Remove Phone Numbers** - Delete unused numbers
4. **Format Validation** - Ensures valid Indonesian phone format

### ✅ Checkout Integration

1. **Auto-load from Profile** - Saved numbers appear automatically
2. **Radio Selection** - Easy one-click selection
3. **Custom Input Option** - Can still type new number if needed
4. **Smart Defaults** - Primary phone pre-selected

## Database Schema

### New Columns in `profiles` table:

```sql
-- Array of phone numbers (max 3)
phone_numbers TEXT[] DEFAULT '{}'

-- Primary phone for notifications
primary_phone TEXT
```

### New Functions:

```sql
-- Add phone number (max 3)
add_phone_number(p_user_id UUID, p_phone_number TEXT)

-- Remove phone number
remove_phone_number(p_user_id UUID, p_phone_number TEXT)

-- Set primary phone
set_primary_phone(p_user_id UUID, p_phone_number TEXT)
```

## User Flow

### 1. Adding Phone Numbers

```
My Account → Mobile Number Section
→ Input phone (+628xxx or 08xxx)
→ Click "+ Add"
→ ✅ Saved (max 3)
```

### 2. Setting Primary Phone

```
My Account → Mobile Number list
→ Click "Set Primary" on desired number
→ ✅ Marked with "Recipient for notifications"
```

### 3. Using in Checkout

```
Checkout Page → Phone Number field
→ Auto-shows saved numbers as radio options
→ Select one with a click
→ OR click "Gunakan nomor lain" for custom input
```

## Phone Format Validation

**Accepted formats:**
- ✅ `+628112000143` (international)
- ✅ `08112000143` (local)
- ✅ `628112000143` (without +)

**Requirements:**
- Minimum 10 digits
- Maximum 15 digits
- Only numbers (and optional + prefix)

**Regex:** `^\+?[0-9]{10,15}$`

## Migration

Run this migration to enable phone number features:

```bash
# In Supabase Dashboard → SQL Editor
# Copy and run: supabase/migrations/add_profile_phone_numbers.sql
```

Or via CLI:
```bash
supabase db push
```

## Files Modified

1. ✅ `supabase/migrations/add_profile_phone_numbers.sql` - Database schema
2. ✅ `src/pages/profile/MyAccount.tsx` - Phone management UI
3. ✅ `src/pages/CheckoutPage.tsx` - Phone selection in checkout

## Testing

### Test Adding Phone Numbers

1. Login → Go to Profile → My Account
2. Scroll to "Mobile Number" section
3. Add up to 3 different numbers
4. Try adding a 4th - should show error "Maximum 3 phone numbers allowed"

### Test Setting Primary

1. After adding multiple numbers
2. Click "Set Primary" on non-primary number
3. Check "Recipient for notifications" badge moves

### Test Removing Phone

1. Click "Remove" on any number
2. Confirm it's deleted from list
3. Check if primary_phone updates if removed phone was primary

### Test Checkout Selection

1. Add phone numbers in profile
2. Go to any destination → "Beli Tiket"
3. Fill checkout form
4. Phone field should show radio buttons with saved numbers
5. Select one - should populate in form
6. Click "Gunakan nomor lain" - should show input field
7. Click "Pilih dari nomor tersimpan" - should go back to radio list

## Benefits

✅ **Faster Checkout** - One click vs typing 12+ digits
✅ **No Typos** - Saved numbers are always correct
✅ **Multi-device** - Same numbers on all devices
✅ **Family Support** - Save spouse/parent numbers for bookings
✅ **Privacy** - Numbers stored securely in Supabase

## API Usage

### Frontend Example

```typescript
// Add phone number
const { data } = await supabase.rpc('add_phone_number', {
  p_user_id: user.id,
  p_phone_number: '+628112000143',
});

// Remove phone number
await supabase.rpc('remove_phone_number', {
  p_user_id: user.id,
  p_phone_number: '+628112000143',
});

// Set primary phone
await supabase.rpc('set_primary_phone', {
  p_user_id: user.id,
  p_phone_number: '+628112000143',
});

// Get phone numbers
const { data: profile } = await supabase
  .from('profiles')
  .select('phone_numbers, primary_phone')
  .eq('id', user.id)
  .single();
```

## Troubleshooting

### Issue: Can't add phone number

**Check:**
- Format valid? (+62xxx or 08xxx)
- Not duplicate?
- Less than 3 numbers already?

**Solution:**
```sql
-- Check current numbers
SELECT phone_numbers, primary_phone 
FROM profiles 
WHERE id = '<user-id>';
```

### Issue: Phone doesn't show in checkout

**Check:**
- Profile has phone_numbers saved?
- User is authenticated?

**Solution:**
```sql
-- Manually add a phone for testing
UPDATE profiles 
SET phone_numbers = ARRAY['+628112000143']::TEXT[],
    primary_phone = '+628112000143'
WHERE id = '<user-id>';
```

## Future Enhancements

- 📧 SMS verification for phone numbers
- 🔔 WhatsApp notifications option
- 🌍 International phone support (non-Indonesia)
- 📱 Phone number formatting helper

---

**Created:** October 27, 2025
**For:** TravoMate Phone Number Management
