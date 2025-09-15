// app/dashboard/users/page.tsx
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UserManagementClient } from './user-management-client';
import { ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getUsersData(supabase: any) {
  // Ambil semua user dari 'auth.users'
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error("Gagal mengambil daftar pengguna:", usersError);
    throw new Error('Tidak dapat memuat daftar pengguna.');
  }

  // Ambil semua profil dari tabel 'profiles'
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, role, full_name');
  if (profilesError) {
    console.error("Gagal mengambil profil:", profilesError);
    throw new Error('Tidak dapat memuat data profil pengguna.');
  }

  // Gabungkan data user dengan profil mereka
  const combinedUsers = users.map(user => {
    const profile = profiles?.find(p => p.id === user.id);
    return {
      ...user,
      role: profile?.role || 'user',
      full_name: profile?.full_name || 'Tanpa Nama',
    };
  });

  return combinedUsers;
}

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-destructive bg-red-50 p-12 text-center dark:bg-red-950/30">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-xl font-semibold tracking-tight text-destructive">
            Terjadi Kesalahan
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
);


export default async function UserManagementPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Guard: Pastikan hanya admin yang bisa mengakses
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    redirect('/dashboard?error=Akses_Ditolak');
  }
  
  try {
    const users = await getUsersData(supabase);
    // Filter agar super-admin tidak bisa diedit oleh admin lain
    const filteredUsers = users.filter(u => u.email !== process.env.SUPER_ADMIN_EMAIL);
    const currentUserIsSuperAdmin = user.email === process.env.SUPER_ADMIN_EMAIL;


    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Manajemen Pengguna
          </h1>
          <p className="mt-1 text-muted-foreground">
            Kelola akun administrator yang dapat mengakses dashboard ini.
          </p>
        </div>
        
        <UserManagementClient 
            initialUsers={filteredUsers} 
            currentUserIsSuperAdmin={currentUserIsSuperAdmin}
        />
      </div>
    );
  } catch (error) {
     return <ErrorDisplay message={error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui."} />;
  }
}