"use client"

import { useRouter } from "next/navigation"
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
import {
  PlusIcon,
  SearchIcon,
  GlobeIcon,
  LibraryIcon,
  FolderIcon,
  HistoryIcon,
  LogOutIcon,
  SparklesIcon,
} from "lucide-react"

const NAV_ITEMS = [
  { icon: GlobeIcon, label: "Explore" },
  { icon: LibraryIcon, label: "Library" },
  { icon: FolderIcon, label: "Files" },
  { icon: HistoryIcon, label: "History" },
]

const HISTORY = {
  Today: [
    "Create a detailed 7-day sprint plan f…",
    "Draft a concise email to stakeholder…",
    "Analyze the 'Eisenhower Matrix' an…",
  ],
  Yesterday: [
    "Summarize the main differences be…",
    "I need to negotiate an extension for …",
  ],
  "7 days": [
    "Generate 5 effective morning habits…",
    "As a non-technical PM, list 5 crucial…",
    "Help me allocate 8 hours tomorrow…",
    "We need a creative name for our ne…",
    "Write a 100-word positive feedback…",
  ],
}

export function ChatSidebar() {
  const router = useRouter()
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
    router.refresh()
  }

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?"

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="px-4 pt-4 pb-2">
        {/* Logo */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-violet-500 dark:bg-violet-600 text-white shadow-sm">
              <SparklesIcon className="size-4" />
            </div>
            <span className="font-bold text-base text-foreground">Cranberry</span>
          </div>
        </div>

        {/* New chat button */}
        <button
          onClick={() => router.push("/chat")}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold bg-foreground text-background hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <PlusIcon className="size-4" />
          New chat
        </button>

        {/* Search */}
        <div className="relative mt-2">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            placeholder="Search"
            className="w-full rounded-lg border border-border bg-background/60 pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded bg-muted text-muted-foreground">
            <span className="text-[9px] font-mono">⌘K</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Nav items */}
        <SidebarGroup className="pb-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ icon: Icon, label }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton className="gap-3 text-muted-foreground hover:text-foreground rounded-lg">
                    <Icon className="size-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Chat history */}
        {Object.entries(HISTORY).map(([period, chats]) => (
          <SidebarGroup key={period} className="pt-2">
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-2">
              {period}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {chats.map((chat, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuButton className="text-xs text-muted-foreground hover:text-foreground rounded-lg px-2 truncate">
                      <span className="truncate">{chat}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 hover:bg-accent transition-colors group">
              <Avatar className="size-9 ring-2 ring-violet-200 dark:ring-violet-800">
                <AvatarFallback className="bg-gradient-to-br from-violet-400 to-purple-500 text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{session?.user?.name ?? "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              </div>
              <LogOutIcon
                className="size-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); handleSignOut() }}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOutIcon className="size-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
