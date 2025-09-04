'use client';

import React from 'react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto p-4 text-center md:px-6 2xl:px-10">
      <div className="border-t border-gray-200 dark:border-slate-800 pt-4">
        <p className="text-sm text-gray-500 dark:text-slate-400">
          &copy; {currentYear} Bappeda Sleman. Hak Cipta Dilindungi.
        </p>
      </div>
    </footer>
  );
};