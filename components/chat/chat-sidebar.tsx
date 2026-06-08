"use client"

import { Fragment, type MouseEvent, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useSession, signOut } from "@/lib/auth-client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  PlusIcon,
  SearchIcon,
  BotIcon,
  LibraryIcon,
  SettingsIcon,
  LogOutIcon,
  MessageSquareIcon,
  Trash2Icon,
} from "lucide-react"
import {
  buildConversationHref,
  groupConversationsByDate,
} from "@/lib/chat/sidebar"

const NAV_ITEMS = [{ icon: LibraryIcon, label: "Agents", href: "/agents" }]

type SidebarAgent = {
  id: string
  name: string
  model: string
}

type SidebarConversation = {
  id: string
  agentId: string
  title: string | null
  updatedAt: string
  messageCount: number
  isDefaultAgent: boolean
}

export function ChatSidebar({
  agents,
  conversations,
}: {
  agents: SidebarAgent[]
  conversations: SidebarConversation[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [deletingConversationId, setDeletingConversationId] = useState<
    string | null
  >(null)
  const [pendingDelete, setPendingDelete] = useState<Pick<
    SidebarConversation,
    "id" | "agentId" | "isDefaultAgent"
  > | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const activeConversationId = searchParams.get("conversation")

  const { globalGroups, agentSections } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const filtered = query
      ? conversations.filter((c) =>
          (c.title ?? "New chat").toLowerCase().includes(query)
        )
      : conversations

    const globalConvos = filtered.filter((c) => c.isDefaultAgent)
    const customConvos = filtered.filter((c) => !c.isDefaultAgent)

    const globalGroups = groupConversationsByDate(
      globalConvos.map((c) => ({ ...c, updatedAt: new Date(c.updatedAt) }))
    )

    const agentMap = new Map<string, typeof customConvos>()
    for (const conv of customConvos) {
      if (!agentMap.has(conv.agentId)) agentMap.set(conv.agentId, [])
      agentMap.get(conv.agentId)!.push(conv)
    }

    const agentSections = [...agentMap.entries()].map(([agentId, convos]) => ({
      agentId,
      agentName: agents.find((a) => a.id === agentId)?.name ?? "Agent",
      conversations: convos.map((c) => ({
        ...c,
        updatedAt: new Date(c.updatedAt),
      })),
    }))

    return { globalGroups, agentSections }
  }, [conversations, searchQuery, agents])

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
    router.refresh()
  }

  const handleDeleteConversation = (
    conversation: Pick<
      SidebarConversation,
      "id" | "agentId" | "isDefaultAgent"
    >,
    event: MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    event.stopPropagation()
    setPendingDelete(conversation)
  }

  const confirmDeleteConversation = async () => {
    if (!pendingDelete) return

    const conversation = pendingDelete
    setDeletingConversationId(conversation.id)

    const response = await fetch(`/api/conversations/${conversation.id}`, {
      method: "DELETE",
    }).catch(() => null)

    setDeletingConversationId(null)
    setPendingDelete(null)

    if (!response?.ok) {
      const payload = await response?.json().catch(() => null)
      toast.error(payload?.error ?? "Unable to delete conversation.")
      return
    }

    toast.success("Conversation deleted.")

    if (activeConversationId === conversation.id) {
      router.push(
        conversation.isDefaultAgent
          ? "/chat"
          : `/chat/${conversation.agentId}?new=1`
      )
    }

    router.refresh()
  }

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?"

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="px-4 pt-4 pb-2">
        {/* Logo */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/cranberry-logo.png"
              alt="Cranberry"
              className="size-8 rounded-lg"
            />
            <span className="text-base font-bold text-foreground">
              Cranberry
            </span>
          </div>
        </div>

        {/* New chat button */}
        <button
          onClick={() => router.push("/chat")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90 active:scale-[0.98] dark:text-white"
        >
          <PlusIcon className="size-4" />
          New chat
        </button>

        {/* Search */}
        <div className="relative mt-2">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full rounded-lg border border-border bg-background/60 py-2 pr-8 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 right-2.5 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              <span className="text-xs">✕</span>
            </button>
          ) : (
            <div className="absolute top-1/2 right-2.5 flex size-5 -translate-y-1/2 items-center justify-center rounded bg-muted text-muted-foreground">
              <span className="font-mono text-[9px]">⌘K</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Nav items */}
        <SidebarGroup className="pb-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton
                    asChild
                    className="gap-3 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <Link href={href}>
                      <Icon className="size-4" />
                      <span className="text-sm font-medium">{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="pt-2">
          <SidebarGroupLabel className="px-2 text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
            Agents
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {agents.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="rounded-lg px-2 text-xs text-muted-foreground"
                  >
                    <Link href="/agents/new">
                      <PlusIcon className="size-4" />
                      <span>Create agent</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                agents.map((agent) => {
                  const isActive = pathname === `/chat/${agent.id}`
                  return (
                    <SidebarMenuItem key={agent.id}>
                      <SidebarMenuButton
                        asChild
                        className="rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
                        isActive={isActive}
                      >
                        <Link href={`/chat/${agent.id}`}>
                          <BotIcon className="size-4" />
                          <span className="truncate">{agent.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Global (default agent) conversations — date-grouped */}
        {globalGroups.length > 0 && (
          <SidebarGroup className="pt-2">
            <SidebarGroupLabel className="px-2 text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
              Conversations
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {globalGroups.map((group) => (
                  <Fragment key={group.label}>
                    <SidebarMenuItem>
                      <p className="px-2 pt-1 text-[10px] font-medium text-muted-foreground/70">
                        {group.label}
                      </p>
                    </SidebarMenuItem>
                    {group.conversations.map((conversation) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        isActive={activeConversationId === conversation.id}
                        isDeleting={deletingConversationId === conversation.id}
                        onDelete={handleDeleteConversation}
                      />
                    ))}
                  </Fragment>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Per-agent conversation sections */}
        {agentSections.map((section) => (
          <SidebarGroup key={section.agentId} className="pt-2">
            <SidebarGroupLabel className="flex items-center gap-1.5 px-2 text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
              <BotIcon className="size-3" />
              {section.agentName}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={activeConversationId === conversation.id}
                    isDeleting={deletingConversationId === conversation.id}
                    onDelete={handleDeleteConversation}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {agents.length > 0 && (
          <SidebarGroup className="pt-2">
            <SidebarGroupLabel className="px-2 text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
              Settings
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {agents.slice(0, 5).map((agent) => (
                  <SidebarMenuItem key={agent.id}>
                    <SidebarMenuButton
                      asChild
                      className="rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Link href={`/agents/${agent.id}/settings`}>
                        <SettingsIcon className="size-4" />
                        <span className="truncate">{agent.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-accent">
              <Avatar className="size-9 ring-2 ring-violet-200 dark:ring-violet-800">
                <AvatarFallback className="bg-gradient-to-br from-violet-400 to-purple-500 text-xs font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-foreground">
                  {session?.user?.name ?? "User"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
              <LogOutIcon
                className="size-4 shrink-0 cursor-pointer text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSignOut()
                }}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOutIcon className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete conversation?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        loading={Boolean(
          pendingDelete && deletingConversationId === pendingDelete.id
        )}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={confirmDeleteConversation}
      />
    </Sidebar>
  )
}

function ConversationItem({
  conversation,
  isActive,
  isDeleting,
  onDelete,
}: {
  conversation: Pick<
    SidebarConversation,
    "id" | "agentId" | "title" | "isDefaultAgent"
  >
  isActive: boolean
  isDeleting: boolean
  onDelete: (
    conversation: Pick<
      SidebarConversation,
      "id" | "agentId" | "isDefaultAgent"
    >,
    event: MouseEvent<HTMLButtonElement>
  ) => void
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className="rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
        isActive={isActive}
      >
        <Link href={buildConversationHref(conversation)}>
          <MessageSquareIcon className="size-4" />
          <span className="truncate">{conversation.title ?? "New chat"}</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuAction
        showOnHover
        aria-label="Delete conversation"
        disabled={isDeleting}
        onClick={(event) => onDelete(conversation, event)}
      >
        <Trash2Icon className="size-3.5" />
      </SidebarMenuAction>
    </SidebarMenuItem>
  )
}
