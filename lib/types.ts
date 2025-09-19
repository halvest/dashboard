// lib/types.ts

export interface Pemohon {
  id_pemohon: number
  nama_pemohon: string
  alamat?: string | null
}

export interface JenisHKI {
  id_jenis_hki: number
  nama_jenis_hki: string
}

export interface StatusHKI {
  id_status: number
  nama_status: string
}

export interface Pengusul {
  id_pengusul: number
  nama_opd: string
}

export interface KelasHKI {
  id_kelas: number
  nama_kelas: string
  tipe: string
}

// Tipe entri HKI yang digabungkan (relasional)
export interface HKIEntry {
  id_hki: number
  nama_hki: string
  jenis_produk: string | null
  tahun_fasilitasi: number | null
  sertifikat_pdf: string | null
  keterangan: string | null
  created_at: string
  pemohon: Pemohon | null
  jenis: JenisHKI | null
  status_hki: StatusHKI | null
  pengusul: Pengusul | null
  kelas: KelasHKI | null
}

// Tipe data untuk pengguna yang digabungkan dari auth.users dan public.profiles
export type UserProfile = {
  id: string
  email?: string
  full_name: string
  role: 'admin' | 'user'
  created_at: string
}

// Tipe untuk opsi combobox/select yang sering digunakan
export type SelectOption = {
  value: string
  label: string
}

// Tipe untuk opsi form yang dikirim ke komponen klien
export type FormOptions = {
  jenisOptions: JenisHKI[]
  statusOptions: StatusHKI[]
  tahunOptions: { tahun: number }[]
  pengusulOptions: SelectOption[]
  kelasOptions: SelectOption[]
}