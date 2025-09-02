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
    
    // Get entry with certificate path
    const { data: entry, error: fetchError } = await supabase
      .from('hki_entries')
      .select('sertifikat_path')
      .eq('id', params.id)
      .single()

    if (fetchError || !entry?.sertifikat_path) {
      return NextResponse.json({ error: 'Certificate file not found' }, { status: 404 })
    }

    // Generate signed URL (valid for 5 minutes)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('sertifikat')
      .createSignedUrl(entry.sertifikat_path, 300) // 5 minutes

    if (urlError) {
      return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
    }

    return NextResponse.json({ signedUrl: signedUrlData.signedUrl })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}