"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const sortOptions = [
  { value: "featured", label: "Featured First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
]

export function SortSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get("sort") || "featured"

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "featured") {
      params.delete("sort")
    } else {
      params.set("sort", value)
    }
    params.delete("page") // Reset to page 1 when sorting changes
    // Preserve subcategory filter if present
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label htmlFor="sort" className="text-sm text-[#BDBDBD] whitespace-nowrap">
        Sort by:
      </label>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger id="sort" className="w-full sm:w-[200px] bg-[#121213] border-[#1A1A1B]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#121213] border-[#1A1A1B]">
          {sortOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="hover:bg-[#1A1A1B] focus:bg-[#1A1A1B]"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

