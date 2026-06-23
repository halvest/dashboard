// app/api/users/profile/route.ts
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: { message: 'Tidak terautentikasi.' } }, { status: 401 })
    }

    const { full_name, password } = await request.json()
    
    const updateData: {
      data: { full_name: string };
      password?: string;
    } = {
      data: { full_name },
    };

    if (password && password.length >= 6) {
      updateData.password = password;
    }
    
    const { error } = await supabase.auth.updateUser(updateData);

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ message: 'Profil berhasil diperbarui.' })

  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Terjadi kesalahan pada server.' } },
      { status: 500 }
    )
  }
}