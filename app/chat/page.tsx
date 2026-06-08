import { redirect, notFound } from "next/navigation"
import { SparklesIcon } from "lucide-react"

import { ChatRoom, type ChatRoomMessage } from "@/components/chat/chat-room"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { getOrCreateDefaultAgent } from "@/lib/agents/queries"
import { getCurrentSession } from "@/lib/auth-current"
import {
  getAgentConversation,
  listConversationMessages,
} from "@/lib/chat/queries"
import { buildChatRoomRenderKey } from "@/lib/chat/sidebar"

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>
}) {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  const agent = await getOrCreateDefaultAgent(session.user.id)
  const { conversation: conversationId } = await searchParams
  const selectedConversation = conversationId
    ? await getAgentConversation({
        userId: session.user.id,
        agentId: agent.id,
        conversationId,
      })
    : null

  if (conversationId && !selectedConversation) {
    notFound()
  }

  const messageResult = selectedConversation
    ? await listConversationMessages(session.user.id, selectedConversation.id)
    : null
  const initialMessages: ChatRoomMessage[] =
    messageResult?.messages.map((message) => ({
      id: message.id,
      attachments: message.chatAttachments.map((attachment) => ({
        id: attachment.id,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
      })),
      role: message.role as ChatRoomMessage["role"],
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    })) ?? []
  const firstName = session.user.name?.split(" ")[0] ?? "there"

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-1 flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-violet-500 text-white dark:bg-violet-600">
              <SparklesIcon className="size-3.5" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Cranberry Juice
            </span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <ChatRoom
        key={buildChatRoomRenderKey(agent.id, selectedConversation?.id ?? null)}
        agent={{
          id: agent.id,
          name: agent.name,
          model: agent.model,
        }}
        conversationBasePath="/chat"
        emptyLayout="global"
        emptyTitle={`Hello, ${firstName}`}
        emptyDescription="How can I assist you today?"
        initialConversationId={selectedConversation?.id ?? null}
        initialMessages={initialMessages}
      />
    </div>
  )
}
