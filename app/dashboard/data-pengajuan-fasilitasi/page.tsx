// app/dashboard/data-pengajuan-fasilitasi/page.tsx

import { createClient } from '@/utils/supabase/server'
import { HKIClientPage } from './hki-client-page'
import { cookies } from 'next/headers'
import { FormOptions } from '@/lib/types'
import { Database } from '@/lib/database.types'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

// Next.js akan mencoba meregenerasi halaman ini setiap jam (3600 detik).
// Ini adalah strategi caching yang baik untuk data master yang jarang berubah.
export const revalidate = 3600

// Definisikan tipe eksplisit untuk data mentah dari RPC untuk type safety maksimal.
type PengusulOptionRaw = { id_pengusul: number; nama_opd: string };
type KelasOptionRaw = { id_kelas: number; nama_kelas: string; tipe: string };

/**
 * Mengambil semua opsi (untuk filter dan form) dalam satu panggilan RPC.
 * Dibungkus dengan React `cache` untuk memastikan fungsi ini hanya dieksekusi
 * sekali per-request, bahkan jika dipanggil dari beberapa komponen server.
 * Ini adalah optimasi performa kunci di Next.js App Router.
 *
 * @param supabase - Instance Supabase client.
 * @returns {Promise<FormOptions>} Objek berisi semua data opsi yang dibutuhkan.
 */
const getFormOptions = cache(async (supabase: SupabaseClient<Database>): Promise<FormOptions> => {
  const { data, error } = await supabase.rpc('get_all_form_options');

  if (error) {
    console.error('Gagal memuat form options via RPC:', error.message);
    // Melempar error agar bisa ditangkap oleh Error Boundary atau block try-catch di bawah.
    throw new Error(`Gagal mengambil data prasyarat form: ${error.message}`);
  }

  if (!data) {
    throw new Error('RPC "get_all_form_options" tidak mengembalikan data.');
  }

  // Transformasi data mentah dari database menjadi format yang siap pakai untuk komponen UI.
  return {
    jenisOptions: data.jenis_options || [],
    statusOptions: data.status_options || [],
    tahunOptions: data.tahun_options || [],
    pengusulOptions: data.pengusul_options?.map((p: PengusulOptionRaw) => ({
      value: String(p.id_pengusul),
      label: p.nama_opd,
    })) || [],
    kelasOptions: data.kelas_options?.map((k: KelasOptionRaw) => ({
      value: String(k.id_kelas),
      label: `${k.id_kelas} – ${k.nama_kelas} (${k.tipe})`,
    })) || [],
  }
});

/**
 * Komponen Halaman (React Server Component).
 * Bertugas untuk melakukan data fetching di sisi server dan meneruskannya
 * ke komponen klien yang akan menangani semua interaktivitas.
 */
export default async function DataPengajuanPage() {
  const supabase = await createClient();

  let formOptions: FormOptions = {
    jenisOptions: [],
    statusOptions: [],
    tahunOptions: [],
    pengusulOptions: [],
    kelasOptions: [],
  };
  let pageError: string | null = null;

  try {
    // Memanggil fungsi yang sudah di-cache untuk mendapatkan data.
    formOptions = await getFormOptions(supabase);
  } catch (error) {
    console.error('Gagal memuat prasyarat halaman HKI:', error);
    // Menyiapkan pesan error yang akan ditampilkan di komponen klien.
    pageError = error instanceof Error
        ? error.message
        : 'Terjadi kesalahan tidak dikenal saat memuat opsi filter.';
  }
  
  // Me-render komponen klien dan meneruskan data sebagai props.
  // Komponen klien akan menangani semua state, interaksi, dan fetching data dinamis.
  return <HKIClientPage formOptions={formOptions} error={pageError} />;
}