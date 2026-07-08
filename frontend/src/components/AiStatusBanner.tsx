"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { AI_DEGRADED_EVENT } from "@/lib/api"

const AUTO_DISMISS_MS = 30000

export function AiStatusBanner() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    function handleDegraded(event: Event) {
      const detail = (event as CustomEvent<string>).detail
      setMessage(detail || "The AI service is currently busy.")
    }
    window.addEventListener(AI_DEGRADED_EVENT, handleDegraded)
    return () => window.removeEventListener(AI_DEGRADED_EVENT, handleDegraded)
  }, [])

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [message])

  if (!message) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  )
}
