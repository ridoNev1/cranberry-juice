import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cranberry Juice | Authentication",
  description: "Sign in to Cranberry Juice",
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background radial gradient */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background"></div>
      
      {/* Glowing orbital behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-red-600/20 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      
      <main className="w-full flex justify-center px-4 md:px-0">
        {children}
      </main>
    </div>
  )
}
