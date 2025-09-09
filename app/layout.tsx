// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; 
import { Toaster } from "@/components/ui/toaster"; // ✅ import toaster

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Data Pengajuan HKI | Dashboard",
  description: "Sistem manajemen data pengajuan HKI - Bappeda Sleman",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-background text-foreground"}>
        {children}
        <Toaster /> 
      </body>
    </html>
  );
}
