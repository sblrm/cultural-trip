# OAuth Login Setup Guide - Google Only

## ✅ Implementation Complete

Social login dengan Google sudah diimplementasikan dan production-ready!

## 🎯 Features Implemented

### LoginPage & RegisterPage
- ✅ Google OAuth login button
- ✅ Beautiful UI with brand colors
- ✅ Multilingual support (5 languages)
- ✅ Automatic redirect after login
- ✅ Error handling

### AuthContext
- ✅ `loginWithGoogle()` function
- ✅ Automatic session management
- ✅ User profile data from OAuth provider

## 📋 Production Setup Required

### Step 1: Setup Google OAuth

#### 1.1 Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Login dengan Google account

2. **Create or Select Project**
   - Click "Select a project" → "New Project"
   - Name: "TravoMate" atau sesuai keinginan
   - Click "Create"

3. **Enable Google+ API**
   - Go to: "APIs & Services" → "Library"
   - Search: "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to: "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "TravoMate Web Client"

5. **Configure OAuth Consent Screen**
   - User Type: "External"
   - App name: "TravoMate"
   - User support email: your-email@example.com
   - Developer contact: your-email@example.com
   - Click "Save and Continue"

6. **Add Authorized Redirect URIs**
   ```
   Development:
   http://localhost:5173/
   
   Production:
   https://your-domain.com/
   https://your-domain.vercel.app/
   ```

7. **Get Credentials**
   - Copy **Client ID**
   - Copy **Client Secret** (not needed for Supabase, but save it)

#### 1.2 Configure in Supabase

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: "travo_mate"

2. **Navigate to Authentication Settings**
   - Click "Authentication" in sidebar
   - Click "Providers"
   - Find "Google"

3. **Enable Google Provider**
   - Toggle "Enable Sign in with Google" to ON
   - Paste your **Client ID** from Google Console
   - Paste your **Client Secret** from Google Console
   - Click "Save"

4. **Copy Redirect URL from Supabase**
   - Supabase will show a redirect URL like:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   - Copy this URL

5. **Add to Google Console**
   - Go back to Google Cloud Console
   - Add the Supabase redirect URL to "Authorized redirect URIs"
   - Click "Save"

---

### Step 2: Update Site URL in Supabase

---

### Step 2: Update Site URL in Supabase

1. **Go to Supabase Dashboard**
   - Authentication → URL Configuration

2. **Set Site URL**
   ```
   Development: http://localhost:5173
   Production: https://your-domain.com
   ```

3. **Add Redirect URLs**
   ```
   http://localhost:5173/**
   https://your-domain.com/**
   https://your-domain.vercel.app/**
   ```

4. **Click "Save"**

---

## 🧪 Testing OAuth Login

### Development Testing

1. **Start Development Server**
   ```bash
   bun run dev
   ```

2. **Navigate to Login Page**
   ```
   http://localhost:5173/login
   ```

3. **Test Google Login**
   - Click "Google" button
   - Should redirect to Google consent screen
   - Grant permissions
   - Should redirect back and login successfully

### Production Testing

After deployment to Vercel:

1. **Visit Production URL**
   ```
   https://your-domain.vercel.app/login
   ```

2. **Test Google OAuth**
   - Verify redirects work correctly
   - Verify login creates user in Supabase
   - Verify profile data syncs

---

## 🔧 Troubleshooting

### Google OAuth Issues

**Problem**: "redirect_uri_mismatch" error
- **Solution**: Make sure redirect URI in Google Console exactly matches Supabase callback URL

**Problem**: "Access blocked: This app's request is invalid"
- **Solution**: Complete OAuth consent screen configuration in Google Console

**Problem**: User can't login
- **Solution**: Check if Google+ API is enabled

### General Issues

**Problem**: OAuth popup closes but no login
- **Solution**: Check browser console for errors, verify Supabase project settings

**Problem**: User created but no profile data
- **Solution**: Check `handle_new_user_profile` trigger in Supabase

---

## 📊 User Experience Flow

### Google OAuth Flow
```
1. User clicks "Google" button
   ↓
2. Redirects to Google consent screen
   ↓
3. User grants permissions (email, profile)
   ↓
4. Google redirects to Supabase callback
   ↓
5. Supabase creates/updates user
   ↓
6. Redirects to app homepage
   ↓
7. User is logged in automatically
```

---

## 🎨 UI Components

### OAuth Button

**Design Features**:
- ✅ Brand-colored SVG icon (authentic Google colors)
- ✅ Consistent sizing and spacing
- ✅ Hover effects
- ✅ Full-width button layout
- ✅ Matches app theme (light/dark mode support)

**Divider**:
- ✅ "Or continue with" text
- ✅ Clean horizontal line separator
- ✅ Adaptive to theme

---

## 🔐 Security Features

### Built-in by Supabase
- ✅ PKCE (Proof Key for Code Exchange) for OAuth
- ✅ Secure token storage in httpOnly cookies
- ✅ Automatic session refresh
- ✅ CSRF protection
- ✅ Rate limiting on auth endpoints

### Application Level
- ✅ Automatic redirect to prevent unauthorized access
- ✅ Session validation on protected routes
- ✅ Secure user data handling

---

## 📱 Mobile Support

OAuth login works seamlessly on mobile devices:
- ✅ Responsive button layout
- ✅ Mobile browser OAuth flow
- ✅ Deep linking support (for mobile apps)

---

## 🌍 Multilingual Support

OAuth buttons and labels support 5 languages:
- 🇮🇩 Indonesian: "Atau lanjutkan dengan"
- 🇬🇧 English: "Or continue with"
- 🇨🇳 Chinese: "或继续使用"
- 🇯🇵 Japanese: "または続ける"
- 🇰🇷 Korean: "또는 계속하기"

---

## 📝 Files Modified

### Core Implementation
1. ✅ `src/contexts/AuthContext.tsx` - OAuth functions
2. ✅ `src/pages/LoginPage.tsx` - OAuth buttons UI
3. ✅ `src/pages/RegisterPage.tsx` - OAuth buttons UI

### Translations
4. ✅ `src/locales/id.json` - Indonesian
5. ✅ `src/locales/en.json` - English
6. ✅ `src/locales/zh.json` - Chinese
7. ✅ `src/locales/ja.json` - Japanese
8. ✅ `src/locales/ko.json` - Korean

---

## ✅ Production Readiness Checklist

Before going live, ensure:

### Google OAuth
- [ ] Google OAuth credentials configured in Google Console
- [ ] Google OAuth enabled in Supabase with correct Client ID/Secret
- [ ] Supabase redirect URL added to Google Console
- [ ] OAuth tested in development environment
- [ ] OAuth tested in production environment after deployment

### General
- [ ] Supabase Site URL set to production domain
- [ ] All redirect URLs whitelisted in Supabase
- [ ] User profile creation trigger working (`handle_new_user_profile`)
- [ ] Email notifications configured (optional)
- [ ] Error handling tested

---

## 🚀 Quick Start Commands

```bash
# Install dependencies (if not already)
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Deploy to Vercel
vercel --prod
```

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Supabase OAuth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

**Status**: ✅ Implementation Complete - Ready for Production Setup  
**Date**: October 31, 2025  
**Version**: 1.0 (Google OAuth Only)
