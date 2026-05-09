import Sidebar from '@/components/portal/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-void">
      <Sidebar />
      <main className="lg:ml-[240px] pt-[60px] lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
