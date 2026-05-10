import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-void">
      <AdminSidebar />
      <main className="lg:ml-[240px] pt-[60px] lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}