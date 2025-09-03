import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/auth'

// Fungsi GET dan DELETE tidak perlu diubah

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    
    const supabase = createServiceClient()
    const formData = await request.formData()
    
    const { data: existingEntry, error: fetchError } = await supabase
      .from('hki_entries')
      .select('sertifikat_path')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const data = {
      nama_hki: formData.get('nama_hki') as string,
      jenis_hki: formData.get('jenis_hki') as string,
      nama_pemohon: formData.get('nama_pemohon') as string,
      alamat: formData.get('alamat') as string || null,
      jenis_produk: formData.get('jenis_produk') as string || null,
      pengusul: formData.get('pengusul') as string || null,
      nomor_permohonan: formData.get('nomor_permohonan') as string,
      tanggal_permohonan: formData.get('tanggal_permohonan') as string,
      status: formData.get('status') as string,
      fasilitasi_tahun: parseInt(formData.get('fasilitasi_tahun') as string),
      keterangan: formData.get('keterangan') as string || null,
    }

    let sertifikat_path = existingEntry.sertifikat_path

    const file = formData.get('file') as File
    if (file && file.size > 0) {
      if (existingEntry.sertifikat_path) {
        await supabase.storage
          .from('sertifikat')
          .remove([existingEntry.sertifikat_path])
      }
      const fileExt = file.name.split('.').pop()
      const fileName = `hki/${crypto.randomUUID()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('sertifikat')
        .upload(fileName, file)
      if (uploadError) {
        return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
      }
      sertifikat_path = fileName
    }

    const { data: updatedEntry, error: updateError } = await supabase
      .from('hki_entries')
      .update({ ...data, sertifikat_path })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ 
        error: updateError.message.includes('duplicate key') 
          ? 'Nama HKI sudah terdaftar' 
          : updateError.message 
      }, { status: 400 })
    }

    return NextResponse.json({ data: updatedEntry })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}