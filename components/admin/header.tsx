import { signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export async function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur border-b border-[#e9eaee] px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="font-serif text-lg font-bold text-gray-900">Zargé</span>
        <span className="border-l border-gray-200 pl-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          Admin
        </span>
      </div>
      <form
        action={async () => {
          "use server"
          await signOut({ redirectTo: "/admin/login" })
        }}
      >
        <Button type="submit" variant="outline" size="sm">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </form>
    </header>
  )
}
