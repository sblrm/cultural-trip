# 📝 Panduan Menambah Data Destinasi

Ada **4 cara efisien** untuk menambah data destinasi tanpa membebani kode:

---

## 🎯 Metode 1: Via Supabase Dashboard (Paling Mudah)

**Kelebihan:**
- ✅ Tidak perlu coding
- ✅ UI friendly
- ✅ Langsung tervalidasi
- ✅ Bisa edit/hapus data

**Cara:**
1. Buka **Supabase Dashboard** → Project → **Table Editor**
2. Pilih tabel **`destinations`**
3. Klik **Insert** → **Insert row**
4. Isi semua field:
   - `name`: Nama destinasi
   - `city`: Kota
   - `province`: Provinsi
   - `type`: Kategori (contoh: "Museum & Warisan Sejarah")
   - `latitude`: Koordinat latitude (contoh: -6.1751)
   - `longitude`: Koordinat longitude (contoh: 106.8650)
   - `hours`: `{"open": "08:00", "close": "17:00"}`
   - `duration`: Durasi dalam menit (contoh: 120)
   - `description`: Deskripsi lengkap
   - `image`: Path gambar (contoh: `/culture-uploads/nama.jpg`)
   - `price`: Harga tiket (contoh: 50000)
   - `rating`: Isi 0 (akan dihitung otomatis dari reviews)
   - `transportation`: `["Bus", "Kereta", "Motor"]`
5. Klik **Save**

---

## 🚀 Metode 2: Import dari JSON/CSV (Bulk Import)

**Kelebihan:**
- ✅ Import banyak data sekaligus
- ✅ Bisa disiapkan di Excel/Google Sheets
- ✅ Format terstruktur
- ✅ Bisa reuse template

### A. Siapkan File Data

**Format JSON** (`destinations.json`):
```json
[
  {
    "name": "Museum Nasional Indonesia",
    "city": "Jakarta Pusat",
    "province": "DKI Jakarta",
    "type": "Museum & Warisan Sejarah",
    "latitude": -6.1760,
    "longitude": 106.8227,
    "hours": { "open": "08:00", "close": "16:00" },
    "duration": 90,
    "description": "Museum arkeologi dan sejarah...",
    "image": "/culture-uploads/museum-nasional.jpg",
    "price": 10000,
    "transportation": ["TransJakarta", "Kereta", "Taksi"]
  }
]
```

**Format CSV** (`destinations.csv`):
```csv
name,city,province,type,latitude,longitude,hours_open,hours_close,duration,description,image,price,transportation
Museum Nasional,Jakarta,DKI Jakarta,Museum,-6.1760,106.8227,08:00,16:00,90,Museum sejarah,/culture-uploads/museum.jpg,10000,TransJakarta|Kereta
```

### B. Install Dependencies

```bash
npm install csv-parse
```

### C. Run Import Script

```bash
# Import dari JSON
node scripts/import-destinations.js destinations.json

# Import dari CSV
node scripts/import-destinations.js destinations.csv
```

**Template tersedia di:**
- `scripts/destinations-template.json`
- `scripts/destinations-template.csv`

---

## 💾 Metode 3: SQL Script (Langsung ke Database)

**Kelebihan:**
- ✅ Sangat cepat
- ✅ Bisa transaction (rollback jika error)
- ✅ Cocok untuk migrasi data

### Cara Menggunakan

1. Buka file `scripts/add-destinations-from-csv.sql`
2. Copy template SQL dan edit sesuai kebutuhan
3. Paste ke **Supabase SQL Editor**
4. Klik **Run**

**Contoh tambah 1 destinasi:**
```sql
INSERT INTO public.destinations (
    name, city, province, type, latitude, longitude, 
    hours, duration, description, image, price, rating, transportation
) VALUES (
    'Museum Nasional Indonesia',
    'Jakarta Pusat',
    'DKI Jakarta',
    'Museum & Warisan Sejarah',
    -6.1760,
    106.8227,
    ('08:00', '16:00'),
    90,
    'Museum arkeologi dan sejarah Indonesia.',
    '/culture-uploads/museum-nasional.jpg',
    10000,
    0,
    ARRAY['TransJakarta', 'Kereta', 'Taksi']
);
```

**Contoh tambah multiple destinasi:**
```sql
INSERT INTO public.destinations (...) VALUES
    (...data destinasi 1...),
    (...data destinasi 2...),
    (...data destinasi 3...);
```

---

## 🎨 Metode 4: Admin Dashboard (Coming Soon)

Untuk kemudahan pengelolaan, Anda bisa membuat halaman admin:

**Features yang bisa ditambahkan:**
- ✅ Form input destinasi dengan validasi
- ✅ Upload gambar langsung
- ✅ Preview sebelum publish
- ✅ Edit/Delete existing destinations
- ✅ Bulk import via UI
- ✅ Search koordinat via Google Maps API

**Catatan:** Perlu tambah route `/admin` dan proteksi dengan role `admin`.

---

## 📋 Field Reference

| Field | Type | Required | Contoh | Keterangan |
|-------|------|----------|---------|------------|
| `name` | text | ✅ | "Candi Borobudur" | Nama destinasi |
| `city` | text | ✅ | "Magelang" | Kota lokasi |
| `province` | text | ✅ | "Jawa Tengah" | Provinsi |
| `type` | text | ✅ | "Candi & Warisan Sejarah" | Kategori budaya |
| `latitude` | float | ✅ | -7.6079 | Koordinat latitude |
| `longitude` | float | ✅ | 110.2038 | Koordinat longitude |
| `hours` | object | ✅ | `{"open":"06:00","close":"17:00"}` | Jam operasional |
| `duration` | integer | ✅ | 180 | Durasi kunjungan (menit) |
| `description` | text | ✅ | "Candi Buddha terbesar..." | Deskripsi lengkap |
| `image` | text | ✅ | "/culture-uploads/borobudur.jpg" | Path gambar |
| `price` | numeric | ✅ | 50000 | Harga tiket (Rupiah) |
| `rating` | numeric | ✅ | 0 | **Selalu isi 0** (dihitung otomatis) |
| `transportation` | array | ✅ | `["Bus","Kereta","Motor"]` | Transportasi tersedia |

---

## 🔍 Tips Mencari Koordinat

**Cara 1: Google Maps**
1. Buka Google Maps
2. Klik kanan pada lokasi → **What's here?**
3. Copy koordinat (format: `-7.6079, 110.2038`)

**Cara 2: GPS Koordinat Website**
- [latlong.net](https://www.latlong.net/)
- [gps-coordinates.net](https://gps-coordinates.net/)

---

## 📸 Upload Gambar

**Lokasi gambar:** `public/culture-uploads/`

**Format yang disupport:** JPG, PNG, JPEG

**Ukuran recommended:** 1920x1080px atau 16:9 ratio

**Cara upload:**
1. Copy gambar ke folder `public/culture-uploads/`
2. Gunakan nama file yang deskriptif (contoh: `candi-borobudur.jpg`)
3. Di database, isi field `image` dengan path: `/culture-uploads/candi-borobudur.jpg`

---

## ✅ Validation Checklist

Sebelum menambah data, pastikan:
- [ ] Nama destinasi unik (tidak duplikat)
- [ ] Koordinat valid (cek di Google Maps)
- [ ] Jam operasional format 24 jam (HH:MM)
- [ ] Durasi dalam menit (realistic)
- [ ] Harga dalam Rupiah (tanpa desimal)
- [ ] Rating = 0 (akan dihitung dari reviews user)
- [ ] Gambar sudah diupload ke `/culture-uploads/`
- [ ] Transportation array minimal 1 item

---

## 🆘 Troubleshooting

**Error: "duplicate key value violates unique constraint"**
→ Nama destinasi sudah ada, gunakan nama yang berbeda

**Error: "null value in column violates not-null constraint"**
→ Ada field required yang tidak diisi

**Error: "invalid input syntax for type geography"**
→ Format koordinat salah, pastikan latitude/longitude valid

**Gambar tidak muncul**
→ Pastikan file ada di `public/culture-uploads/` dan path benar

---

## 📞 Need Help?

Jika ada pertanyaan atau kendala, bisa:
1. Check error message di Supabase logs
2. Verifikasi data dengan query:
   ```sql
   SELECT * FROM destinations ORDER BY created_at DESC LIMIT 5;
   ```
3. Test di development environment dulu sebelum production

---

## 🎯 Rekomendasi Best Practice

1. **Gunakan Supabase Dashboard** untuk tambah 1-5 destinasi
2. **Gunakan JSON/CSV Import** untuk bulk insert (>10 destinasi)
3. **Gunakan SQL Script** untuk migration atau data seeding
4. **Buat Admin Dashboard** jika tim non-technical perlu manage data

**Rating akan otomatis update** dari review user, jadi tidak perlu manual update! ✨
