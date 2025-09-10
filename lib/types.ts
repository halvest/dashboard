// lib/types.ts

export interface Pemohon {
  id_pemohon: number;
  nama_pemohon: string;
  alamat?: string | null;
}

export interface JenisHKI {
  id_jenis: number;
  nama_jenis: string;
}

export interface StatusHKI {
  id_status: number;
  nama_status: string;
}

export interface Pengusul {
  id_pengusul: number;
  nama_pengusul: string; // Ini adalah alias 'nama_opd' dari query Anda
}

// ✅ TAMBAH: Interface baru untuk Kelas HKI
export interface KelasHKI {
  id_kelas: number;
  nama_kelas: string;
  tipe: string;
}

export interface HKIBase {
  id_hki: number;
  nama_hki: string;
  jenis_produk: string | null;
  tahun_fasilitasi: number | null;
  sertifikat_pdf: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string | null; 
  // user_id: string | null; // Kolom ini tidak ada di skema Anda

  id_pemohon: number;
  id_jenis_hki: number;
  id_status: number;
  id_pengusul: number;
  id_kelas: number | null; // ✅ TAMBAH: Kolom foreign key baru
}

// ✅ UPDATE: Perbarui HKIEntry untuk menyertakan relasi kelas
export type HKIEntry = Omit<HKIBase, 'id_pemohon' | 'id_jenis_hki' | 'id_status' | 'id_pengusul' | 'id_kelas'> & {
  pemohon: Pemohon | null;
  jenis: JenisHKI | null; 
  status_hki: StatusHKI | null; 
  pengusul: Pengusul | null;
  kelas: KelasHKI | null; // ✅ TAMBAH: Relasi objek baru
};