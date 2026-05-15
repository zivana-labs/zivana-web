import Sidebar from '@/components/portal/Sidebar'
import AdminSwitchButton from '@/components/portal/AdminSwitchButton'
import PortalAuthGate from '@/components/portal/PortalAuthGate'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PortalAuthGate>
      <div className="min-h-screen bg-void">
        <Sidebar />
        <AdminSwitchButton />
        <main className="lg:ml-[240px] pt-[60px] lg:pt-0 min-h-screen">
          {children}
        </main>
      </div>
    </PortalAuthGate>
  )
}