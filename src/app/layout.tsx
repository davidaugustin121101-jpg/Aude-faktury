import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { rootMetadata, viewport } from '@/lib/seo'

const inter = Inter({ subsets: ['latin', 'latin-ext'] })

export const metadata: Metadata = rootMetadata
export { viewport }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster richColors position="top-center" className="sm:!top-right" />
      </body>
    </html>
  )
}
