"use client"

import { useEffect } from "react"
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[ChatError]", error)
  }, [error])

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 px-4">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangleIcon className="size-6" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-foreground">
          Something went wrong
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Failed to load the chat. Try refreshing.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={reset}>
        <RefreshCwIcon />
        Try again
      </Button>
    </div>
  )
}
