# Dashboard Admin - Manajemen Data HKI

Dasbor Admin untuk Manajemen Hak Kekayaan Intelektual (HKI). Aplikasi ini adalah solusi lengkap yang dirancang untuk memusatkan, mengelola, dan menganalisis data pengajuan HKI secara efisien dan aman.

## ✨ Fitur Utama

- **Otentikasi & Keamanan:** Sistem login aman berbasis email/password dengan verifikasi peran. Hanya pengguna dengan peran **admin** yang dapat mengakses fungsionalitas dasbor.
- **Manajemen Data HKI (CRUD):** Kemampuan penuh untuk **Membuat, Membaca, Memperbarui, dan Menghapus (CRUD)** data HKI melalui formulir yang intuitif dan tervalidasi.
- **Tabel Data Interaktif & Responsif:** Menampilkan data dengan fitur **pencarian _real-time_**, **penyortiran (sorting)** kolom, **filter** multi-kriteria, dan **paginasi** yang efisien.
- **Fitur Ekspor Data:** Admin dapat mengekspor data yang telah difilter ke dalam format **CSV** dan **Excel (.xlsx)**, lengkap dengan nama file yang deskriptif dan dinamis.
- **Manajemen File Aman:** Kemampuan untuk mengunggah sertifikat HKI dalam format **PDF**. File disimpan dengan aman di Supabase Storage dan diakses melalui **URL sementara (signed URL)** untuk mencegah akses tidak sah.
- **Manajemen Pengguna:** Halaman khusus admin untuk mengelola pengguna lain, termasuk menambah admin baru dan mengubah peran (jika memiliki hak akses _super admin_).
- **Validasi Formulir Modern:** Validasi data di sisi klien dan server yang tangguh menggunakan **Zod** dan **React Hook Form** untuk memastikan integritas dan akurasi data.
- **Antarmuka Profesional:** Didesain dengan **shadcn/ui** dan **TailwindCSS** untuk tampilan yang bersih, modern, dan sepenuhnya responsif.

### Fitur Tambahan

- **Pembaruan _Real-time_:** Tabel data akan secara otomatis diperbarui ketika ada perubahan dari pengguna lain berkat integrasi dengan Supabase Realtime.
- **Tampilan Mobile Adaptif:** Tampilan tabel secara otomatis beradaptasi menjadi **tampilan kartu (card view)** pada perangkat mobile untuk pengalaman pengguna yang optimal.
- **Dukungan _Dark Mode_:** Antarmuka mendukung tema terang dan gelap yang dapat disesuaikan dengan preferensi sistem pengguna.
- **Laporan & Visualisasi:** Halaman laporan dengan grafik interaktif untuk menganalisis tren data HKI berdasarkan tahun dan status.

---

## 🛠️ Teknologi yang Digunakan

---

## 🚀 Panduan Instalasi & Konfigurasi

Ikuti langkah-langkah berikut untuk menjalankan proyek ini di lingkungan lokal Anda.

### 1\. ⚙️ Konfigurasi Variabel Lingkungan

Buat file bernama `.env.local` di direktori utama proyek. Salin konten dari `.env.example` dan isi dengan kredensial Supabase Anda.

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

### 2\. 🗄️ Konfigurasi Database & Storage Supabase

Aplikasi ini memerlukan beberapa tabel, fungsi, dan _trigger_. Pastikan skema database Anda sesuai dengan yang dibutuhkan oleh aplikasi.

**Penting:**

- Pastikan semua tabel yang diperlukan (`hki`, `pemohon`, `pengusul`, `jenis_hki`, `status_hki`, `kelas_hki`, `profiles`) telah dibuat.
- Aktifkan **Row Level Security (RLS)** pada semua tabel tersebut.
- Buat _policy_ RLS yang sesuai untuk memberikan akses `ALL` kepada peran `admin`.
- Siapkan _trigger_ dan _function_ `handle_new_user` untuk sinkronisasi data dari `auth.users` ke tabel `public.profiles`.
- Buat _bucket_ di Supabase Storage dengan nama `sertifikat-hki` dan pastikan **"Public bucket" tidak dicentang**. Atur _policy_ agar hanya admin yang dapat melakukan operasi pada _bucket_ ini.

### 3\. 📦 Instalasi Dependensi

Jalankan perintah berikut untuk menginstal semua paket yang dibutuhkan.

```bash
npm install
```

### 4\. 🌐 Mode Development

Jalankan server pengembangan lokal.

```bash
npm run dev
```

Aplikasi akan tersedia di `http://localhost:3000`.

### 5\. 🌐 Deploy ke Vercel

1.  Hubungkan repositori GitHub Anda ke Vercel.
2.  Tambahkan semua variabel dari `.env.local` ke pengaturan **Environment Variables** di dasbor proyek Vercel Anda.
3.  Deploy\!

---

## 📂 Struktur Proyek

```
app/
├── (auth)/                  # Grup rute untuk otentikasi
│   └── login/page.tsx       # Halaman login
├── dashboard/               # Grup rute untuk area yang dilindungi
│   ├── layout.tsx           # Layout utama dasbor (Sidebar, Header)
│   ├── page.tsx             # Halaman utama dasbor
│   ├── data-pengajuan-fasilitasi/ # Modul utama manajemen HKI
│   ├── data-master/         # Modul manajemen data referensi
│   ├── laporan/             # Halaman laporan dan statistik
│   └── manajemen-pengguna/  # Modul manajemen pengguna
├── api/                     # Rute API backend
│   ├── hki/                 # Endpoint untuk HKI (CRUD, ekspor, hapus massal)
│   ├── master/              # Endpoint untuk data master
│   └── users/               # Endpoint untuk manajemen pengguna
└── layout.tsx               # Root layout aplikasi

components/
├── ui/                      # Komponen dari shadcn/ui
├── hki/                     # Komponen spesifik HKI (data-table, modals)
├── forms/                   # Komponen formulir (hki-form, file-uploader)
└── layout/                  # Komponen layout (Sidebar, Topbar, Footer)

lib/
├── utils.ts                 # Fungsi utilitas umum (e.g., cn)
├── types.ts                 # Definisi tipe TypeScript global
└── supabase-browser.ts      # Klien Supabase untuk sisi klien

hooks/
└── use-*.ts                 # Hooks kustom (useDebounce, useHkiEntry, dll.)

services/
└── hki-service.ts           # Logika terpusat untuk interaksi API

middleware.ts                # Middleware untuk refresh sesi Supabase
```

---

## 📝 Catatan Tambahan

- **Performa:** Proyek ini memanfaatkan fitur-fitur modern React dan Next.js seperti **React Server Components (RSC)**, `React.lazy`, dan `React.memo` untuk optimasi performa. Pengambilan data di sisi server digabungkan dengan **React Query** di sisi klien untuk manajemen state data yang efisien.
- **Klien Supabase:** Terdapat dua utilitas utama untuk membuat klien Supabase: `createClient` dari `utils/supabase/server` untuk komponen server dan `createClient` dari `lib/supabase-browser` untuk komponen klien.
- **Real-time:** Hook `useHkiRealtime` digunakan untuk mendengarkan perubahan pada tabel `hki` dan secara otomatis memperbarui data yang ditampilkan di tabel.
