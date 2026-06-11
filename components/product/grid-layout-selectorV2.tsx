'use client'

import { Square, Columns2, Grid2x2, SlidersHorizontal } from "lucide-react"

type Layout = "list" | "grid" | "compact"

const layoutToColumns: Record<Layout, number> = {
  list: 2,
  grid: 3,
  compact: 4,
}

const columnsToLayout: Record<number, Layout> = {
  2: "list",
  3: "grid",
  4: "compact",
}

export function getGridLayoutClass(columns: number = 2): string {
  const baseClass = "grid gap-4 mb-8"
  const colClasses: Record<number, string> = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
  }
  return `${baseClass} ${colClasses[columns] ?? colClasses[2]}`
}

interface GridLayoutSelectorV2Props {
  columns?: number
  onFilterClick?: () => void
  
  onLayoutChange: (columns: number) => void
}


export default function GridLayoutSelectorV2({ columns = 4, onLayoutChange, onFilterClick }: GridLayoutSelectorV2Props) {
  

  const layout = columnsToLayout[columns] ?? "compact"

  return (
    <div className="flex gap-3 mb-4">
      <button
        className={layout === "list" ? "active" : ""}
        onClick={() => onLayoutChange(2)}
      >
        <Square size={20} />
      </button>

      <button
        className={layout === "grid" ? "active" : ""}
        onClick={() => onLayoutChange(3)}
      >
        <Columns2 size={20} />
      </button>

      <button
        className={layout === "compact" ? "active" : ""}
        onClick={() => onLayoutChange(4)}
      >
        <Grid2x2 size={20} />
      </button>

      <button onClick={onFilterClick}>
        <SlidersHorizontal size={20} />
      </button>
    </div>
  )
}