export interface HKIEntry {
  id: string
  nama_hki: string
  jenis_hki: 'Merek' | 'Hak Cipta' | 'Paten' | 'Paten Sederhana' | 'Indikasi Geografis'
  nama_pemohon: string
  nomor_permohonan: string
  tanggal_permohonan: string
  status: 'Diterima' | 'Didaftar' | 'Ditolak' | 'Dalam Proses'
  fasilitasi_tahun: number
  sertifikat_path?: string
  keterangan?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

export const JENIS_HKI_OPTIONS = [
  'Merek',
  'Hak Cipta', 
  'Paten',
  'Paten Sederhana',
  'Indikasi Geografis'
] as const

export const STATUS_OPTIONS = [
  'Diterima',
  'Didaftar',
  'Ditolak',
  'Dalam Proses'
] as const