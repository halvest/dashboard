Tentu, saya akan rombak total `README` ini agar lebih profesional, detail, dan sepenuhnya sesuai dengan proyek manajemen HKI yang telah kita bangun bersama.

Saya akan menyajikannya dalam Bahasa Indonesia yang jelas, menambahkan detail teknis yang relevan seperti skema SQL, dan mempercantik tampilannya dengan _badge_ dan format yang lebih baik.

---

### Inilah `README.md` baru yang telah disempurnakan:

````markdown
# Dashboard Admin - Manajemen Data HKI

Selamat datang di Dashboard Admin Manajemen Hak Kekayaan Intelektual (HKI). Aplikasi ini adalah solusi lengkap yang dibangun untuk memusatkan, mengelola, dan menganalisis data pengajuan HKI secara efisien dan aman. Dibangun dengan teknologi modern, dashboard ini menawarkan antarmuka yang profesional dan fitur-fitur canggih untuk mempermudah alur kerja administrasi.

---

## ✨ Fitur Utama

- **Otentikasi & Keamanan:** Sistem login berbasis email/password dengan verifikasi peran (hanya **admin** yang dapat mengakses dashboard).
- **Manajemen Data HKI (CRUD):** Kemampuan penuh untuk **membuat, membaca, memperbarui, dan menghapus** data HKI dengan formulir yang intuitif.
- **Tabel Data Interaktif & Responsif:** Menampilkan data dengan fitur **pencarian**, **penyortiran (sorting)**, **filter** berdasarkan beberapa kriteria, dan **paginasi**. Tampilan tabel otomatis berubah menjadi **kartu (card view)** di perangkat mobile untuk pengalaman pengguna terbaik.
- **Fitur Ekspor Data Canggih:** Admin dapat mengekspor data yang sudah difilter ke dalam format **CSV** dan **Excel (.xlsx)** dengan nama file yang deskriptif.
- **Manajemen File Aman:** Kemampuan untuk mengunggah sertifikat HKI dalam format **PDF**, yang disimpan dengan aman di Supabase Storage dan diakses melalui **URL sementara (signed URL)**.
- **Validasi Formulir Modern:** Validasi data di sisi klien yang tangguh menggunakan **Zod** dan **React Hook Form** untuk memastikan integritas data.
- **Antarmuka Profesional:** Didesain dengan **shadcn/ui** dan **TailwindCSS** untuk tampilan yang bersih, modern, dan sepenuhnya responsif.

---

## 🛠️ Teknologi yang Digunakan

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)

---

## 🚀 Panduan Instalasi & Konfigurasi

Ikuti langkah-langkah berikut untuk menjalankan proyek ini di lingkungan lokal Anda.

### 1. ⚙️ Konfigurasi Variabel Lingkungan

Buat file bernama `.env.local` di direktori utama proyek dan isi dengan kredensial Supabase Anda.

```bash
# URL proyek Supabase Anda
NEXT_PUBLIC_SUPABASE_URL=[https://xxxxxxxxxxxx.supabase.co](https://xxxxxxxxxxxx.supabase.co)

# Kunci Anon (public) Supabase Anda
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Kunci Service Role (secret) Supabase Anda (untuk operasi di sisi server)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
````

### 2\. 🗄️ Konfigurasi Database & Storage Supabase

Aplikasi ini memerlukan beberapa tabel dan sebuah _bucket_ penyimpanan. Jalankan skrip SQL berikut di **SQL Editor** pada dashboard Supabase Anda.

\<details\>
\<summary\>\<strong\>Klik untuk melihat Skema SQL Lengkap\</strong\>\</summary\>

```sql
-- TABEL UNTUK PROFIL PENGGUNA (MENAMBAHKAN ROLE)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  full_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kebijakan RLS untuk profiles: Pengguna hanya bisa melihat profil sendiri
CREATE POLICY "Allow individual read access" ON profiles FOR SELECT USING (auth.uid() = id);


-- TABEL REFERENSI
CREATE TABLE pemohon (
  id SERIAL PRIMARY KEY,
  nama_pemohon TEXT NOT NULL,
  alamat TEXT
);

CREATE TABLE pengusul (
  id SERIAL PRIMARY KEY,
  nama_pengusul TEXT NOT NULL UNIQUE
);

CREATE TABLE jenis (
  id SERIAL PRIMARY KEY,
  nama_jenis TEXT NOT NULL UNIQUE
);

CREATE TABLE status_hki (
  id SERIAL PRIMARY KEY,
  nama_status TEXT NOT NULL UNIQUE
);

CREATE TABLE kelas (
  id SERIAL PRIMARY KEY,
  nama_kelas TEXT NOT NULL,
  tipe VARCHAR(10)
);


-- TABEL UTAMA: HKI
CREATE TABLE hki (
  id_hki SERIAL PRIMARY KEY,
  nama_hki TEXT NOT NULL,
  jenis_produk TEXT,
  id_pemohon INTEGER REFERENCES pemohon(id) ON DELETE SET NULL,
  id_jenis INTEGER REFERENCES jenis(id) ON DELETE SET NULL,
  id_kelas INTEGER REFERENCES kelas(id) ON DELETE SET NULL,
  id_pengusul INTEGER REFERENCES pengusul(id) ON DELETE SET NULL,
  id_status INTEGER REFERENCES status_hki(id) ON DELETE SET NULL,
  tahun_fasilitasi INTEGER NOT NULL,
  keterangan TEXT,
  sertifikat_pdf TEXT, -- Path ke file di Supabase Storage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Menambahkan UNIQUE constraint untuk mencegah duplikasi nama HKI
  CONSTRAINT unique_nama_hki UNIQUE (nama_hki)
);

-- Aktifkan RLS untuk semua tabel
ALTER TABLE pemohon ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengusul ENABLE ROW LEVEL SECURITY;
ALTER TABLE jenis ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_hki ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hki ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS: Hanya admin yang bisa melakukan semua operasi (CRUD)
CREATE POLICY "Allow admin full access" ON hki FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
-- Ulangi kebijakan serupa untuk tabel referensi lainnya (pemohon, pengusul, dll)


-- FUNGSI UNTUK TRIGGER UPDATE_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER UNTUK TABEL HKI
CREATE TRIGGER on_hki_updated
BEFORE UPDATE ON public.hki
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();
```

\</details\>

#### Konfigurasi Supabase Storage:

1.  Buka dashboard Supabase Anda, lalu navigasi ke menu **Storage**.
2.  Klik **"Create a new bucket"**.
3.  Beri nama bucket `sertifikat-hki`.
4.  Pastikan opsi **"Public bucket"** **tidak dicentang**.
5.  Setelah bucket dibuat, navigasi ke **Storage** \> **Policies**.
6.  Buat kebijakan (_policy_) baru untuk bucket `sertifikat-hki` agar admin dapat mengunggah dan mengakses file. Contoh:
    - **Allow admin uploads (`INSERT`):** Izinkan `INSERT` untuk _role_ `authenticated` jika profil pengguna adalah admin.
    - **Allow admin reads (`SELECT`):** Izinkan `SELECT` untuk _role_ `authenticated` jika profil pengguna adalah admin.

### 3\. 📦 Instalasi Dependensi

Jalankan perintah berikut untuk menginstal semua paket yang dibutuhkan.

```bash
npm install
```

### 4\. ධ Lari di Mode Development

Jalankan server pengembangan lokal.

```bash
npm run dev
```

Aplikasi akan tersedia di `http://localhost:3000`.

### 5\. 🌐 Deploy ke Vercel

1.  Hubungkan repositori GitHub Anda ke Vercel.
2.  Tambahkan semua variabel dari `.env.local` ke pengaturan **Environment Variables** di dashboard Vercel.
3.  Deploy\!

---

## 📂 Struktur Proyek

```
app/
├── (auth)/             # Grup route untuk otentikasi
│   └── login/page.tsx  # Halaman login
├── (dashboard)/        # Grup route untuk area yang dilindungi
│   ├── layout.tsx      # Layout utama dashboard (Sidebar, Header)
│   └── hki/            # Modul utama manajemen HKI
│       └── page.tsx    # Halaman utama dengan tabel data HKI
├── api/                # Route API backend
│   └── hki/
│       ├── export/route.ts # Endpoint untuk ekspor data (CSV/XLSX)
│       └── [id]/...      # Endpoint untuk operasi CRUD per-item
└── layout.tsx          # Root layout aplikasi

components/
├── ui/                 # Komponen dari shadcn/ui
├── hki/                # Komponen spesifik HKI (data-table, modals, etc.)
└── forms/              # Komponen formulir (hki-form)

lib/
├── utils.ts            # Fungsi utilitas umum (e.g., cn)
└── types.ts            # Definisi tipe TypeScript

services/
└── hki-service.ts      # Logika untuk berinteraksi dengan API (e.g., download)

middleware.ts           # Middleware untuk proteksi route (cek otentikasi)
```

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT.

```

```
