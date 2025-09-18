// components/layout/footer.tsx
'use client'

import React from 'react'
interface FooterProps {
  companyName?: string
}

/**

 * @param companyName Nama perusahaan/organisasi. Default: "Bappeda Sleman".
 */
export function Footer({ companyName = 'Bappeda Sleman' }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full shrink-0 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-gray-900 px-4 py-4 text-center md:px-6 2xl:px-10">
      <p className="text-sm text-gray-500 dark:text-slate-400">
        &copy; {currentYear} {companyName}. Hak Cipta Dilindungi.
      </p>
    </footer>
  )
}
