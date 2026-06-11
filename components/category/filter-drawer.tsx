"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

const sortOptions = [
  { value: "featured", label: "Featured First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
]

interface FilterDrawerProps {
  open: boolean
  onClose: () => void
  sort: string
  onSortChange: (value: string) => void
}

export function FilterDrawer({ open, onClose, sort, onSortChange }: FilterDrawerProps) {
  const [mounted, setMounted] = useState(false)
  const [selected, setSelected] = useState(sort)

  useEffect(() => { setSelected(sort) }, [sort])
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  return createPortal(
    <>
      <div
        className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-in-out ${
          open ? "opacity-100 z-[200]" : "opacity-0 pointer-events-none z-[-1]"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-[375px] bg-white z-[201] flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-center border-b px-6 py-4 relative">
          <span className="text-sm font-bold tracking-widest uppercase">Filter</span>
          <button onClick={onClose} className="absolute right-6 top-1/2 -translate-y-1/2">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-4">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelected(option.value)}
                className={`flex items-center gap-3 text-sm tracking-wide text-left ${
                  selected === option.value ? "font-semibold" : "text-gray-600"
                }`}
              >
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selected === option.value ? "border-black" : "border-gray-300"
                }`}>
                  {selected === option.value && (
                    <span className="w-2 h-2 rounded-full bg-black" />
                  )}
                </span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t flex">
          <button
            onClick={() => onSortChange(selected)}
            className="flex-1 bg-black text-white py-4 text-sm font-semibold tracking-widest uppercase"
          >
            Apply
          </button>
          <button
            onClick={() => { setSelected("featured"); onSortChange("featured") }}
            className="flex-1 bg-white text-black py-4 text-sm font-semibold tracking-widest uppercase border-l"
          >
            Clear All
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}