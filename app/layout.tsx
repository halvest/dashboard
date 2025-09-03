import './globals.css'
import type { Metadata } from 'next'
import { Inter as FontSans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'HKI Admin Dashboard',
  description: 'Admin dashboard for managing Intellectual Property Rights (HKI) entries',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}