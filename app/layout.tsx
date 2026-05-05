import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/nav/Nav'
import Footer from '@/components/footer/Footer'

export const metadata: Metadata = {
  title: 'Zivana Protocol — Trust Infrastructure for the African Informal Economy',
  description: 'An open Layer 2 protocol on Cardano and Midnight that makes economic capability visible, verifiable, and financeable without requiring informal actors to become formal first.',
  keywords: ['Zivana', 'Cardano', 'Midnight', 'blockchain', 'Africa', 'trust', 'informal economy'],
  
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'Zivana Protocol',
    description: 'Trust Infrastructure for the African Informal Economy',
    url: 'https://zivana.network',
    siteName: 'Zivana Protocol',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zivana Protocol',
    description: 'Trust Infrastructure for the African Informal Economy',
  },
  metadataBase: new URL('https://zivana.network'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-void text-light antialiased">
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}