"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronsUpDown, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CreatableSelectProps {
  options: string[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  allowCustom?: boolean
}

export function CreatableSelect({
  options,
  value,
  onChange,
  placeholder = "Select or type to add new...",
  className,
  allowCustom = true,
}: CreatableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [filteredOptions, setFilteredOptions] = useState(options)
  const [customValue, setCustomValue] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchValue) {
      const filtered = options.filter((opt) =>
        opt.toLowerCase().includes(searchValue.toLowerCase())
      )
      setFilteredOptions(filtered)
      
      // If search doesn't match any option and allowCustom is true, show option to add
      if (filtered.length === 0 && allowCustom && searchValue.trim()) {
        setFilteredOptions([`Add "${searchValue}"`])
      } else {
        setFilteredOptions(filtered)
      }
    } else {
      setFilteredOptions(options)
    }
  }, [searchValue, options, allowCustom])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchValue("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (option: string) => {
    if (option.startsWith('Add "')) {
      // Extract the custom value
      const newValue = searchValue.trim()
      if (newValue) {
        onChange(newValue)
        setCustomValue(newValue)
        setSearchValue("")
        setIsOpen(false)
      }
    } else {
      onChange(option)
      setSearchValue("")
      setIsOpen(false)
    }
  }

  const displayValue = value || customValue || ""

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={cn("truncate", !displayValue && "text-muted-foreground")}>
          {displayValue || placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-[#121213] shadow-lg">
          <div className="p-2">
            <Input
              type="text"
              placeholder="Search or type new value..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="mb-2"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-[#BDBDBD]">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-[#1A1A1B] focus:bg-[#1A1A1B]",
                    value === option && "bg-[#1A1A1B]"
                  )}
                  onClick={() => handleSelect(option)}
                >
                  {option.startsWith('Add "') ? (
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-primary" />
                      <span className="text-primary">{option}</span>
                    </div>
                  ) : (
                    <>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option}
                    </>
                  )}
                </button>
              ))
            )}
          </div>
          {allowCustom && searchValue.trim() && !options.includes(searchValue.trim()) && (
            <div className="border-t border-[#1A1A1B] p-2">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-[#1A1A1B]"
                onClick={() => {
                  const newValue = searchValue.trim()
                  if (newValue) {
                    onChange(newValue)
                    setCustomValue(newValue)
                    setSearchValue("")
                    setIsOpen(false)
                  }
                }}
              >
                <Plus className="h-4 w-4" />
                Add &quot;{searchValue.trim()}&quot;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

