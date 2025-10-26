# 📋 Command Reference - npm vs Bun

Gunakan panduan ini jika Anda menggunakan **npm** instead of **Bun**.

## Package Manager Commands

| Task | Bun Command | npm Command |
|------|-------------|-------------|
| Install dependencies | `bun install` | `npm install` |
| Add package | `bun add <package>` | `npm install <package>` |
| Add dev dependency | `bun add -d <package>` | `npm install -D <package>` |
| Remove package | `bun remove <package>` | `npm uninstall <package>` |
| Update packages | `bun update` | `npm update` |

## Project Scripts

| Task | Bun Command | npm Command |
|------|-------------|-------------|
| Development server | `bun run dev` | `npm run dev` |
| Build production | `bun run build` | `npm run build` |
| Preview build | `bun run preview` | `npm run preview` |
| Lint code | `bun run lint` | `npm run lint` |
| Test connection | `bun run test:connection` | `npm run test:connection` |
| Test destinations | `bun run test:destinations` | `npm run test:destinations` |
| Setup verification | `bun run setup:check` | `npm run setup:check` |

## CulturalTrip Specific Commands

### Setup & Configuration

```bash
# Check setup status
npm run setup:check

# Test Supabase connection
npm run test:connection

# Test destinations data
npm run test:destinations
```

### Development Workflow

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
# Edit .env.local with Supabase credentials

# 3. Start development server
npm run dev

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
```

## Quick Reference

**Current Setup:**
- ✅ Node.js v22.16.0
- ✅ npm 10.9.2
- ⚠️ Bun not installed (optional)

**Using npm:**
```bash
npm install        # Install dependencies
npm run dev        # Start dev server (http://localhost:8080)
npm run build      # Build for production
```

**Want to use Bun instead?**
See [docs/INSTALL_BUN.md](./INSTALL_BUN.md) for installation guide.

## Why Use Bun?

✨ **Advantages:**
- 🚀 **Faster**: 3-10x faster than npm
- 📦 **Built-in**: TypeScript, JSX support out of the box
- 🔋 **Battery included**: Less configuration needed
- 🎯 **Drop-in replacement**: Compatible with npm packages

⚠️ **Stick with npm if:**
- You already have npm workflow
- Your team uses npm
- You don't want to install another tool

Both work perfectly fine for CulturalTrip! 🎉
