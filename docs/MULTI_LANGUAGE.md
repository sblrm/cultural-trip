# Multi-Language Implementation Guide

## Overview
TravoMate now supports **5 languages** for complete internationalization:
- 🇮🇩 **Indonesian (Bahasa Indonesia)** - Default language
- 🇬🇧 **English** - International users
- 🇨🇳 **Simplified Chinese (简体中文)** - Chinese tourists
- 🇯🇵 **Japanese (日本語)** - Japanese tourists
- 🇰🇷 **Korean (한국어)** - Korean tourists

## Architecture

### Core Libraries
- **i18next** (v25.6.0) - Internationalization framework
- **react-i18next** (v16.2.2) - React bindings with hooks
- **i18next-browser-languagedetector** (v8.2.0) - Automatic language detection

### File Structure
```
src/
├── i18n/
│   └── config.ts              # i18next configuration
├── locales/
│   ├── id.json                # Indonesian translations
│   ├── en.json                # English translations
│   ├── zh.json                # Simplified Chinese translations
│   ├── ja.json                # Japanese translations
│   └── ko.json                # Korean translations
└── components/
    └── LanguageSwitcher.tsx   # Language selector UI component
```

## Configuration

### i18n Config (`src/i18n/config.ts`)
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { /* translation files */ },
    fallbackLng: 'id',           // Default to Indonesian
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });
```

### Language Detection Flow
1. **LocalStorage** - Checks `i18nextLng` key for saved preference
2. **Browser Navigator** - Falls back to browser's language setting
3. **Default Fallback** - Uses Indonesian if no detection succeeds

## Translation Structure

### JSON Schema
All translation files follow this structure:

```json
{
  "common": {
    "appName": "TravoMate",
    "tagline": "...",
    "loading": "...",
    "error": "...",
    "success": "..."
  },
  "nav": {
    "home": "...",
    "destinations": "...",
    "planner": "...",
    "login": "...",
    "register": "..."
  },
  "home": {
    "hero": { "title": "...", "subtitle": "...", "cta": "..." },
    "features": { /* ... */ },
    "destinations": { /* ... */ }
  },
  "destinations": { /* listing, filters, sorting */ },
  "destinationDetail": { /* about, hours, pricing */ },
  "planner": { /* route planning, transport modes */ },
  "auth": { "login": { /* ... */ }, "register": { /* ... */ } },
  "profile": { /* account, bookings, settings */ },
  "booking": { /* ticket booking flow */ },
  "wishlist": { /* wishlist management */ },
  "footer": { /* footer content */ },
  "language": { /* language selector labels */ }
}
```

### Translation Coverage
Each language file contains **200+ translation keys** covering:
- ✅ Navigation menu (7 items)
- ✅ Homepage sections (hero, features, destinations)
- ✅ Destination listing & details
- ✅ Route planner interface (20+ keys)
- ✅ Authentication forms (login/register)
- ✅ User profile & settings
- ✅ Booking flow
- ✅ Wishlist management
- ✅ Footer content
- ✅ Language selector labels

## Usage in Components

### Basic Usage with Hooks
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('home.hero.title')}</h1>
      <p>{t('home.hero.subtitle')}</p>
      <button>{t('home.hero.cta')}</button>
    </div>
  );
}
```

### With Interpolation
```typescript
// Translation file
{
  "planner": {
    "maxDestinations": "Maksimal {{count}} destinasi"
  }
}

// Component
<p>{t('planner.maxDestinations', { count: 10 })}</p>
// Output: "Maksimal 10 destinasi"
```

### With Pluralization
```typescript
// Translation file
{
  "destinationDetail": {
    "hour": "jam",
    "hours_plural": "jam"
  }
}

// Component
<span>{t('destinationDetail.hour', { count: duration })}</span>
```

## Language Switcher Component

### Location
The `LanguageSwitcher` component is integrated in:
- **Desktop Header** - Next to ThemeToggle button
- **Mobile Menu** - In collapsed navigation drawer

### Features
- 🌐 Globe icon for easy recognition
- 🎌 Flag emojis for each language
- ✓ Checkmark for current language
- 💾 Persists selection to localStorage
- 🎨 Styled with shadcn/ui components

### UI Preview
```
┌─────────────────────┐
│ 🌐 (Globe Icon)     │
├─────────────────────┤
│ 🇮🇩 Bahasa Indonesia ✓│
│ 🇬🇧 English          │
│ 🇨🇳 中文              │
│ 🇯🇵 日本語            │
│ 🇰🇷 한국어            │
└─────────────────────┘
```

## Implementation Steps Completed

### 1. Package Installation ✅
```bash
bun add i18next react-i18next i18next-browser-languagedetector
```

### 2. Translation Files Created ✅
- ✅ `src/locales/id.json` - Indonesian (234 lines)
- ✅ `src/locales/en.json` - English (234 lines)
- ✅ `src/locales/zh.json` - Simplified Chinese (234 lines)
- ✅ `src/locales/ja.json` - Japanese (234 lines)
- ✅ `src/locales/ko.json` - Korean (234 lines)

### 3. Configuration Files ✅
- ✅ `src/i18n/config.ts` - i18next initialization
- ✅ Integrated in `src/main.tsx` with import

### 4. UI Components ✅
- ✅ `src/components/LanguageSwitcher.tsx` - Language selector dropdown
- ✅ Integrated in `Header.tsx` (desktop + mobile)

### 5. Header Component Updated ✅
- ✅ Imported `useTranslation` hook
- ✅ Replaced all hardcoded strings with `t()` calls
- ✅ Added LanguageSwitcher to desktop header
- ✅ Added LanguageSwitcher to mobile menu
- ✅ Translated navigation, auth buttons, profile menu

## Testing the Implementation

### Manual Testing Steps
1. **Open application**: http://localhost:8080
2. **Check default language**: Should be Indonesian (or browser language)
3. **Open language switcher**: Click globe icon in header
4. **Switch languages**: Test all 5 languages
5. **Verify persistence**: Refresh page, language should remain
6. **Test mobile**: Open mobile menu, verify language switcher works

### What to Verify
- ✅ Header navigation labels change
- ✅ Button text updates (Login, Register, etc.)
- ✅ User menu items translate correctly
- ✅ Mobile menu shows language switcher
- ✅ Selected language has checkmark
- ✅ Language persists after page reload

## Next Steps for Complete Integration

To complete the multi-language implementation across the entire application:

### 1. HomePage Translation
```typescript
// src/pages/HomePage.tsx
import { useTranslation } from 'react-i18next';

function HomePage() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('home.hero.title')}</h1>
      <p>{t('home.hero.subtitle')}</p>
      <button>{t('home.hero.cta')}</button>
      
      <h2>{t('home.features.title')}</h2>
      <div>{t('home.features.smartPlanner')}</div>
      {/* ... */}
    </div>
  );
}
```

### 2. DestinationsPage Translation
```typescript
// src/pages/DestinationsPage.tsx
<h1>{t('destinations.title')}</h1>
<p>{t('destinations.subtitle')}</p>
<button>{t('destinations.filterByType')}</button>
<select>
  <option value="">{t('destinations.all')}</option>
  <option value="heritage">{t('destinations.types.heritage')}</option>
  <option value="temple">{t('destinations.types.temple')}</option>
</select>
```

### 3. PlannerPage Translation
```typescript
// src/pages/PlannerPage.tsx
<h1>{t('planner.title')}</h1>
<label>{t('planner.transportMode')}</label>
<button>{t('planner.car')}</button>
<button>{t('planner.flight')}</button>
<button>{t('planner.ship')}</button>
<button>{t('planner.planRoute')}</button>
```

### 4. AuthPages Translation
```typescript
// src/pages/LoginPage.tsx
<h1>{t('auth.login.title')}</h1>
<input placeholder={t('auth.login.email')} />
<input placeholder={t('auth.login.password')} />
<button>{t('auth.login.loginButton')}</button>
```

### 5. Footer Translation
```typescript
// src/components/Footer.tsx
<h3>{t('footer.about')}</h3>
<p>{t('footer.aboutText')}</p>
<h4>{t('footer.quickLinks')}</h4>
<p>{t('footer.copyright')}</p>
```

## Key Translation Examples

### Transport Modes
| English | Indonesian | Chinese | Japanese | Korean |
|---------|------------|---------|----------|--------|
| Car | Mobil | 汽车 | 車 | 자동차 |
| Motorcycle | Motor | 摩托车 | バイク | 오토바이 |
| Bus | Bus | 公共汽车 | バス | 버스 |
| Train | Kereta | 火车 | 電車 | 기차 |
| Flight | Pesawat | 飞机 | 飛行機 | 비행기 |
| Ship | Kapal Laut | 轮船 | 船 | 선박 |

### Common Actions
| English | Indonesian | Chinese | Japanese | Korean |
|---------|------------|---------|----------|--------|
| Loading... | Memuat... | 加载中... | 読み込み中... | 로딩 중... |
| Success | Berhasil | 成功 | 成功 | 성공 |
| Cancel | Batal | 取消 | キャンセル | 취소 |
| Save | Simpan | 保存 | 保存 | 저장 |
| Delete | Hapus | 删除 | 削除 | 삭제 |

## Best Practices

### 1. Always Use Translation Keys
❌ **Bad**: `<button>Login</button>`  
✅ **Good**: `<button>{t('nav.login')}</button>`

### 2. Keep Keys Organized
- Use nested structure: `home.hero.title`
- Group by feature: `planner.*`, `auth.*`
- Reuse common terms: `common.loading`, `common.success`

### 3. Handle Dynamic Content
```typescript
// Use interpolation
{t('planner.maxDestinations', { count: 10 })}

// Use pluralization when needed
{t('destinationDetail.hour', { count: duration })}
```

### 4. Maintain Consistency
- Use same key names across all language files
- Keep structure identical in all JSON files
- Test all languages when adding new keys

### 5. Cultural Appropriateness
- Chinese: Use Simplified Chinese (简体中文) not Traditional
- Japanese: Use polite forms (です/ます)
- Korean: Use formal speech levels
- Respect cultural contexts in translations

## Troubleshooting

### Language Not Changing
1. Check browser console for i18next errors
2. Verify localStorage has `i18nextLng` key
3. Clear browser cache and localStorage
4. Ensure `import './i18n/config'` in `main.tsx`

### Missing Translations
1. Check translation key exists in JSON file
2. Verify JSON syntax is valid (no trailing commas)
3. Ensure all language files have the same keys
4. Check console for `i18next::translator` warnings

### LocalStorage Not Persisting
1. Verify detection config in `i18n/config.ts`
2. Check browser allows localStorage
3. Ensure `caches: ['localStorage']` is set
4. Test in non-incognito browser window

## Performance Considerations

### Bundle Size
- Total translation files: ~40KB (all 5 languages)
- Gzipped: ~8KB
- Lazy loading: Consider code-splitting for large apps

### Runtime Performance
- i18next caches translations in memory
- Translation lookups are O(1) hash map operations
- No performance impact on render times

## Maintenance

### Adding New Translation Keys
1. Add key to `id.json` (master file)
2. Copy structure to all other language files
3. Translate to each language
4. Test in UI component
5. Commit all files together

### Example: Adding New Key
```json
// In all 5 language files
{
  "booking": {
    "specialRequest": "Special Request (ID/EN/ZH/JA/KO)"
  }
}
```

## Production Checklist

- ✅ All 5 language files complete and validated
- ✅ i18n configuration initialized in `main.tsx`
- ✅ LanguageSwitcher component working on desktop & mobile
- ✅ Header component fully translated
- ⏳ HomePage translation (pending)
- ⏳ DestinationsPage translation (pending)
- ⏳ PlannerPage translation (pending)
- ⏳ AuthPages translation (pending)
- ⏳ Footer translation (pending)
- ⏳ All remaining pages translation (pending)

## Resources

### Official Documentation
- [i18next docs](https://www.i18next.com/)
- [react-i18next docs](https://react.i18next.com/)
- [i18next-browser-languagedetector](https://github.com/i18next/i18next-browser-languageDetector)

### Translation Tools
- Google Translate API (for initial drafts)
- DeepL (for professional translations)
- Native speakers (for cultural validation)

### Testing Tools
- Browser DevTools > Application > Local Storage
- i18next debug mode: `debug: true` in config
- React DevTools for component inspection

---

**Status**: ✅ **Core Implementation Complete**  
**Next**: Integrate translations across all pages and components  
**Estimated**: ~2-3 hours for complete app-wide integration
