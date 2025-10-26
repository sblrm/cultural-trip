# 📦 Instalasi Bun untuk Windows

## Apa itu Bun?

Bun adalah JavaScript runtime & package manager yang sangat cepat (alternatif npm/yarn). CulturalTrip menggunakan Bun untuk dependency management.

## Cara Install Bun di Windows

### Opsi 1: Install via PowerShell (Recommended)

Buka PowerShell sebagai **Administrator** dan jalankan:

```powershell
powershell -c "irm bun.sh/install.ps1|iex"
```

Setelah selesai, **restart terminal** Anda.

### Opsi 2: Install via npm (jika sudah punya Node.js)

```bash
npm install -g bun
```

### Opsi 3: Install via Scoop

```bash
scoop install bun
```

### Verifikasi Instalasi

```bash
bun --version
```

Jika berhasil, akan muncul versi Bun (misalnya: `1.1.42`)

---

## ⚠️ Alternatif: Gunakan npm/node

Jika tidak ingin install Bun, Anda bisa menggunakan npm:

### 1. Pastikan Node.js Terinstall

```bash
node --version
npm --version
```

Jika belum install, download dari [nodejs.org](https://nodejs.org)

### 2. Install Dependencies

```bash
npm install
```

### 3. Gunakan npm Scripts

Ganti semua command `bun` dengan `npm`:

```bash
# Bun command          →  npm equivalent
bun install            →  npm install
bun run dev            →  npm run dev
bun run build          →  npm run build
bun run test:connection →  npm run test:connection
```

---

## 🚀 Quick Start Setelah Install

```bash
# Install dependencies
bun install

# Test Supabase connection
bun run test:connection

# Run development server
bun run dev
```

---

## 🔧 Troubleshooting

### "bun is not recognized"

**Solusi:**
1. Restart terminal setelah install
2. Cek PATH environment variable
3. Install ulang dengan opsi berbeda
4. Gunakan npm sebagai alternatif

### Permission Denied

**Solusi:**
1. Run PowerShell as Administrator
2. Enable script execution: 
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### Instalasi Gagal

**Solusi:**
1. Cek koneksi internet
2. Disable antivirus sementara
3. Gunakan npm sebagai alternatif

---

## 📖 Resources

- [Bun Documentation](https://bun.sh/docs)
- [Bun Installation Guide](https://bun.sh/docs/installation)
