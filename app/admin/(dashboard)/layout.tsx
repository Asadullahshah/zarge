import { requireAuth } from "@/lib/auth-helpers"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"
import { MobileNavProvider } from "@/components/admin/mobile-nav-context"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()

  return (
    <div className="min-h-screen admin-layout">
      <MobileNavProvider>
        <AdminHeader />
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </MobileNavProvider>
    </div>
  )
}

