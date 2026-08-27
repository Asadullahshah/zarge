"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, GripVertical } from "lucide-react"

interface FAQ {
  id?: string
  question: string
  answer: string
  order: number
}

interface FAQManagerProps {
  categoryId: string
  initialFAQs: FAQ[]
}

export function FAQManager({ categoryId, initialFAQs }: FAQManagerProps) {
  const [faqs, setFaqs] = useState<FAQ[]>(initialFAQs || [])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const addFAQ = () => {
    setFaqs([
      ...faqs,
      {
        question: "",
        answer: "",
        order: faqs.length,
      },
    ])
  }

  const removeFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index).map((faq, i) => ({ ...faq, order: i })))
  }

  const updateFAQ = (index: number, field: "question" | "answer", value: string) => {
    const updated = [...faqs]
    updated[index] = { ...updated[index], [field]: value }
    setFaqs(updated)
  }

  const saveFAQs = async () => {
    setLoading(true)
    setSaved(false)

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}/faqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faqs }),
      })

      if (!response.ok) {
        throw new Error("Failed to save FAQs")
      }

      const data = await response.json()
      setFaqs(data.faqs)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Error saving FAQs:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {saved && (
        <div className="bg-green-500/10 text-green-400 p-4 rounded-md">
          FAQs saved successfully!
        </div>
      )}

      <div className="bg-[#121213] p-6 rounded-lg space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Category FAQs</h2>
          <Button onClick={addFAQ} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add FAQ
          </Button>
        </div>

        {faqs.length === 0 ? (
          <p className="text-[#BDBDBD] text-center py-8">
            No FAQs yet. Add your first FAQ to help customers and improve AEO.
          </p>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-[#1A1A1B] rounded-lg p-4 bg-[#0B0B0C]"
              >
                <div className="flex items-start gap-2 mb-4">
                  <GripVertical className="w-5 h-5 text-[#BDBDBD] mt-2" />
                  <div className="flex-1 space-y-4">
                    <div>
                      <Label>Question {index + 1}</Label>
                      <Input
                        value={faq.question}
                        onChange={(e) => updateFAQ(index, "question", e.target.value)}
                        placeholder="e.g., What sizes are available?"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Answer {index + 1}</Label>
                      <textarea
                        value={faq.answer}
                        onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                        placeholder="Provide a clear, concise answer (optimized for AI search engines)"
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm mt-1"
                      />
                      <p className="text-xs text-[#BDBDBD] mt-1">
                        Tip: Keep answers concise (40-80 words) for better AEO performance
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFAQ(index)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button onClick={saveFAQs} disabled={loading} className="w-full">
          {loading ? "Saving..." : "Save FAQs"}
        </Button>
      </div>

      <div className="bg-[#121213] p-6 rounded-lg">
        <h3 className="font-semibold mb-2">AEO Optimization Tips</h3>
        <ul className="text-sm text-[#BDBDBD] space-y-2 list-disc list-inside">
          <li>Keep questions natural and conversational</li>
          <li>Provide direct, factual answers (40-80 words ideal)</li>
          <li>Use keywords naturally in both questions and answers</li>
          <li>Structure answers to be easily parseable by AI</li>
          <li>Include specific details (sizes, materials, care instructions)</li>
        </ul>
      </div>
    </div>
  )
}

