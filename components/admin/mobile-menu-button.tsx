"use client"

import { Menu } from "lucide-react"
import { useMobileNav } from "./mobile-nav-context"

export function MobileMenuButton() {
  const { toggle } = useMobileNav()

  return (
    <button
      type="button"
      onClick={toggle}
      className="md:hidden -ml-2 p-2 rounded-lg text-gray-600 hover:bg-gray-100"
      aria-label="Toggle menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}
