// app/page.tsx

import { redirect } from 'next/navigation';

/**
 * Halaman root ini tidak menampilkan UI.
 * Tugas utamanya adalah mengarahkan pengguna ke halaman dashboard utama.
 */
export default function RootPage() {
  redirect('/dashboard');
}