import { SidebarProvider } from "@/components/ui/sidebar"
import { ChatSidebar } from "@/components/chat/chat-sidebar"

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "220px" } as React.CSSProperties}
    >
      {/* bg-background = lavender in light, dark in dark mode */}
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <ChatSidebar />
        <div className="flex flex-1 overflow-hidden p-3">
          {/* Main content = bg-card (white/dark card) */}
          <main className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-sm border border-border/50">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
