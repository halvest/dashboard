/*
  # Seed data for HKI Admin Dashboard

  This file creates sample data for testing the application.
  Run this after setting up the main tables.

  1. Creates an admin user profile (you'll need to sign up first)
  2. Inserts sample HKI entries for testing
*/

-- Sample HKI entries
INSERT INTO hki (
  nama_hki,
  jenis_hki,
  nama_pemohon,
  nomor_permohonan,
  tanggal_permohonan,
  status,
  fasilitasi_tahun,
  keterangan
) VALUES 
(
  'Sistem Manajemen Inventaris SMART',
  'Hak Cipta',
  'PT. Teknologi Inovatif Indonesia',
  'EC00202400001',
  '2024-01-15',
  'Diterima',
  2024,
  'Software untuk manajemen inventaris dengan fitur AI dan IoT integration'
),
(
  'Brand Logo InnoTech Solutions',
  'Merek',
  'CV. InnoTech Solutions',
  'DM00202400012',
  '2024-02-20',
  'Dalam Proses',
  2024,
  'Logo dan brand identity untuk perusahaan teknologi'
),
(
  'Metode Pengolahan Limbah Organik Ramah Lingkungan',
  'Paten',
  'Dr. Sari Wijayanti, M.Sc',
  'P00202400005',
  '2024-03-10',
  'Didaftar',
  2024,
  'Inovasi teknologi pengolahan limbah organik menggunakan mikroorganisme lokal'
),
(
  'Aplikasi Mobile EduKids Learning',
  'Hak Cipta',
  'Yayasan Pendidikan Digital',
  'EC00202300089',
  '2023-11-25',
  'Diterima',
  2023,
  'Aplikasi pembelajaran interaktif untuk anak usia 3-12 tahun'
),
(
  'Kopi Arabika Gayo Premium',
  'Indikasi Geografis',
  'Asosiasi Petani Kopi Gayo',
  'IG00202300015',
  '2023-08-14',
  'Didaftar',
  2023,
  'Sertifikasi indikasi geografis untuk kopi arabika dari daerah Gayo, Aceh'
);

-- Note: To create an admin user, you need to:
-- 1. Sign up through the application first
-- 2. Then update the is_admin field manually:
-- UPDATE profiles SET is_admin = true WHERE email = 'your-admin-email@example.com';