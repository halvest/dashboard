import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/auth'
import { HKIEntry, Pemohon } from '@/lib/types'

// Handle POST request to create a new HKI entry
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    
    const supabase = createServiceClient()
    const formData = await request.formData()

    // 1. Handle Pemohon: Upsert (update or insert)
    const namaPemohon = formData.get('nama_pemohon') as string
    const alamatPemohon = (formData.get('alamat') as string) || null

    const { data: pemohon, error: pemohonError } = await supabase
      .from('pemohon')
      .upsert({ nama: namaPemohon, alamat: alamatPemohon }, { onConflict: 'nama', ignoreDuplicates: false })
      .select('id')
      .single()

    if (pemohonError || !pemohon) {
      console.error('Pemohon error:', pemohonError)
      return NextResponse.json({ error: 'Gagal memproses data pemohon.' }, { status: 400 })
    }

    // 2. Handle File Upload
    let sertifikat_path: string | null = null
    const file = formData.get('file') as File | null
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop()
      const fileName = `hki/${crypto.randomUUID()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('sertifikat')
        .upload(fileName, file)
      
      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json({ error: 'Gagal mengunggah file.' }, { status: 500 })
      }
      sertifikat_path = fileName
    }

    // 3. Prepare HKI Entry Data
    const hkiData = {
      nama_hki: formData.get('nama_hki') as string,
      pemohon_id: pemohon.id,
      jenis_hki_id: parseInt(formData.get('jenis_hki_id') as string),
      status_hki_id: parseInt(formData.get('status_hki_id') as string),
      fasilitasi_tahun_id: parseInt(formData.get('fasilitasi_tahun_id') as string),
      pengusul_id: formData.get('pengusul_id') ? parseInt(formData.get('pengusul_id') as string) : null,
      nomor_permohonan: (formData.get('nomor_permohonan') as string) || null,
      tanggal_permohonan: (formData.get('tanggal_permohonan') as string) || null,
      jenis_produk: (formData.get('jenis_produk') as string) || null,
      keterangan: (formData.get('keterangan') as string) || null,
      sertifikat_path,
    }

    // 4. Insert HKI Entry
    const { data: newEntry, error: insertError } = await supabase
      .from('hki_entries')
      .insert(hkiData)
      .select()
      .single()

    if (insertError) {
       console.error('Insert error:', insertError)
       return NextResponse.json({ 
         error: insertError.message.includes('duplicate key') 
           ? 'Nama HKI sudah terdaftar' 
           : insertError.message 
       }, { status: 400 })
    }

    return NextResponse.json({ data: newEntry }, { status: 201 })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}