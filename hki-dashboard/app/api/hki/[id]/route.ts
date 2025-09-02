import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('hki_entries')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    
    const supabase = createServiceClient()
    const formData = await request.formData()
    
    // Get existing entry
    const { data: existingEntry, error: fetchError } = await supabase
      .from('hki_entries')
      .select('sertifikat_path')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Extract form data
    const data = {
      nama_hki: formData.get('nama_hki') as string,
      jenis_hki: formData.get('jenis_hki') as string,
      nama_pemohon: formData.get('nama_pemohon') as string,
      nomor_permohonan: formData.get('nomor_permohonan') as string,
      tanggal_permohonan: formData.get('tanggal_permohonan') as string,
      status: formData.get('status') as string,
      fasilitasi_tahun: parseInt(formData.get('fasilitasi_tahun') as string),
      keterangan: formData.get('keterangan') as string || null,
    }

    let sertifikat_path = existingEntry.sertifikat_path

    // Handle file upload
    const file = formData.get('file') as File
    if (file && file.size > 0) {
      // Delete old file if exists
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
        return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
      }

      sertifikat_path = fileName
    }

    // Update database
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    
    const supabase = createServiceClient()
    
    // Get entry to delete file
    const { data: entry, error: fetchError } = await supabase
      .from('hki_entries')
      .select('sertifikat_path')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Delete file if exists
    if (entry.sertifikat_path) {
      await supabase.storage
        .from('sertifikat')
        .remove([entry.sertifikat_path])
    }

    // Delete database entry
    const { error: deleteError } = await supabase
      .from('hki_entries')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Entry deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}