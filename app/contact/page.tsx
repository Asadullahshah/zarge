"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { safeFetch, formatErrorMessage } from "@/lib/error-handler"

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

type ContactFormData = z.infer<typeof contactSchema>

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await safeFetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Failed to send message")
      }

      setSuccess(true)
      reset()
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: unknown) {
      setError(formatErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-serif font-bold mb-4">Contact Us</h1>
        <p className="text-lg mb-8">
          Have a question or need assistance? We&apos;d love to hear from you.
        </p>

        {success && (
          <div className="bg-green-500/10 text-green-600 p-4 rounded-md mb-6">
            Thank you! Your message has been sent. We&apos;ll get back to you soon.
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 rounded-lg space-y-6 border border-black/10 bg-gray-50 ">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register("name")}
                className="bg-white/30 border-black/20 backdrop-blur-sm"
              />
              {errors.name && (
                <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                className="bg-white/30 border-black/20 backdrop-blur-sm"
              />
              {errors.email && (
                <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                className="bg-white/30 border-black/20 backdrop-blur-sm"
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                {...register("subject")}
                className="bg-white/30 border-black/20 backdrop-blur-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <textarea
              id="message"
              {...register("message")}
              rows={6}
              className="flex w-full rounded-md border border-black/20 bg-white/30 backdrop-blur-sm px-3 py-2 text-sm text-black placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.message && (
              <p className="text-destructive text-sm mt-1">{errors.message.message}</p>
            )}
          </div>

          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </div>
    </div>
  )
}