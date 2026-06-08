"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",

          // Success — green
          "--success-bg": "oklch(0.18 0.05 145)",
          "--success-text": "oklch(0.88 0.15 145)",
          "--success-border": "oklch(0.45 0.18 145 / 50%)",

          // Error — red/rose
          "--error-bg": "oklch(0.18 0.06 20)",
          "--error-text": "oklch(0.88 0.14 20)",
          "--error-border": "oklch(0.55 0.22 20 / 50%)",

          // Warning — amber
          "--warning-bg": "oklch(0.18 0.07 85)",
          "--warning-text": "oklch(0.90 0.18 85)",
          "--warning-border": "oklch(0.65 0.2 85 / 50%)",

          // Info — sky blue
          "--info-bg": "oklch(0.18 0.05 230)",
          "--info-text": "oklch(0.88 0.14 230)",
          "--info-border": "oklch(0.55 0.18 230 / 50%)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          success: "[&_[data-icon]]:text-emerald-400",
          error: "[&_[data-icon]]:text-rose-400",
          warning: "[&_[data-icon]]:text-amber-400",
          info: "[&_[data-icon]]:text-sky-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
