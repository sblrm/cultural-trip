# Guest Mode Implementation - TravoMate

## 📋 Overview

Guest Mode memungkinkan pengguna untuk menjelajahi aplikasi TravoMate dengan fitur terbatas tanpa perlu mendaftar atau login terlebih dahulu. Ini meningkatkan user experience dengan memberikan akses cepat sambil mendorong konversi ke akun terdaftar.

## ✅ Features Implemented

### Core Functionality

**AuthContext Enhancement**
- ✅ `continueAsGuest()` function - Set user sebagai guest
- ✅ `isGuest` state - Track guest mode status
- ✅ Guest user object dengan flag `isGuest: true`
- ✅ LocalStorage persistence untuk guest session
- ✅ Modified `logout()` untuk handle guest mode

**UI Components**
- ✅ `GuestBanner` - Banner notifikasi di top app
- ✅ `GuestRestrictionModal` - Modal untuk fitur terbatas
- ✅ Guest badge di Header (desktop & mobile)
- ✅ "Browse as Guest" button di Login & Register page

### User Journey

```
┌─────────────────────────────────────────┐
│         User Lands on Site              │
└─────────────────┬───────────────────────┘
                  │
                  ├─ Option 1: Login/Register
                  │  (Full Access)
                  │
                  └─ Option 2: Browse as Guest
                     (Limited Access)
                     │
                     ├─ View: ✅ Destinations
                     ├─ View: ✅ Destination Details
                     ├─ View: ✅ Map
                     │
                     ├─ Blocked: ❌ Route Planning
                     ├─ Blocked: ❌ Ticket Booking
                     ├─ Blocked: ❌ Profile/History
                     ├─ Blocked: ❌ Wishlist
                     └─ Blocked: ❌ Reviews
                     
                     └─ Conversion: Register Modal
```

## 🎯 Guest vs Authenticated Users

### What Guests CAN Do

| Feature | Guest | Registered | Description |
|---------|-------|------------|-------------|
| **Browse Destinations** | ✅ | ✅ | Lihat semua destinasi |
| **View Details** | ✅ | ✅ | Lihat detail lengkap destinasi |
| **View Map** | ✅ | ✅ | Lihat peta destinasi |
| **Change Language** | ✅ | ✅ | Switch bahasa (5 languages) |
| **Dark/Light Mode** | ✅ | ✅ | Toggle tema |
| **Read Reviews** | ✅ | ✅ | Baca ulasan pengguna lain |

### What Guests CANNOT Do (Restricted Features)

| Feature | Guest | Registered | Restriction Message |
|---------|-------|------------|---------------------|
| **Route Planning** | ❌ | ✅ | Modal: "Perencanaan Rute tidak tersedia untuk tamu" |
| **Ticket Booking** | ❌ | ✅ | Modal: "Pemesanan Tiket tidak tersedia untuk tamu" |
| **Profile Access** | ❌ | ✅ | Redirect dengan modal |
| **Booking History** | ❌ | ✅ | Redirect dengan modal |
| **Write Reviews** | ❌ | ✅ | Modal di review form |
| **Save to Wishlist** | ❌ | ✅ | Modal saat click wishlist |
| **Payment** | ❌ | ✅ | Redirect ke register |

## 🔧 Technical Implementation

### 1. AuthContext Updates

```typescript
interface AuthUser {
  id: string;
  name: string;
  email: string;
  isGuest?: boolean;  // NEW: Flag untuk guest user
}

interface AuthContextType {
  // ... existing properties
  continueAsGuest: () => void;  // NEW: Function untuk set guest mode
  isGuest: boolean;  // NEW: State untuk track guest status
}
```

**Guest Session Management**:
- Stored in `localStorage` dengan key `guestMode`
- Persists across page refreshes
- Cleared on logout
- No database interaction

### 2. Component Structure

```
src/
├── components/
│   ├── GuestBanner.tsx              # Top banner untuk guest users
│   ├── GuestRestrictionModal.tsx    # Modal untuk fitur terbatas
│   ├── Layout.tsx                   # Updated dengan GuestBanner
│   └── Header.tsx                   # Updated dengan guest badge
├── contexts/
│   └── AuthContext.tsx              # Enhanced dengan guest mode
└── pages/
    ├── LoginPage.tsx                # Added "Browse as Guest" button
    ├── RegisterPage.tsx             # Added "Browse as Guest" button
    ├── CheckoutPage.tsx             # Blocks guest users
    ├── PlannerPage.tsx              # Blocks guest users
    └── ProfilePage.tsx              # Blocks guest users
```

### 3. Guest Banner Component

**Location**: Top of page (below header)
**Visibility**: Only shown to guest users
**Features**:
- ⚠️ Warning message in amber color
- Link to register page
- Dismissible (session-based)
- Responsive design

```tsx
<GuestBanner />
// Displays: "Anda sedang menjelajah sebagai tamu dengan fitur terbatas. 
//           Daftar sekarang untuk akses penuh"
```

### 4. Guest Restriction Modal

**Trigger**: When guest tries to access restricted feature
**Features**:
- 🛡️ Shield icon dengan amber background
- Feature name display (dynamic)
- Benefits list untuk registered accounts
- Two CTAs: "Daftar Sekarang" (primary) & "Login" (secondary)

**Usage Example**:
```tsx
const [showGuestModal, setShowGuestModal] = useState(false);

// Check guest status
useEffect(() => {
  if (isGuest) {
    setShowGuestModal(true);
  }
}, [isGuest]);

// In component
<GuestRestrictionModal
  isOpen={showGuestModal}
  onClose={() => {
    setShowGuestModal(false);
    navigate(-1); // or navigate("/")
  }}
  feature="Pemesanan Tiket"
/>
```

### 5. Header Badge

**Desktop View**:
```
[👤 Guest User | Guest]  ▼
```

**Mobile View**:
```
┌─────────────────────────┐
│ 👤 Guest User     [Guest]│
└─────────────────────────┘
```

**Implementation**:
- Amber badge next to username
- Shows in both dropdown trigger & mobile menu
- Only profile menu items hidden (not logout)

## 🎨 UI/UX Design Principles

### Color Scheme for Guest Features

**Amber Accent** (Warning/Info):
- Banner: `bg-amber-50 dark:bg-amber-950`
- Border: `border-amber-200 dark:border-amber-800`
- Text: `text-amber-900 dark:text-amber-100`
- Badge: `bg-amber-100 dark:bg-amber-900`

**Why Amber?**
- Not alarming like red (error)
- Not passive like blue (info)
- Attention-grabbing but friendly
- Encourages action (register)

### Conversion Optimization

**Strategic Placement**:
1. **Login/Register Pages** - "Browse as Guest" button (ghost variant)
2. **Top Banner** - Always visible reminder with CTA
3. **Feature Blocks** - Modal with benefits list
4. **Header Badge** - Constant visual reminder

**Messaging Strategy**:
- Positive framing: "fitur terbatas" not "tidak bisa"
- Show benefits, not just restrictions
- Easy conversion path (1-click to register)

## 📱 Responsive Behavior

### Desktop (≥768px)
- Guest banner full width below header
- Badge in header dropdown
- Modal centered (max-width: 448px)

### Mobile (<768px)
- Guest banner responsive padding
- Badge in mobile menu header
- Modal full-screen friendly
- Touch-optimized buttons

## 🌍 Internationalization

### Translation Keys Added

**Indonesian (id.json)**:
```json
{
  "auth.login.browseAsGuest": "Jelajahi sebagai Tamu",
  "auth.register.browseAsGuest": "Jelajahi sebagai Tamu",
  "guest.banner.message": "Anda sedang menjelajah sebagai tamu...",
  "guest.restriction.title": "Fitur Terbatas untuk Tamu",
  "guest.features.booking": "Pemesanan Tiket",
  "guest.features.routePlanning": "Perencanaan Rute",
  // ... more keys
}
```

**English (en.json)**:
```json
{
  "auth.login.browseAsGuest": "Browse as Guest",
  "auth.register.browseAsGuest": "Browse as Guest",
  "guest.banner.message": "You are browsing as a guest...",
  "guest.restriction.title": "Limited Features for Guests",
  "guest.features.booking": "Ticket Booking",
  "guest.features.routePlanning": "Route Planning",
  // ... more keys
}
```

**Supported Languages**:
- 🇮🇩 Indonesian (Primary)
- 🇬🇧 English
- 🇨🇳 Chinese (TODO)
- 🇯🇵 Japanese (TODO)
- 🇰🇷 Korean (TODO)

## 🔒 Security Considerations

### What Guests Cannot Access

**Database Operations**:
- ❌ No writes to `tickets` table
- ❌ No writes to `bookings` table
- ❌ No writes to `reviews` table
- ❌ No profile data queries
- ❌ No payment processing

**Protected Routes** (Backend - Supabase RLS):
- All RLS policies check `auth.uid()`
- Guest has `id: 'guest'` (not real Supabase UID)
- Database operations fail gracefully
- No sensitive data exposed

**Session Management**:
- Guest session stored locally only
- No server-side session
- No authentication tokens
- Can't access user-specific data

### Guest ID Pattern

```typescript
// Guest user object
{
  id: 'guest',              // Special ID (not UUID)
  name: 'Guest User',       // Display name
  email: 'guest@travomate.com',  // Placeholder
  isGuest: true             // Flag for checks
}
```

## 📊 Analytics & Tracking (Future Enhancement)

### Metrics to Track

**Guest Behavior**:
- Number of guest sessions created
- Pages visited by guests
- Features attempted (blocked interactions)
- Time to conversion (guest → registered)

**Conversion Funnel**:
```
Guest Start → Browse Destinations → Attempt Restricted Feature 
→ See Modal → Click Register → Complete Registration
```

**Suggested Events**:
- `guest_mode_started`
- `guest_feature_blocked` (with feature name)
- `guest_conversion_attempted` (clicked register/login)
- `guest_converted` (completed registration)

## 🚀 Future Enhancements

### Planned Features

1. **Guest Trip Preview**
   - Allow 1 route plan (no save)
   - Show "Register to Save" button
   - Store in sessionStorage

2. **Limited Reviews**
   - Guests can read unlimited reviews
   - See "Login to review" on write button
   - Show review count to encourage engagement

3. **Wishlist Teaser**
   - Allow "adding" to local wishlist
   - Show "Register to sync" message
   - Migrate to DB on registration

4. **Social Proof**
   - Show number of registered users
   - Display recent bookings (anonymous)
   - "Join X travelers" messaging

5. **Timed Guest Mode**
   - Set 30-minute timer
   - "Your guest session expires in X minutes"
   - Urgency for conversion

## 🧪 Testing Checklist

### Functional Testing

- [ ] Guest mode activates from Login page
- [ ] Guest mode activates from Register page
- [ ] Guest banner displays correctly
- [ ] Guest badge shows in header (desktop)
- [ ] Guest badge shows in mobile menu
- [ ] Restricted features show modal
- [ ] Modal has working Register/Login links
- [ ] Logout clears guest session
- [ ] localStorage persists across refresh
- [ ] All restricted pages redirect properly

### UI/UX Testing

- [ ] Banner is dismissible
- [ ] Modal is responsive on mobile
- [ ] Buttons have proper hover states
- [ ] Translations work (ID & EN)
- [ ] Dark mode colors correct
- [ ] Animations smooth
- [ ] No layout shifts

### Security Testing

- [ ] Guest cannot access database writes
- [ ] Guest cannot access payment flow
- [ ] Guest cannot access profile data
- [ ] Guest session has no real auth token
- [ ] RLS policies block guest operations

## 📝 Code Examples

### Check if User is Guest

```typescript
import { useAuth } from "@/contexts/AuthContext";

const MyComponent = () => {
  const { isGuest } = useAuth();
  
  if (isGuest) {
    // Show restriction or alternative UI
    return <GuestRestrictionModal />;
  }
  
  // Regular authenticated user flow
  return <FullFeatureComponent />;
};
```

### Block Feature for Guests

```typescript
const handleFeatureAccess = () => {
  if (isGuest) {
    setShowGuestModal(true);
    return;
  }
  
  // Proceed with feature
  proceedWithFeature();
};
```

### Conditional Rendering

```tsx
{isGuest ? (
  <Button onClick={() => setShowGuestModal(true)}>
    🔒 Feature Locked
  </Button>
) : (
  <Button onClick={handleFeature}>
    Access Feature
  </Button>
)}
```

## 🎯 Success Metrics

### Key Performance Indicators

**Adoption**:
- % of new visitors using guest mode
- Average time in guest mode before conversion

**Conversion**:
- Guest-to-registered conversion rate
- Features triggering most conversions
- Time from guest start to registration

**Engagement**:
- Pages visited per guest session
- Features explored before restriction
- Return rate of converted guests

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: Guest banner doesn't show
- **Fix**: Check `isGuest` state in AuthContext
- **Debug**: Console log `isGuest` value

**Issue**: Guest can access restricted features
- **Fix**: Add `isGuest` check in component
- **Pattern**: Check early in function/useEffect

**Issue**: Guest session doesn't persist
- **Fix**: Verify localStorage is enabled
- **Debug**: Check `localStorage.getItem('guestMode')`

**Issue**: Logout doesn't clear guest mode
- **Fix**: Ensure `localStorage.removeItem('guestMode')` called
- **Location**: AuthContext `logout()` function

---

## 📚 Related Documentation

- [Authentication System](./OAUTH_SETUP_GUIDE.md)
- [Route Planning](./ALGORITHMS.md)
- [Payment Integration](./MIDTRANS_INTEGRATION.md)

---

**Status**: ✅ Fully Implemented  
**Version**: 1.0  
**Date**: October 31, 2025  
**Last Updated**: October 31, 2025
