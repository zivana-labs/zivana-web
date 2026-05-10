'use client'

import { usePathname } from 'next/navigation'
import Nav from '@/components/nav/Nav'
import Footer from '@/components/footer/Footer'

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isDashboard = pathname.startsWith('/contribute/dashboard') || pathname.startsWith('/admin')

  if (isDashboard) {
    return <>{children}</>
  }

  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  )
}