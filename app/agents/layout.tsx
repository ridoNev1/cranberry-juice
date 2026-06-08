import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { listAgents } from "@/lib/agents/queries"
import { getCurrentSession } from "@/lib/auth-current"
import { listRecentConversations } from "@/lib/chat/queries"

export default async function AgentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()
  const agents = session ? await listAgents(session.user.id) : []
  const conversations = session
    ? await listRecentConversations(session.user.id)
    : []

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "220px" } as React.CSSProperties}
    >
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <ChatSidebar
          agents={agents.map((agent) => ({
            id: agent.id,
            name: agent.name,
            model: agent.model,
          }))}
          conversations={conversations.map((conversation) => ({
            id: conversation.id,
            agentId: conversation.agentId,
            title: conversation.title,
            updatedAt: conversation.updatedAt.toISOString(),
            messageCount: conversation._count.messages,
            isDefaultAgent: conversation.agent.isDefault,
          }))}
        />
        <div className="flex flex-1 overflow-hidden p-3">
          <main className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
