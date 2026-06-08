import type { Metadata } from "next"
import { Geist_Mono, IBM_Plex_Sans, Outfit } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Cranberry Juice",
  description: "Multi-agent AI chat platform",
  icons: {
    icon: [
      { url: "/favico/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favico/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favico/favicon.ico" },
    ],
    apple: "/favico/apple-touch-icon.png",
    other: [
      {
        rel: "manifest",
        url: "/favico/site.webmanifest",
      },
    ],
  },
}

const outfitHeading = Outfit({ subsets: ["latin"], variable: "--font-heading" })

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        ibmPlexSans.variable,
        outfitHeading.variable
      )}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
