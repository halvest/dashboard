import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    const search = searchParams.get('search') || ''
    const jenis = searchParams.get('jenis') || ''
    const status = searchParams.get('status') || ''
    const year = searchParams.get('year') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = 10

    let query = supabase
      .from('hki_entries')
      .select('*', { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`nama_hki.ilike.%${search}%,nama_pemohon.ilike.%${search}%`)
    }
    
    if (jenis) {
      query = query.eq('jenis_hki', jenis)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (year) {
      query = query.eq('fasilitasi_tahun', parseInt(year))
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    const { data, count, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, count })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    
    const supabase = createServiceClient()
    const formData = await request.formData()
    
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

    let sertifikat_path = null

    // Handle file upload
    const file = formData.get('file') as File
    if (file && file.size > 0) {
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

    // Insert into database
    const { data: newEntry, error: dbError } = await supabase
      .from('hki_entries')
      .insert({ ...data, sertifikat_path })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      if (sertifikat_path) {
        await supabase.storage.from('sertifikat').remove([sertifikat_path])
      }
      
      return NextResponse.json({ 
        error: dbError.message.includes('duplicate key') 
          ? 'Nama HKI sudah terdaftar' 
          : dbError.message 
      }, { status: 400 })
    }

    return NextResponse.json({ data: newEntry }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}