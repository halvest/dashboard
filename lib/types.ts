// lib/types.ts

// Tipe dasar untuk tabel relasi
export interface Pemohon {
  id_pemohon: number;
  nama_pemohon: string;
  alamat?: string | null;
}

export interface JenisHKI {
  id_jenis_hki: number;
  nama_jenis_hki: string;
}

export interface StatusHKI {
  id_status: number;
  nama_status: string;
}

export interface Pengusul {
  id_pengusul: number;
  nama_opd: string;
}

// Tipe utama untuk entri HKI, mencerminkan hasil JOIN dari database
export interface HKIEntry {
  id_hki: number;
  nama_hki: string;
  jenis_produk: string | null;
  tahun_fasilitasi: number | null;
  sertifikat_pdf: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string;

  // Foreign Keys
  id_pemohon: number;
  id_jenis_hki: number;
  id_status: number;
  id_pengusul: number;
  
  // Data relasional hasil JOIN (objek)
  pemohon: Pemohon | null;
  jenis_hki: JenisHKI | null;
  status_hki: StatusHKI | null; 
  pengusul: Pengusul | null;
}