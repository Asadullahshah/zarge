"use client"

import { useState, useEffect } from "react"
import { LayoutGrid, Grid3x3, Grid, Columns } from "lucide-react"

interface GridLayoutSelectorProps {
  onLayoutChange?: (columns: number) => void
}

export function GridLayoutSelector({ onLayoutChange }: GridLayoutSelectorProps) {
  const [columns, setColumns] = useState(4)

  useEffect(() => {
    // Load saved preference from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedLayout = localStorage.getItem('productGridLayout')
      if (savedLayout) {
        const cols = parseInt(savedLayout, 10)
        if ([2, 3, 4, 5].includes(cols)) {
          setColumns(cols)
        }
      }
    }
  }, [])

  const handleLayoutChange = (newColumns: number) => {
    setColumns(newColumns)
    if (typeof window !== 'undefined') {
      localStorage.setItem('productGridLayout', newColumns.toString())
    }
    // Always call onLayoutChange to sync with parent component
    if (onLayoutChange) {
      onLayoutChange(newColumns)
    }
  }

  const buttonClasses = (isActive: boolean) => {
    const base = "relative inline-flex items-center justify-center rounded-md transition-all duration-200 focus:outline-none"
    const size = "min-h-[44px] min-w-[44px] h-11 w-11 md:h-9 md:w-9 p-0"
    const active = isActive 
      ? "bg-black/20 text-black" 
      : "bg-transparent text-[#BDBDBD] hover:bg-[#1A1A1B] hover:text-[#F7F7F7] active:bg-[#2A2A2B] active:scale-95"
    return `${base} ${size} ${active}`
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-[#BDBDBD] mr-2 whitespace-nowrap">Layout:</span>
      <div className="flex gap-1 border border-[#000000] rounded-lg p-1 bg-[#ffffff]">
        <button
          type="button"
          onClick={() => handleLayoutChange(2)}
          onTouchStart={(e) => {
            // Prevent double-tap zoom on mobile
            e.currentTarget.style.touchAction = 'manipulation'
          }}
          className={buttonClasses(columns === 2)}
          aria-label="2 columns"
          title="2 columns"
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        >
          <Columns className="w-5 h-5 md:w-4 md:h-4 pointer-events-none" />
        </button>
        <button
          type="button"
          onClick={() => handleLayoutChange(3)}
          onTouchStart={(e) => {
            e.currentTarget.style.touchAction = 'manipulation'
          }}
          className={buttonClasses(columns === 3)}
          aria-label="3 columns"
          title="3 columns"
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        >
          <Grid3x3 className="w-5 h-5 md:w-4 md:h-4 pointer-events-none" />
        </button>
        <button
          type="button"
          onClick={() => handleLayoutChange(4)}
          onTouchStart={(e) => {
            e.currentTarget.style.touchAction = 'manipulation'
          }}
          className={buttonClasses(columns === 4)}
          aria-label="4 columns"
          title="4 columns"
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        >
          <LayoutGrid className="w-5 h-5 md:w-4 md:h-4 pointer-events-none" />
        </button>
        <button
          type="button"
          onClick={() => handleLayoutChange(5)}
          onTouchStart={(e) => {
            e.currentTarget.style.touchAction = 'manipulation'
          }}
          className={buttonClasses(columns === 5)}
          aria-label="5 columns"
          title="5 columns"
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        >
          <Grid className="w-5 h-5 md:w-4 md:h-4 pointer-events-none" />
        </button>
      </div>
    </div>
  )
}

export function getGridLayoutClass(columns: number = 4): string {
  const baseClass = "grid gap-4 sm:gap-6 mb-8"
  const colClasses: Record<number, string> = {
    // Layout 2: Single column on mobile (list view), 2 columns on tablet+
    2: "grid-cols-1 md:grid-cols-2",
    // Layout 3: 2 columns on mobile, 2 on sm, 3 on lg+
    3: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3",
    // Layout 4: 2 columns on mobile, 2 on sm, 4 on lg+
    4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
    // Layout 5: 2 columns on mobile, 3 on md, 5 on lg+
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  }
  return `${baseClass} ${colClasses[columns] || colClasses[4]}`
}

