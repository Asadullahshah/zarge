"use client"

import { useEffect, useState } from "react"
import { Wifi, WifiOff, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)
    setShowBanner(!navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      setShowBanner(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!showBanner) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground px-4 py-3 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <>
              <Wifi className="w-5 h-5" />
              <span className="font-semibold">Connection restored!</span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5" />
              <span className="font-semibold">No internet connection</span>
              <span className="text-sm opacity-90">
                Please check your network settings
              </span>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBanner(false)}
          className="text-destructive-foreground hover:bg-destructive/80"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

