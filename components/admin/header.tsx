import { signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export async function AdminHeader() {
  return (
    <header className="bg-[#121213] border-b border-[#1A1A1B] px-8 py-4 flex justify-between items-center">
      <h1 className="text-xl font-serif font-bold">House of Noire Admin</h1>
      <form
        action={async () => {
          "use server"
          await signOut({ redirectTo: "/admin/login" })
        }}
      >
        <Button type="submit" variant="ghost" size="sm">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </form>
    </header>
  )
}

