"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Percent, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

interface SalesManagerProps {
  mainCategories: Array<{ id: string; name: string; slug: string }>
  subCategories: Array<{ 
    id: string; 
    name: string; 
    slug: string; 
    parent_id: string;
    parent_name: string;
  }>
}

type SaleTarget = "INVENTORY" | "MAIN_CATEGORY" | "SUBCATEGORY"

export function SalesManager({ mainCategories, subCategories }: SalesManagerProps) {
  const [salePercentage, setSalePercentage] = useState("")
  const [saleTarget, setSaleTarget] = useState<SaleTarget>("INVENTORY")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Group subcategories by parent for display
  const subCategoriesByParent = subCategories.reduce((acc, subcat) => {
    if (!acc[subcat.parent_id]) {
      acc[subcat.parent_id] = []
    }
    acc[subcat.parent_id].push(subcat)
    return acc
  }, {} as Record<string, typeof subCategories>)

  const handleApplySale = async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validate input
      const percentage = parseFloat(salePercentage)
      if (isNaN(percentage) || percentage <= 0 || percentage >= 100) {
        setError("Please enter a valid sale percentage between 1 and 99")
        setLoading(false)
        return
      }

      if (saleTarget !== "INVENTORY" && !selectedCategoryId) {
        setError("Please select a category")
        setLoading(false)
        return
      }

      // Prepare request body
      const body: any = {
        percentage,
        target: saleTarget,
      }

      if (saleTarget === "MAIN_CATEGORY" || saleTarget === "SUBCATEGORY") {
        body.categoryId = selectedCategoryId
      }

      // Call API to apply sale
      const response = await fetch("/api/admin/sales/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to apply sale")
      }

      setSuccess(
        `✅ Sale applied successfully! ${data.updatedCount || 0} products updated with ${percentage}% off.`
      )
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSalePercentage("")
        setSaleTarget("INVENTORY")
        setSelectedCategoryId("")
        setSuccess("")
      }, 3000)
    } catch (err: any) {
      setError(err.message || "An error occurred while applying the sale")
    } finally {
      setLoading(false)
    }
  }

  // Get selected category name for display
  const getSelectedCategoryName = () => {
    if (saleTarget === "INVENTORY") return "Entire Inventory"
    if (saleTarget === "MAIN_CATEGORY") {
      const cat = mainCategories.find((c) => c.id === selectedCategoryId)
      return cat ? cat.name : ""
    }
    if (saleTarget === "SUBCATEGORY") {
      const subcat = subCategories.find((c) => c.id === selectedCategoryId)
      return subcat ? `${subcat.parent_name} > ${subcat.name}` : ""
    }
    return ""
  }

  return (
    <div className="space-y-6">
      {/* Sale Form */}
      <div className="bg-[#121213] p-6 rounded-lg border border-[#1A1A1B]">
        <h2 className="text-2xl font-serif font-bold mb-6">Apply Sale</h2>

        {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive text-destructive p-4 rounded-md flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-md flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Sale Percentage */}
          <div>
            <Label htmlFor="percentage" className="text-lg font-semibold">
              Sale Percentage *
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="percentage"
                type="number"
                min="1"
                max="99"
                step="0.01"
                value={salePercentage}
                onChange={(e) => setSalePercentage(e.target.value)}
                placeholder="e.g., 17"
                className="max-w-xs"
              />
              <span className="text-2xl text-[#BDBDBD]">%</span>
            </div>
            <p className="text-sm text-[#BDBDBD] mt-1">
              Enter the percentage discount (e.g., 17 for 17% off)
            </p>
          </div>

          {/* Sale Target Selection */}
          <div>
            <Label className="text-lg font-semibold mb-4 block">
              Apply Sale To *
            </Label>
            <div className="space-y-3">
              {/* Entire Inventory */}
              <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-[#1A1A1B] hover:border-primary transition-colors">
                <input
                  type="radio"
                  name="saleTarget"
                  value="INVENTORY"
                  checked={saleTarget === "INVENTORY"}
                  onChange={() => {
                    setSaleTarget("INVENTORY")
                    setSelectedCategoryId("")
                  }}
                  className="w-4 h-4 text-primary"
                />
                <div className="flex-1">
                  <div className="font-semibold">Entire Inventory</div>
                  <div className="text-sm text-[#BDBDBD]">
                    Apply sale to all products across all categories
                  </div>
                </div>
              </label>

              {/* Main Category */}
              <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-[#1A1A1B] hover:border-primary transition-colors">
                <input
                  type="radio"
                  name="saleTarget"
                  value="MAIN_CATEGORY"
                  checked={saleTarget === "MAIN_CATEGORY"}
                  onChange={() => {
                    setSaleTarget("MAIN_CATEGORY")
                    setSelectedCategoryId("")
                  }}
                  className="w-4 h-4 text-primary"
                />
                <div className="flex-1">
                  <div className="font-semibold">Main Category</div>
                  <div className="text-sm text-[#BDBDBD]">
                    Apply sale to all products in a main category and its subcategories
                  </div>
                </div>
              </label>

              {/* Subcategory */}
              <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-[#1A1A1B] hover:border-primary transition-colors">
                <input
                  type="radio"
                  name="saleTarget"
                  value="SUBCATEGORY"
                  checked={saleTarget === "SUBCATEGORY"}
                  onChange={() => {
                    setSaleTarget("SUBCATEGORY")
                    setSelectedCategoryId("")
                  }}
                  className="w-4 h-4 text-primary"
                />
                <div className="flex-1">
                  <div className="font-semibold">Subcategory</div>
                  <div className="text-sm text-[#BDBDBD]">
                    Apply sale to all products in a specific subcategory only
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Category Selection */}
          {saleTarget === "MAIN_CATEGORY" && (
            <div>
              <Label htmlFor="mainCategory" className="text-lg font-semibold">
                Select Main Category *
              </Label>
              <select
                id="mainCategory"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm mt-2"
              >
                <option value="">-- Select Main Category --</option>
                {mainCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {saleTarget === "SUBCATEGORY" && (
            <div>
              <Label htmlFor="subCategory" className="text-lg font-semibold">
                Select Subcategory *
              </Label>
              <select
                id="subCategory"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm mt-2"
              >
                <option value="">-- Select Subcategory --</option>
                {mainCategories.map((mainCat) => {
                  const subs = subCategoriesByParent[mainCat.id] || []
                  if (subs.length === 0) return null
                  return (
                    <optgroup key={mainCat.id} label={mainCat.name}>
                      {subs.map((subcat) => (
                        <option key={subcat.id} value={subcat.id}>
                          {subcat.name}
                        </option>
                      ))}
                    </optgroup>
                  )
                })}
              </select>
            </div>
          )}

          {/* Preview */}
          {salePercentage && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-5 h-5 text-primary" />
                <span className="font-semibold">Preview</span>
              </div>
              <p className="text-sm text-[#BDBDBD]">
                A <strong className="text-primary">{salePercentage}%</strong> sale will be applied to{" "}
                <strong className="text-primary">
                  {getSelectedCategoryName() || "..."}
                </strong>
              </p>
              <p className="text-xs text-[#BDBDBD] mt-2">
                Sale prices will be automatically calculated from the <strong>original price</strong>:{" "}
                <strong>Sale Price = Original Price × (1 - {salePercentage}%)</strong>
              </p>
              <p className="text-xs text-[#BDBDBD] mt-1">
                <strong className="text-yellow-400">⚠️ Note:</strong> Any existing sale prices will be{" "}
                <strong className="text-primary">replaced</strong> with the new sale price calculated from the original price.
              </p>
            </div>
          )}

          {/* Apply Button */}
          <div className="flex gap-4">
            <Button
              onClick={handleApplySale}
              disabled={loading || !salePercentage || (saleTarget !== "INVENTORY" && !selectedCategoryId)}
              size="lg"
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Applying Sale...
                </>
              ) : (
                <>
                  <Percent className="w-4 h-4 mr-2" />
                  Apply Sale
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

