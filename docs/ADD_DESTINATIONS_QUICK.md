# 🚀 Quick Reference: Menambah Destinasi

## 📌 Pilih Metode Sesuai Kebutuhan

| Jumlah Data | Metode | Command/Aksi |
|-------------|--------|--------------|
| 1-5 destinasi | **Supabase Dashboard** | Buka Table Editor → Insert Row |
| 5-50 destinasi | **JSON/CSV Import** | `npm run import:destinations destinations.json` |
| >50 destinasi | **SQL Script** | Copy ke Supabase SQL Editor |
| Ongoing management | **Admin Dashboard** | *(Coming soon)* |

---

## ⚡ Quick Commands

```bash
# Import dari JSON
npm run import:destinations scripts/destinations-template.json

# Import dari CSV  
npm run import:destinations scripts/destinations-template.csv

# Verifikasi data di database
npm run test:destinations
```

---

## 📝 Template Files

**Edit template ini sesuai kebutuhan:**
- `scripts/destinations-template.json` - Format JSON
- `scripts/destinations-template.csv` - Format CSV (bisa edit di Excel)
- `scripts/add-destinations-from-csv.sql` - Format SQL

---

## ✅ Quick Validation

**Cek sebelum import:**
```bash
# Koordinat valid? Buka Google Maps:
https://www.google.com/maps/place/{latitude},{longitude}

# Contoh:
https://www.google.com/maps/place/-6.1760,106.8227
```

**Field yang WAJIB:**
- ✅ name, city, province, type
- ✅ latitude, longitude (koordinat valid)
- ✅ hours (format: {"open":"08:00","close":"17:00"})
- ✅ duration (dalam menit)
- ✅ description (min 50 karakter)
- ✅ image (path: /culture-uploads/nama.jpg)
- ✅ price (dalam Rupiah, integer)
- ✅ rating = 0 (akan dihitung otomatis)
- ✅ transportation (array min 1 item)

---

## 🎯 Format Quick Reference

**JSON:**
```json
{
  "name": "Nama Destinasi",
  "city": "Kota",
  "province": "Provinsi", 
  "type": "Kategori",
  "latitude": -6.1234,
  "longitude": 106.5678,
  "hours": {"open": "08:00", "close": "17:00"},
  "duration": 120,
  "description": "Deskripsi minimal 50 karakter...",
  "image": "/culture-uploads/image.jpg",
  "price": 50000,
  "transportation": ["Bus", "Kereta"]
}
```

**CSV:**
```csv
name,city,province,type,latitude,longitude,hours_open,hours_close,duration,description,image,price,transportation
Nama,Kota,Provinsi,Kategori,-6.1234,106.5678,08:00,17:00,120,Deskripsi...,/culture-uploads/img.jpg,50000,Bus|Kereta
```

**SQL:**
```sql
INSERT INTO destinations (name, city, province, type, latitude, longitude, 
  hours, duration, description, image, price, rating, transportation)
VALUES ('Nama', 'Kota', 'Provinsi', 'Kategori', -6.1234, 106.5678,
  ('08:00', '17:00'), 120, 'Deskripsi...', '/culture-uploads/img.jpg',
  50000, 0, ARRAY['Bus','Kereta']);
```

---

## 🔧 Troubleshooting

| Error | Solusi |
|-------|--------|
| "duplicate key" | Nama destinasi sudah ada, ganti nama |
| "null value" | Ada field required yang kosong |
| "invalid geography" | Koordinat salah format |
| Gambar tidak muncul | Cek file ada di `/public/culture-uploads/` |

---

## 📖 Full Documentation

Lihat dokumentasi lengkap: **`docs/ADD_DESTINATIONS.md`**

---

**Pro Tip:** 
- Rating akan otomatis update dari user reviews
- Gunakan Google Maps untuk cari koordinat yang akurat
- Upload gambar dulu ke `/public/culture-uploads/` sebelum import data
