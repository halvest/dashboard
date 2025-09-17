// app/dashboard/data-pengajuan-fasilitasi/page.tsx

import { createClient } from '@/utils/supabase/server';
import { HKIClientPage } from './hki-client-page';
import { cookies } from 'next/headers';
import { HKIEntry, JenisHKI, StatusHKI } from '@/lib/types';

export const dynamic = 'force-dynamic';

type SelectOption = {
  value: string;
  label: string;
};

// --- PERBAIKAN 1: Sesuaikan tipe data agar konsisten ---
type FormOptions = {
  jenisOptions: JenisHKI[];
  statusOptions: StatusHKI[];
  tahunOptions: { tahun_fasilitasi: number }[];
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
      p_search_text: search,
      p_jenis_id: jenisId ? Number(jenisId) : null,
      p_status_id: statusId ? Number(statusId) : null,
      p_year: year ? Number(year) : null,
      p_pengusul_id: pengusulId ? Number(pengusulId) : null,
    };

    const { data: filterResult, error: rpcError } = await supabase.rpc('search_hki_ids_with_count', rpcParams as any);

    if (rpcError) {
      console.error('Error calling RPC Filter:', rpcError);
      throw new Error('Gagal melakukan pencarian data HKI.');
    }

    const filteredIds = filterResult?.map((r: { result_id: number }) => r.result_id) ?? [];
    const totalCount = filterResult?.[0]?.result_count ?? 0;
    
    const querySelectString = `
      id_hki, nama_hki, jenis_produk, tahun_fasilitasi, sertifikat_pdf, keterangan, created_at,
      pemohon ( id_pemohon, nama_pemohon, alamat ),
      jenis:jenis_hki ( id_jenis_hki, nama_jenis_hki ), 
      status_hki ( id_status, nama_status ),
      pengusul ( id_pengusul, nama_opd ),
      kelas:kelas_hki ( id_kelas, nama_kelas, tipe )
    `;

    // Hanya jalankan query jika ada ID yang cocok, atau jika tidak ada filter sama sekali
    const shouldFetchHki = filteredIds.length > 0 || !search && !jenisId && !statusId && !year && !pengusulId;
    
    let hkiQuery = supabase
      .from('hki')
      .select(querySelectString)
      .order(sortBy, { ascending: sortOrder })
      .range(offset, offset + pageSize - 1);

    if (shouldFetchHki) {
      hkiQuery = hkiQuery.in('id_hki', filteredIds);
    } else {
      // Jika filter aktif dan tidak ada ID yang cocok, tidak perlu query data HKI
      hkiQuery = hkiQuery.limit(0); 
    }
    
    const [hkiRes, jenisRes, statusRes, tahunRes, pengusulRes, kelasRes] = await Promise.all([
      hkiQuery,
      supabase.from('jenis_hki').select('id_jenis_hki, nama_jenis_hki').order('nama_jenis_hki'),
      supabase.from('status_hki').select('id_status, nama_status').order('id_status'),
      supabase.rpc('get_distinct_hki_years'),
      supabase.from('pengusul').select('id_pengusul, nama_opd').order('nama_opd'),
      supabase.from('kelas_hki').select('id_kelas, nama_kelas, tipe').order('id_kelas'),
    ]);
    
    if (hkiRes.error) throw new Error(`Gagal memuat data HKI: ${hkiRes.error.message}`);
    if (jenisRes.error) throw new Error(`Gagal memuat jenis HKI: ${jenisRes.error.message}`);
    if (statusRes.error) throw new Error(`Gagal memuat status HKI: ${statusRes.error.message}`);
    if (tahunRes.error) throw new Error(`Gagal memuat tahun HKI: ${tahunRes.error.message}`);
    if (pengusulRes.error) throw new Error(`Gagal memuat data pengusul: ${pengusulRes.error.message}`);
    if (kelasRes.error) throw new Error(`Gagal memuat data kelas HKI: ${kelasRes.error.message}`);

    const tahunOptionsData = (tahunRes.data as { tahun_fasilitasi: number }[] | null) ?? [];

    const formOptions: FormOptions = {
      jenisOptions: jenisRes.data ?? [],
      statusOptions: statusRes.data ?? [],
      // --- PERBAIKAN 2: Hapus transformasi .map dan gunakan data asli ---
      tahunOptions: tahunOptionsData,
      pengusulOptions: (pengusulRes.data || []).map(p => ({
        value: String(p.id_pengusul),
        label: p.nama_opd,
      })),
      kelasOptions: (kelasRes.data || []).map(k => ({
        value: String(k.id_kelas),
        label: `${k.id_kelas} – ${k.nama_kelas} (${k.tipe})`,
      })),
    };

    return (
      <HKIClientPage
        initialData={shouldFetchHki ? (hkiRes.data as HKIEntry[]) ?? [] : []}
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