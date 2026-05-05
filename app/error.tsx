"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  const isNetworkError =
    error.message.includes("Failed to fetch") ||
    error.message.includes("NetworkError") ||
    error.message.includes("No internet connection")

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0C] px-4">
      <div className="max-w-md w-full bg-[#121213] border border-[#1A1A1B] rounded-lg p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">
          {isNetworkError ? "Connection Error" : "Something went wrong"}
        </h1>
        <p className="text-[#BDBDBD] mb-6">
          {isNetworkError
            ? "Unable to connect to the server. Please check your internet connection and try again."
            : error.message || "We encountered an unexpected error. Please try refreshing the page."}
        </p>
        {error.digest && (
          <p className="text-xs text-[#BDBDBD] mb-6 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={() => (window.location.href = "/")}>
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}

