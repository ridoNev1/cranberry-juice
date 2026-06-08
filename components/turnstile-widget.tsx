"use client"
import { Turnstile } from "@marsidev/react-turnstile"

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void
}

export function TurnstileWidget({ onSuccess }: TurnstileWidgetProps) {
  return (
    <Turnstile
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
      onSuccess={onSuccess}
    />
  )
}
