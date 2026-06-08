import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { PlusIcon, SettingsIcon, SparklesIcon } from "lucide-react"

import { ChatRoom, type ChatRoomMessage } from "@/components/chat/chat-room"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { getAgent } from "@/lib/agents/queries"
import { getCurrentSession } from "@/lib/auth-current"
import {
  getAgentConversation,
  listConversationMessages,
  listConversations,
} from "@/lib/chat/queries"
import { buildChatRoomRenderKey } from "@/lib/chat/sidebar"

export default async function AgentChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string }>
  searchParams: Promise<{ conversation?: string; new?: string }>
}) {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  const { agentId } = await params
  const agent = await getAgent(session.user.id, agentId)

  if (!agent) {
    notFound()
  }

  const { conversation: conversationId, new: isNewChat } = await searchParams
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

  const [latestConversation] =
    isNewChat === "1" || selectedConversation
      ? []
      : await listConversations(session.user.id, agent.id)

  if (!conversationId && isNewChat !== "1" && latestConversation) {
    redirect(`/chat/${agent.id}?conversation=${latestConversation.id}`)
  }

  const activeConversation = selectedConversation ?? latestConversation ?? null
  const messageResult = activeConversation
    ? await listConversationMessages(session.user.id, activeConversation.id)
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

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-1 flex min-w-0 items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white dark:bg-violet-600">
              <SparklesIcon className="size-3.5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {agent.name}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {agent.model}
              </p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="default" size="sm">
            <Link href={`/chat/${agent.id}?new=1`}>
              <PlusIcon />
              New agent chat
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/agents/${agent.id}/settings`}>
              <SettingsIcon />
              Settings
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <ChatRoom
        key={buildChatRoomRenderKey(agent.id, activeConversation?.id ?? null)}
        agent={{
          id: agent.id,
          name: agent.name,
          model: agent.model,
        }}
        conversationBasePath={`/chat/${agent.id}`}
        initialConversationId={activeConversation?.id ?? null}
        initialMessages={initialMessages}
      />
    </div>
  )
}
