import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { APP_NAME, EXTRACTION_LABEL } from '@/lib/brand'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: `${APP_NAME} – Faktury do iDokladu jedním kliknutím`,
  description: `Přetáhni PDF fakturu, ${EXTRACTION_LABEL} navrhne účetní kód. Odešli do iDokladu nebo Fakturoidu jedním kliknutím.`,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
