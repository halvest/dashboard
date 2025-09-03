// Tipe dasar untuk tabel relasi
// Ini akan digunakan untuk mengisi dropdown di formulir nanti.
export interface JenisHKI {
  id: number;
  nama: string;
}

export interface StatusHKI {
  id: number;
  nama: string;
}

export interface FasilitasiTahun {
  id: number;
  tahun: number;
}

export interface Pengusul {
  id: number;
  nama: string;
}

export interface Pemohon {
  id: string; // uuid
  nama: string;
  alamat: string | null;
  kontak?: string | null; // tambahan dari schema terbaru
}

// Interface utama untuk HKIEntry yang sudah dinormalisasi
// Perhatikan bagaimana kita menyusun data relasional di dalamnya.
// Ini adalah cerminan dari cara Supabase akan mengembalikan data saat kita melakukan JOIN.
export interface HKIEntry {
  id: string; // uuid
  nama_hki: string;
  jenis_produk: string | null;
  tanggal_permohonan: string | null; // bisa jadi date string
  sertifikat_path: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string;

  // Data dari tabel lain yang di-JOIN
  pemohon: Pick<Pemohon, 'id' | 'nama' | 'alamat'> | null;
  jenis_hki: Pick<JenisHKI, 'id' | 'nama'> | null;
  status_hki: Pick<StatusHKI, 'id' | 'nama'> | null;
  fasilitasi_tahun: Pick<FasilitasiTahun, 'id' | 'tahun'> | null;
  pengusul: Pick<Pengusul, 'id' | 'nama'> | null;
}

// Tipe untuk profil pengguna
export interface Profile {
  id: string;
  email: string;
  role: string; // sesuai schema terbaru: 'user' | 'admin'
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}
