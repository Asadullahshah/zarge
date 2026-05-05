"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, ChevronDown, Package, MessageSquare, Edit, Plus, Folder, FolderOpen, Ruler, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CategoryTreeProps {
  categories: Array<{
    id: string
    name: string
    slug: string
    description?: string
    product_count: number
    child_count: number
    children?: Array<{
      id: string
      name: string
      slug: string
      description?: string
      product_count: number
      size_chart_image?: string | null
    }>
  }>
}

export function CategoryTree({ categories }: CategoryTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    // Expand all by default
    const initial: Record<string, boolean> = {}
    categories.forEach((cat) => {
      initial[cat.id] = true
    })
    return initial
  })

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div
          key={category.id}
          className="bg-[#121213] rounded-lg border border-[#1A1A1B] overflow-hidden shadow-lg"
        >
          {/* Parent Category Header */}
          <div className="p-6 bg-gradient-to-r from-[#1A1A1B] to-[#121213] border-b border-[#1A1A1B]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => toggleExpanded(category.id)}
                  className="text-[#BDBDBD] hover:text-[#F7F7F7] transition-colors p-1"
                  disabled={category.child_count === 0}
                >
                  {category.child_count > 0 ? (
                    expanded[category.id] ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )
                  ) : (
                    <div className="w-5 h-5" />
                  )}
                </button>
                <div className="flex items-center gap-3">
                  {expanded[category.id] && category.child_count > 0 ? (
                    <FolderOpen className="w-6 h-6 text-primary" />
                  ) : (
                    <Folder className="w-6 h-6 text-primary" />
                  )}
                  <div>
                    <h3 className="text-2xl font-serif font-bold mb-1">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-[#BDBDBD]">{category.description}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{category.product_count || 0}</div>
                  <div className="text-xs text-[#BDBDBD]">products</div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/categories/${category.slug}/products`}>
                    <Button variant="outline" size="sm">
                      <Package className="w-4 h-4 mr-2" />
                      Products
                    </Button>
                  </Link>
                  <Link href={`/admin/categories/${category.slug}/faqs`}>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      FAQs
                    </Button>
                  </Link>
                  <Link href={`/admin/categories/${category.slug}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Subcategories */}
          {category.children && category.children.length > 0 && expanded[category.id] && (
            <div className="bg-[#0B0B0C]">
              <div className="px-6 py-3 border-b border-[#1A1A1B] bg-[#121213]/50">
                <span className="text-sm font-semibold text-[#BDBDBD] uppercase tracking-wide">
                  Subcategories ({category.children.length})
                </span>
              </div>
              <div className="divide-y divide-[#1A1A1B]">
                {category.children.map((child, index) => (
                  <div
                    key={child.id}
                    className="p-5 hover:bg-[#121213] transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg font-semibold group-hover:text-primary transition-colors">
                              {child.name}
                            </h4>
                            {child.size_chart_image && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                Size Chart
                              </span>
                            )}
                            {!child.size_chart_image && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full">
                                <Ruler className="w-3 h-3" />
                                No Size Chart
                              </span>
                            )}
                          </div>
                          {child.description && (
                            <p className="text-sm text-[#BDBDBD]">{child.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">{child.product_count || 0}</div>
                          <div className="text-xs text-[#BDBDBD]">products</div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/admin/categories/${child.slug}/products`}>
                            <Button variant="ghost" size="sm" className="group-hover:bg-primary/10">
                              <Package className="w-4 h-4 mr-2" />
                              Products
                            </Button>
                          </Link>
                          <Link href={`/admin/categories/${child.slug}/products/new`}>
                            <Button size="sm">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Product
                            </Button>
                          </Link>
                          <Link href={`/admin/categories/${child.slug}/faqs`}>
                            <Button variant="ghost" size="sm" className="group-hover:bg-primary/10">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              FAQs
                            </Button>
                          </Link>
                          <Link href={`/admin/categories/${child.slug}/edit`}>
                            <Button variant="ghost" size="sm" className="group-hover:bg-primary/10">
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions for Parent Category */}
          {(!category.children || category.children.length === 0) && (
            <div className="px-6 py-4 bg-[#0B0B0C] border-t border-[#1A1A1B]">
              <div className="flex gap-2">
                <Link href={`/admin/categories/${category.slug}/products/new`}>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product to {category.name}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
