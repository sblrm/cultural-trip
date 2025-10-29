-- ============================================================================
-- Script untuk Import Destinasi dari CSV
-- ============================================================================
-- Cara menggunakan:
-- 1. Siapkan file CSV dengan format: name,city,province,type,latitude,longitude,open,close,duration,description,image,price,transportation
-- 2. Upload CSV ke Supabase Storage atau server
-- 3. Jalankan script ini di Supabase SQL Editor
-- 4. Atau gunakan COPY command dari psql

-- Example: Import dari file CSV lokal (via psql)
-- COPY public.destinations (name, city, province, type, latitude, longitude, hours, duration, description, image, price, rating, transportation)
-- FROM '/path/to/destinations.csv'
-- DELIMITER ','
-- CSV HEADER;

-- ============================================================================
-- Template untuk menambah destinasi baru satu per satu
-- ============================================================================

-- TEMPLATE: Copy dan edit sesuai kebutuhan
INSERT INTO public.destinations (
    name,
    city,
    province,
    type,
    latitude,
    longitude,
    hours,
    duration,
    description,
    image,
    price,
    rating,
    transportation
) VALUES (
    'Nama Destinasi',                           -- Nama destinasi
    'Nama Kota',                                -- Kota
    'Nama Provinsi',                            -- Provinsi
    'Kategori Budaya',                          -- Tipe/kategori
    -6.1751,                                    -- Latitude (koordinat)
    106.8650,                                   -- Longitude (koordinat)
    ('08:00', '17:00'),                         -- Jam buka & tutup
    120,                                        -- Durasi kunjungan (menit)
    'Deskripsi lengkap tentang destinasi ini.', -- Deskripsi
    '/culture-uploads/nama-file.jpg',           -- Path gambar
    50000,                                      -- Harga tiket (Rupiah)
    0,                                          -- Rating awal (akan dihitung dari reviews)
    ARRAY['Bus', 'Kereta', 'Motor']            -- Transportasi yang tersedia
);

-- ============================================================================
-- Contoh menambah multiple destinasi sekaligus
-- ============================================================================

INSERT INTO public.destinations (
    name, city, province, type, latitude, longitude, hours, duration, 
    description, image, price, rating, transportation
) VALUES
    (
        'Museum Nasional Indonesia',
        'Jakarta Pusat',
        'DKI Jakarta',
        'Museum & Warisan Sejarah',
        -6.1760,
        106.8227,
        ('08:00', '16:00'),
        90,
        'Museum Nasional Indonesia atau Museum Gajah adalah museum arkeologi, sejarah, etnologi, dan geografi yang terletak di Jakarta. Museum ini menyimpan koleksi prasejarah lengkap seperti arca, prasasti, dan benda purbakala.',
        '/culture-uploads/museum-nasional.jpg',
        10000,
        0,
        ARRAY['TransJakarta', 'Kereta', 'Taksi']
    ),
    (
        'Kampung Naga',
        'Tasikmalaya',
        'Jawa Barat',
        'Kehidupan Adat & Arsitektur',
        -7.3597,
        108.2200,
        ('07:00', '17:00'),
        120,
        'Kampung Naga adalah kampung adat Sunda yang masih mempertahankan tradisi leluhur dengan ketat. Rumah-rumah di kampung ini dibangun dengan arsitektur tradisional Sunda dan warga masih menjalankan cara hidup tradisional.',
        '/culture-uploads/kampung-naga.jpg',
        20000,
        0,
        ARRAY['Bus', 'Rental Mobil', 'Motor']
    )
-- Tambahkan koma dan data berikutnya jika ingin menambah lebih banyak
;

-- ============================================================================
-- Verification: Cek destinasi yang baru ditambahkan
-- ============================================================================
SELECT 
    id,
    name,
    city,
    province,
    price,
    created_at
FROM public.destinations
ORDER BY created_at DESC
LIMIT 10;
