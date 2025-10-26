# 📚 CulturalTrip Documentation

Dokumentasi lengkap untuk setup dan development CulturalTrip.

## 🚀 Quick Links

### Getting Started
- **[Quick Start Guide](./QUICK_START.md)** - Setup dalam 5 menit
- **[Supabase Setup](./SUPABASE_SETUP.md)** - Panduan detail setup database
- **[Command Reference](./COMMAND_REFERENCE.md)** - npm vs Bun commands

### Installation
- **[Install Bun](./INSTALL_BUN.md)** - Panduan install Bun untuk Windows
- Package manager: npm atau Bun (keduanya supported)

## 📖 Documentation Index

### 1. Setup Guides

#### [Quick Start Guide](./QUICK_START.md)
Panduan cepat untuk setup CulturalTrip dalam 5 menit.

**Apa yang dipelajari:**
- Install dependencies (npm/Bun)
- Setup Supabase database
- Konfigurasi environment variables
- Test koneksi dan run app

#### [Supabase Setup Guide](./SUPABASE_SETUP.md)
Panduan lengkap dan detail untuk setup database Supabase.

**Apa yang dipelajari:**
- Step-by-step setup Supabase project
- Enable PostGIS extension
- Run migrations dan seed data
- Konfigurasi RLS policies
- Troubleshooting common issues
- Database structure & diagram

### 2. Development Guides

#### [Command Reference](./COMMAND_REFERENCE.md)
Referensi command untuk npm dan Bun.

**Apa yang dipelajari:**
- npm vs Bun commands
- Development workflow
- Testing commands
- Build & deployment

#### [Install Bun](./INSTALL_BUN.md)
Panduan install Bun package manager untuk Windows.

**Apa yang dipelajari:**
- 3 cara install Bun
- Troubleshooting instalasi
- Alternatif menggunakan npm
- Comparison npm vs Bun

## 🎯 Typical Workflow

### First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Check setup
npm run setup:check

# 3. Setup Supabase (lihat Quick Start Guide)
# - Create project
# - Enable PostGIS
# - Run SQL scripts

# 4. Configure .env.local
# Copy credentials dari Supabase Dashboard

# 5. Test connection
npm run test:connection

# 6. Run app
npm run dev
```

### Daily Development

```bash
# Start dev server
npm run dev

# In another terminal, run tests
npm run test:connection
```

## 🆘 Need Help?

### Common Issues

**"bun is not recognized"**
→ Install Bun atau gunakan npm. Lihat [Install Bun](./INSTALL_BUN.md)

**"Connection to Supabase failed"**
→ Cek `.env.local`, pastikan credentials benar. Lihat [Supabase Setup](./SUPABASE_SETUP.md)

**"PostGIS not found"**
→ Enable PostGIS extension di Supabase Dashboard → Database → Extensions

**"No destinations shown"**
→ Run `supabase/seed-data.sql` di SQL Editor

### Troubleshooting Checklist

- [ ] Node.js terinstall (`node --version`)
- [ ] npm terinstall (`npm --version`)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` exists and configured
- [ ] Supabase project created
- [ ] PostGIS enabled
- [ ] `complete-setup.sql` executed
- [ ] `seed-data.sql` executed

## 📂 Project Structure

```
CulturalTrip/
├── docs/                          # 📚 Documentation
│   ├── README.md                  # This file
│   ├── QUICK_START.md            # 5-minute setup guide
│   ├── SUPABASE_SETUP.md         # Detailed database setup
│   ├── COMMAND_REFERENCE.md       # npm vs Bun commands
│   └── INSTALL_BUN.md            # Bun installation guide
│
├── supabase/                      # 🗄️ Database
│   ├── complete-setup.sql        # All-in-one setup script
│   ├── schema.sql                # Database schema
│   ├── seed-data.sql             # Initial data
│   └── migrations/               # Migration files
│
├── scripts/                       # 🔧 Helper scripts
│   ├── check-setup.js            # Setup verification
│   └── verify-supabase.ps1       # Supabase checker
│
├── src/                          # 💻 Source code
│   ├── components/               # React components
│   ├── contexts/                 # React contexts
│   ├── lib/                      # Utilities & integrations
│   ├── pages/                    # Page components
│   └── services/                 # Business logic
│
└── .env.local                    # ⚙️ Environment config (create this!)
```

## 🔗 External Resources

- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Vite**: [vitejs.dev](https://vitejs.dev)
- **React**: [react.dev](https://react.dev)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com)
- **Bun**: [bun.sh](https://bun.sh)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/sblrm/cultural-trip/issues)
- **Email**: subhan.larasati@gmail.com

---

Made with ❤️ by [Subhan Larasati Mulyono](https://github.com/sblrm)
