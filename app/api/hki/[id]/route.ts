import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/auth'

// Handle PATCH request to update an HKI entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    
    const supabase = createServiceClient()
    const formData = await request.formData()
    
    // 1. Fetch existing entry
    const { data: existingEntry, error: fetchError } = await supabase
      .from('hki_entries')
      .select('sertifikat_path, pemohon:pemohon_id(id, nama)')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Entri tidak ditemukan' }, { status: 404 })
    }

    // 2. Handle Pemohon: Upsert (update or insert)
    const namaPemohon = formData.get('nama_pemohon') as string
    const alamatPemohon = (formData.get('alamat') as string) || null

    const { data: pemohon, error: pemohonError } = await supabase
      .from('pemohon')
      .upsert({ id: existingEntry.pemohon?.id, nama: namaPemohon, alamat: alamatPemohon }, { onConflict: 'nama', ignoreDuplicates: false })
      .select('id')
      .single()

    if (pemohonError || !pemohon) {
      console.error('Pemohon error:', pemohonError)
      return NextResponse.json({ error: 'Gagal memproses data pemohon.' }, { status: 400 })
    }

    // 3. Handle File Upload (if new file is provided)
    let sertifikat_path = existingEntry.sertifikat_path
    const file = formData.get('file') as File | null

    if (file && file.size > 0) {
      // Remove old file if it exists
      if (existingEntry.sertifikat_path) {
        await supabase.storage
          .from('sertifikat')
          .remove([existingEntry.sertifikat_path])
      }
      // Upload new file
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

    // 4. Prepare HKI Entry Data for Update
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

    // 5. Update HKI Entry in the database
    const { data: updatedEntry, error: updateError } = await supabase
      .from('hki_entries')
      .update(hkiData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ 
        error: updateError.message.includes('duplicate key') 
          ? 'Nama HKI sudah terdaftar' 
          : updateError.message 
      }, { status: 400 })
    }

    return NextResponse.json({ data: updatedEntry })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}


// Handle DELETE request to remove an HKI entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const supabase = createServiceClient()

    // Find the entry to get the certificate path
    const { data: entry, error: findError } = await supabase
      .from('hki_entries')
      .select('sertifikat_path')
      .eq('id', params.id)
      .single()

    if (findError) {
      return NextResponse.json({ error: 'Entri tidak ditemukan.' }, { status: 404 })
    }

    // If a certificate exists, delete it from storage
    if (entry.sertifikat_path) {
      const { error: storageError } = await supabase.storage
        .from('sertifikat')
        .remove([entry.sertifikat_path])
      
      if (storageError) {
        console.error("Storage deletion error:", storageError)
        // Non-fatal, we can still proceed to delete the DB record
      }
    }

    // Delete the entry from the database
    const { error: deleteError } = await supabase
      .from('hki_entries')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Entri berhasil dihapus.' }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 })
  }
}