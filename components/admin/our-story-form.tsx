"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Loader2 } from "lucide-react"

interface OurStoryFormProps {
  initialContent: string
}

export function OurStoryForm({ initialContent }: OurStoryFormProps) {
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ our_story_content: content }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Failed to save")
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to save Our Story")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#BDBDBD]">
        Leave a blank line between paragraphs. Start a paragraph with{" "}
        <code className="px-1 rounded bg-black/5">&gt; </code> to show it in serif italic.
        If the text is too long for the section, a Read More button appears automatically.
      </p>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="bg-[#121213] p-6 rounded-lg border border-[#1A1A1B] space-y-4">
        <h2 className="text-xl font-serif font-bold">Our Story</h2>
        <div>
          <Label htmlFor="ourStoryContent">Content</Label>
          <textarea
            id="ourStoryContent"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="mt-1 flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-mono leading-relaxed"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
            </>
          ) : (
            "Save Our Story"
          )}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-green-500 text-sm">
            <CheckCircle2 className="w-4 h-4" /> Saved
          </span>
        )}
      </div>
    </div>
  )
}
