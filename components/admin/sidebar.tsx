"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Folder,
  ShoppingCart,
  Settings,
  MessageSquare,
  BookOpen,
  Star,
  Percent,
} from "lucide-react"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/categories", label: "Categories", icon: Folder },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/sales", label: "Sales", icon: Percent },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/blog", label: "Blog", icon: BookOpen },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#121213] border-r border-[#1A1A1B] min-h-[calc(100vh-73px)] p-4">
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-[#BDBDBD] hover:bg-[#1A1A1B] hover:text-[#F7F7F7]"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

