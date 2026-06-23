// app/api/hki/[id]/status/route.ts

import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeAdmin, AuthError } from '@/lib/auth/server' // ✅ Impor sekarang akan berhasil

export const dynamic = 'force-dynamic'

const updateStatusSchema = z.object({
  id: z.coerce.number().int().positive('ID HKI harus berupa angka positif.'),
  statusId: z
    .number({ required_error: 'ID Status wajib diisi.' })
    .int()
    .positive('ID Status harus angka positif.'),
})

function apiError(message: string, status: number, errors?: object) {
  return NextResponse.json({ message, errors }, { status })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const supabase = await createClient()

    // Otorisasi admin sekarang ditangani oleh satu fungsi helper.
    await authorizeAdmin(supabase)

    const body = await request.json()
    const validationResult = updateStatusSchema.safeParse({
      id: rawId,
      statusId: body.statusId,
    })

    if (!validationResult.success) {
      return apiError('Input tidak valid.', 400, validationResult.error.flatten().fieldErrors)
    }
    const { id: hkiId, statusId } = validationResult.data

    const { data: updatedData, error: updateError } = await supabase
      .from('hki')
      .update({
        id_status: statusId,
        updated_at: new Date().toISOString(),
      })
      .eq('id_hki', hkiId)
      .select('id_hki, status_hki(nama_status)')
      .single()

    if (updateError) {
      console.error('Supabase PATCH Status Error:', updateError)
      if (updateError.code === 'PGRST116') {
        return apiError(`Data HKI dengan ID ${hkiId} tidak ditemukan.`, 404)
      }
      return apiError('Gagal memperbarui data di database.', 500)
    }

    return NextResponse.json({
      success: true,
      message: `Status berhasil diperbarui ke "${updatedData.status_hki?.nama_status || 'status baru'}"`,
      data: updatedData,
    })
  } catch (err: any) {
    console.error('[API HKI STATUS PATCH] Error:', err)
    if (err instanceof AuthError) {
      // Menangkap error spesifik dari helper otorisasi
      return apiError(err.message, err.message.includes('terautentikasi') ? 401 : 403)
    }
    if (err instanceof z.ZodError) {
      return apiError('Input tidak valid.', 400, err.flatten().fieldErrors)
    }
    if (err instanceof SyntaxError) {
      return apiError('Request body tidak valid (bukan JSON).', 400)
    }
    return apiError('Terjadi kesalahan pada server.', 500)
  }
}