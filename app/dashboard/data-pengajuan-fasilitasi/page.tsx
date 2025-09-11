// app/dashboard/data-pengajuan-fasilitasi/page.tsx

import { createClient } from '@/utils/supabase/server';
import { HKIClientPage } from './hki-client-page';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

type HKI = {
  id_hki: number;
  nama_hki: string;
  jenis_produk: string;
  tahun_fasilitasi: number;
  sertifikat_pdf: string | null;
  keterangan: string | null;
  created_at: string;
  pemohon: {
    id_pemohon: number;
    nama_pemohon: string;
    alamat: string;
  } | null;
  jenis: {
    id_jenis: number;
    nama_jenis: string;
  } | null;
  status_hki: {
    id_status: number;
    nama_status: string;
  } | null;
  pengusul: {
    id_pengusul: number;
    nama_pengusul: string; 
  } | null;
  kelas: {
    id_kelas: number;
    nama_kelas: string;
    tipe: string;
  } | null;
};

type SelectOption = {
  value: string;
  label: string;
};

type FormOptions = {
  jenisOptions: { id_jenis: number; nama_jenis: string }[];
  statusOptions: { id_status: number; nama_status: string }[];
  tahunOptions: number[];
  pengusulOptions: SelectOption[];
  kelasOptions: SelectOption[];
};

export default async function HKIPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const search = typeof searchParams.search === 'string' ? searchParams.search.trim() : '';
    const page = typeof searchParams.page === 'string' ? Math.max(1, parseInt(searchParams.page, 10)) : 1;
    const pageSize = typeof searchParams.pageSize === 'string' ? parseInt(searchParams.pageSize, 10) : 10;
    const jenisId = typeof searchParams.jenisId === 'string' ? searchParams.jenisId : '';
    const statusId = typeof searchParams.statusId === 'string' ? searchParams.statusId : '';
    const year = typeof searchParams.year === 'string' ? searchParams.year : '';
    const pengusulId = typeof searchParams.pengusulId === 'string' ? searchParams.pengusulId : '';
    
    const allowedSortFields = ['created_at', 'nama_hki', 'tahun_fasilitasi'];
    const sortBy = typeof searchParams.sortBy === 'string' && allowedSortFields.includes(searchParams.sortBy)
      ? searchParams.sortBy
      : 'created_at';
    const sortOrder = searchParams.sortOrder === 'asc';
    const offset = (page - 1) * pageSize;

    const rpcParams = {
      p_search_text: search || null,
      p_jenis_id: jenisId ? Number(jenisId) : null,
      p_status_id: statusId ? Number(statusId) : null,
      p_year: year ? Number(year) : null,
      p_pengusul_id: pengusulId ? Number(pengusulId) : null,
    };

    const { data: filterResult, error: rpcError } = await supabase.rpc('search_hki_ids_with_count', rpcParams);

    if (rpcError) {
      console.error('Error saat memanggil RPC Filter:', rpcError);
      throw new Error('Gagal melakukan pencarian data HKI.');
    }

    const filteredIds = filterResult?.map((r: { result_id: number }) => r.result_id) ?? [];
    const totalCount = filterResult?.[0]?.result_count ?? 0;

    const querySelectString = `
      id_hki, nama_hki, jenis_produk, tahun_fasilitasi, sertifikat_pdf, keterangan, created_at,
      pemohon ( id_pemohon, nama_pemohon, alamat ),
      jenis:jenis_hki ( id_jenis:id_jenis_hki, nama_jenis:nama_jenis_hki ), 
      status_hki ( id_status, nama_status ),
      pengusul ( id_pengusul, nama_pengusul:nama_opd ),
      kelas:kelas_hki ( id_kelas, nama_kelas, tipe )
    `;

    const hkiQuery = supabase
      .from('hki')
      .select(querySelectString)
      .in('id_hki', filteredIds)
      .order(sortBy, { ascending: sortOrder })
      .range(offset, offset + pageSize - 1);

    const [hkiRes, jenisRes, statusRes, tahunRes, pengusulRes, kelasRes] = await Promise.all([
      hkiQuery, 
      supabase.from('jenis_hki').select('id_jenis:id_jenis_hki, nama_jenis:nama_jenis_hki').order('nama_jenis_hki'),
      supabase.from('status_hki').select('id_status, nama_status').order('nama_status'),
      supabase.rpc('get_distinct_hki_years'),
      supabase.from('pengusul').select('id_pengusul, nama_pengusul:nama_opd').order('nama_opd'),
      supabase.from('kelas_hki').select('id_kelas, nama_kelas, tipe').order('id_kelas'),
    ]);
    
    if (hkiRes.error) throw new Error(`Gagal memuat data HKI: ${hkiRes.error.message}`);
    if (jenisRes.error) throw new Error(`Gagal memuat jenis HKI: ${jenisRes.error.message}`);
    if (statusRes.error) throw new Error(`Gagal memuat status HKI: ${statusRes.error.message}`);
    if (tahunRes.error) throw new Error(`Gagal memuat tahun HKI: ${tahunRes.error.message}`);
    if (pengusulRes.error) throw new Error(`Gagal memuat data pengusul: ${pengusulRes.error.message}`);
    if (kelasRes.error) throw new Error(`Gagal memuat data kelas HKI: ${kelasRes.error.message}`);

    const formOptions: FormOptions = {
      jenisOptions: jenisRes.data ?? [],
      statusOptions: statusRes.data ?? [],
      tahunOptions: (tahunRes.data as number[] | null) ?? [],
      pengusulOptions: (pengusulRes.data || []).map(p => ({
        value: String(p.id_pengusul),
        label: p.nama_pengusul, 
      })),
      kelasOptions: (kelasRes.data || []).map(k => ({
        value: String(k.id_kelas),
        label: `${k.id_kelas} – ${k.nama_kelas} (${k.tipe})`,
      })),
    };

    return (
      <HKIClientPage
        initialData={(hkiRes.data as HKI[]) ?? []}
        totalCount={totalCount}
        formOptions={formOptions}
        error={null} 
      />
    );

  } catch (error) {
    console.error("Terjadi kesalahan fatal pada halaman HKI:", error);
    return (
      <HKIClientPage
        initialData={[]}
        totalCount={0}
        formOptions={{
          jenisOptions: [],
          statusOptions: [],
          tahunOptions: [],
          pengusulOptions: [],
          kelasOptions: [],
        }}
        error={error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui."}
      />
    );
  }
}