# Dashboard Admin - Manajemen Data HKI

Repositori ini berisi kode sumber untuk aplikasi **Dasbor Admin Manajemen HKI**. Aplikasi ini berfungsi sebagai panel terpusat untuk mengelola (CRUD), menganalisis, dan mengekspor data pengajuan Hak Kekayaan Intelektual (HKI).

## ✨ Fitur Utama

  * **Otentikasi & Manajemen Pengguna:** Sistem login aman berbasis email/password dengan verifikasi peran. Hanya **admin** yang dapat mengakses dasbor. Terdapat halaman khusus untuk mengelola pengguna (tambah/edit/hapus).
  * **Manajemen Data (CRUD) Interaktif:** Kemampuan penuh untuk **Membuat, Membaca, Memperbarui, dan Menghapus (CRUD)** data HKI.
  * **Tabel Data Modern:** Tabel data utama dilengkapi dengan **pencarian**, **filter** multi-kriteria, **penyortiran** kolom, dan **paginasi** sisi server. Tabel ini juga responsif dan berubah menjadi **tampilan kartu (card view)** di perangkat mobile.
  * **Ekspor Data:** Admin dapat mengekspor data yang telah difilter ke dalam format **CSV** dan **Excel (.xlsx)**.
  * **Manajemen File Aman:** Kemampuan untuk mengunggah sertifikat PDF ke **Supabase Storage**. File diakses menggunakan **URL sementara (signed URL)** untuk keamanan.
  * **Visualisasi Laporan:** Halaman laporan dengan **grafik interaktif** untuk menganalisis tren data HKI berdasarkan tahun dan status.
  * **Pembaruan Real-time:** Tabel data utama akan otomatis diperbarui jika ada perubahan dari pengguna lain berkat **Supabase Realtime**.

## 🛠️ Teknologi Utama

Proyek ini dibangun menggunakan tumpukan teknologi modern yang berfokus pada kinerja dan pengalaman pengembang:

  * **Framework:** **Next.js 13** (menggunakan App Router)
  * **Bahasa:** **TypeScript**
  * **Database & Backend:** **Supabase** (Auth, PostgreSQL, Storage, Realtime)
  * **Styling:** **TailwindCSS** & **shadcn/ui**
  * **Manajemen State (Client):** **React Query** (`@tanstack/react-query`)
  * **Formulir & Validasi:** **React Hook Form** & **Zod**
  * **Visualisasi Data:** **Recharts**
  * **Ekspor File:** **ExcelJS**

-----

## 🚀 Panduan Instalasi & Konfigurasi

Ikuti langkah-langkah ini untuk menjalankan proyek secara lokal.

### 1\. Konfigurasi Variabel Lingkungan

Salin file `.env.example` menjadi `.env.local` dan isi dengan kredensial Supabase Anda.

```bash
# URL proyek Supabase Anda
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"

# Kunci Anon (public) Supabase Anda
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

# Kunci Service Role (secret) Supabase Anda (untuk operasi di sisi server)
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"

# Email untuk Super Admin (opsional, untuk fitur manajemen peran)
SUPER_ADMIN_EMAIL="super.admin@example.com"
```

### 2\. Konfigurasi Database & Storage Supabase

Aplikasi ini memerlukan pengaturan spesifik di Supabase:

  * **Tabel:** Pastikan semua tabel yang diperlukan telah dibuat (termasuk `hki`, `pemohon`, `pengusul`, `jenis_hki`, `status_hki`, `kelas_hki`, dan `profiles`).
  * **Keamanan (RLS):** Aktifkan **Row Level Security (RLS)** pada semua tabel. Buat *policy* RLS yang sesuai untuk memberikan akses penuh (`ALL`) kepada pengguna dengan peran `admin`.
  * **Sinkronisasi Auth:** Siapkan *trigger* dan *function* di database (misalnya `handle_new_user`) untuk menyinkronkan data dari `auth.users` ke tabel `public.profiles` setiap kali ada pengguna baru mendaftar.
  * **Storage:** Buat *bucket* di Supabase Storage dengan nama `sertifikat-hki`. Pastikan **"Public bucket" TIDAK dicentang**. Atur *policy* Storage agar hanya admin yang dapat melakukan unggah (`insert`) dan lihat (`select`).

### 3\. Instalasi Dependensi

```bash
npm install
```

### 4\. Menjalankan Server Development

```bash
npm run dev
```

Aplikasi akan tersedia di `http://localhost:3000`.

-----

## 📂 Struktur Proyek

Struktur folder utama proyek ini adalah sebagai berikut:

```
app/
├── (auth)/                  # Grup rute untuk otentikasi (cth: /login)
├── dashboard/               # Grup rute untuk area admin yang dilindungi
│   ├── layout.tsx           # Layout utama dasbor (Sidebar, Header)
│   ├── page.tsx             # Halaman utama dasbor (statistik)
│   ├── data-pengajuan-fasilitasi/ # Modul utama manajemen HKI
│   ├── data-master/         # Modul manajemen data referensi (Jenis, Kelas, etc)
│   ├── laporan/             # Halaman laporan dan statistik
│   └── manajemen-pengguna/  # Modul manajemen pengguna
├── api/                     # Rute API backend (Route Handlers)
│   ├── hki/                 # Endpoint untuk HKI (CRUD, ekspor)
│   ├── master/              # Endpoint untuk data master
│   └── users/               # Endpoint untuk manajemen pengguna
└── layout.tsx               # Root layout aplikasi

components/
├── ui/                      # Komponen UI inti dari shadcn/ui
├── hki/                     # Komponen spesifik HKI (data-table, modals)
├── forms/                   # Komponen formulir (hki-form)
└── layout/                  # Komponen layout (Sidebar, Topbar, Footer)

lib/
├── types.ts                 # Definisi tipe TypeScript global
├── supabase-browser.ts      # Klien Supabase untuk sisi klien ('use client')
└── utils/supabase/server.ts # Klien Supabase untuk sisi server (RSC, Actions, API)

hooks/
├── useDebounce.ts           # Hook untuk menunda input pencarian
├── useHkiEntry.ts           # Hook untuk mengambil satu data HKI (untuk edit)
└── useHkiRealtime.ts        # Hook untuk mendengarkan perubahan data

middleware.ts                # Middleware Next.js untuk me-refresh sesi Supabase
```

## 📝 Prinsip Utama Proyek

  * **Pemisahan Komponen:** Proyek ini memanfaatkan **React Server Components (RSC)** untuk pengambilan data awal (seperti di `app/dashboard/page.tsx`) dan **Client Components** (`'use client'`) untuk interaktivitas (seperti di `app/dashboard/data-pengajuan-fasilitasi/hki-client-page.tsx`).
  * **Manajemen Data:**
      * Data statis (seperti opsi filter) diambil di sisi server menggunakan RSC dan dibungkus `React.cache`.
      * Data dinamis (seperti tabel HKI) diambil di sisi klien menggunakan **React Query** (`useQuery`) untuk caching, refetching, dan optimistic updates.
  * **Optimasi:** **`React.lazy`** digunakan untuk memuat komponen modal yang berat (seperti `HKIForm`) hanya saat dibutuhkan, sehingga mempercepat *load* halaman awal.
