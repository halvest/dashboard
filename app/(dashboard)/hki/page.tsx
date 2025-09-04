// app/(dashboard)/hki/page.tsx

import { createClient } from '@/lib/supabase-server';
import { HKIClientPage } from './hki-client';

export const dynamic = "force-dynamic";

export default async function HKIPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient();

  // --- Membaca semua parameter dari URL ---
  const search = typeof searchParams.search === 'string' ? searchParams.search.trim() : '';
  const page = typeof searchParams.page === 'string' ? Math.max(1, parseInt(searchParams.page, 10)) : 1;
  const pageSize = typeof searchParams.pageSize === 'string' ? parseInt(searchParams.pageSize, 10) : 10;
  
  // Parameter filter & sort
  const jenisId = typeof searchParams.jenisId === 'string' ? searchParams.jenisId : '';
  const statusId = typeof searchParams.statusId === 'string' ? searchParams.statusId : '';
  const year = typeof searchParams.year === 'string' ? searchParams.year : '';
  const sortBy = typeof searchParams.sortBy === 'string' ? searchParams.sortBy : 'created_at';
  const sortOrder = typeof searchParams.sortOrder === 'string' ? searchParams.sortOrder : 'desc';

  // --- Membangun Query ke Supabase ---
  const query = supabase
    .from('hki')
    .select(`
      id_hki, nama_hki, jenis_produk, tahun_fasilitasi, sertifikat_pdf, keterangan, created_at,
      pemohon ( id_pemohon, nama_pemohon, alamat ),
      jenis_hki ( id_jenis_hki, nama_jenis_hki ),
      status_hki ( id_status, nama_status ),
      pengusul ( id_pengusul, nama_opd )
    `, { count: 'exact' });

  // Menerapkan filter pencarian
  if (search) {
    query.or(`nama_hki.ilike.%${search}%,pemohon.nama_pemohon.ilike.%${search}%`);
  }

  // Menerapkan filter dropdown
  if (jenisId) query.eq('id_jenis_hki', jenisId);
  if (statusId) query.eq('id_status', statusId);
  if (year) query.eq('tahun_fasilitasi', year);
  
  // Menerapkan sorting & paginasi
  query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  // --- Mengambil Data & Opsi Form Secara Paralel ---
  const [
    { data: hkiEntries, count, error },
    { data: jenisOptions },
    { data: statusOptions },
    { data: tahunOptionsData },
    { data: pengusulOptions },
  ] = await Promise.all([
    query,
    supabase.from('jenis_hki').select('*').order('nama_jenis_hki'),
    supabase.from('status_hki').select('*').order('nama_status'),
    supabase.rpc('get_distinct_fasilitasi_tahun'), // Memanggil fungsi DB
    supabase.from('pengusul').select('*').order('nama_opd'),
  ]);

  if (error) {
    console.error('Error fetching HKI list:', error);
  }
  
  const tahunOptions = tahunOptionsData?.map(item => ({ tahun: item.tahun })) ?? [];

  return (
    <HKIClientPage
      initialData={hkiEntries ?? []}
      totalCount={count ?? 0}
      formOptions={{
        jenisOptions: jenisOptions ?? [],
        statusOptions: statusOptions ?? [],
        tahunOptions: tahunOptions,
        pengusulOptions: pengusulOptions ?? [],
      }}
    />
  );
}