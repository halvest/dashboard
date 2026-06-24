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
type KelasOptionRaw = { id_kelas: number; nomor_kelas: number; nama_kelas: string; tipe: string; is_active: boolean };

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
  try {
    const [
      { data: jenisData, error: jenisError },
      { data: statusData, error: statusError },
      { data: pengusulData, error: pengusulError },
      { data: kelasData, error: kelasError },
      { data: rpcData, error: rpcError } // still fetch for tahun_options
    ] = await Promise.all([
      supabase.from('jenis_hki').select('id_jenis_hki, nama_jenis_hki, is_active').order('id_jenis_hki'),
      supabase.from('status_hki').select('id_status, nama_status').order('id_status'),
      supabase.from('pengusul').select('id_pengusul, nama_opd').order('nama_opd'),
      supabase.from('kelas_hki').select('id_kelas, nomor_kelas, nama_kelas, tipe, is_active').order('nomor_kelas'),
      supabase.rpc('get_all_form_options')
    ]);

    if (jenisError) throw jenisError;
    if (statusError) throw statusError;
    if (pengusulError) throw pengusulError;
    if (kelasError) throw kelasError;

    return {
      jenisOptions: jenisData || [],
      statusOptions: statusData || [],
      tahunOptions: rpcData?.tahun_options || [],
      pengusulOptions: pengusulData?.map((p) => ({
        value: String(p.id_pengusul),
        label: p.nama_opd,
      })) || [],
      kelasOptions: kelasData?.map((k) => ({
        value: String(k.id_kelas),
        label: `Kelas ${k.nomor_kelas} (${k.tipe}) - "${k.nama_kelas}"`,
        is_active: k.is_active,
        nomor_kelas: k.nomor_kelas
      })) || [],
    }
  } catch (error: any) {
    console.error('Gagal memuat form options:', error.message);
    throw new Error(`Gagal mengambil data prasyarat form: ${error.message}`);
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