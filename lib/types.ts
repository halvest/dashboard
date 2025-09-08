// lib/types.ts

// Tipe dasar untuk tabel relasi (ini sudah bagus)
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


// PERBAIKAN 1: Buat tipe dasar untuk tabel 'hki'
// Ini merepresentasikan satu baris data mentah dari tabel hki tanpa join.
export interface HKIBase {
  id_hki: number;
  nama_hki: string;
  jenis_produk: string | null;
  tahun_fasilitasi: number | null;
  sertifikat_pdf: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string | null; // Bisa null saat baru dibuat
  user_id: string | null; // uuid adalah string

  // Kunci Asing (Foreign Keys)
  id_pemohon: number;
  id_jenis_hki: number;
  id_status: number;
  id_pengusul: number;
}


// PERBAIKAN 2: Buat tipe gabungan untuk data HKI beserta relasinya
// Tipe ini lebih akurat, menghilangkan redundansi foreign key di level atas.
export type HKIEntry = Omit<HKIBase, 'id_pemohon' | 'id_jenis_hki' | 'id_status' | 'id_pengusul'> & {
  pemohon: Pemohon | null;
  jenis_hki: JenisHKI | null;
  status_hki: StatusHKI | null; 
  pengusul: Pengusul | null;
};