"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useMobileNav } from "./mobile-nav-context"
import {
  LayoutDashboard,
  Folder,
  ShoppingCart,
  Settings,
  MessageSquare,
  BookOpen,
  Star,
  Percent,
  FileText,
  Tag,
  X,
} from "lucide-react"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/categories", label: "Categories", icon: Folder },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/sales", label: "Sales", icon: Percent },
  { href: "/admin/discount-codes", label: "Discount Codes", icon: Tag },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/blog", label: "Blog", icon: BookOpen },
  { href: "/admin/policies", label: "Policies", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { isOpen, close } = useMobileNav()

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-black/40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 z-40 w-64 shrink-0 overflow-y-auto bg-white border-r border-[#e9eaee] px-3 py-5 transition-transform duration-200 ease-in-out",
          "md:static md:z-auto md:min-h-[calc(100vh-64px)] md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-3 pb-3 md:block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Menu
          </p>
          <button
            type="button"
            onClick={close}
            className="md:hidden p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
