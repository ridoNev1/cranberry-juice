import Link from "next/link"
import { redirect } from "next/navigation"
import {
  BotIcon,
  MessageSquareIcon,
  PaperclipIcon,
  PlusIcon,
  SettingsIcon,
} from "lucide-react"

import { listAgents } from "@/lib/agents/queries"
import { getCurrentSession } from "@/lib/auth-current"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function AgentsPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  const agents = await listAgents(session.user.id)

  return (
    <div className="flex h-full flex-col overflow-hidden text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-semibold">
              Project agents
            </p>
            <p className="text-xs text-muted-foreground">Agents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/agents/new">
              <PlusIcon />
              New agent
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 md:p-6">
        {agents.length === 0 ? (
          <section className="flex min-h-[420px] flex-1 flex-col items-center justify-center rounded-lg border border-dashed bg-background px-6 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BotIcon className="size-6" />
            </div>
            <h2 className="font-heading text-xl font-semibold">
              Create your first agent
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Agents hold model choice, instructions, files, and conversation
              history for each project.
            </p>
            <Button asChild className="mt-5">
              <Link href="/agents/new">
                <PlusIcon />
                New agent
              </Link>
            </Button>
          </section>
        ) : (
          <section className="grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent.id} className="rounded-lg">
                <CardHeader>
                  <CardTitle>{agent.name}</CardTitle>
                  <CardDescription>
                    {agent.description || "No description yet."}
                  </CardDescription>
                  <CardAction>
                    <Button asChild variant="ghost" size="icon-sm">
                      <Link
                        href={`/agents/${agent.id}/settings`}
                        aria-label={`Open ${agent.name} settings`}
                      >
                        <SettingsIcon />
                      </Link>
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="rounded-md border bg-background px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Model</span>
                    <p className="font-mono text-xs">{agent.model}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MessageSquareIcon className="size-4" />
                      {agent._count.conversations} chats
                    </div>
                    <div className="flex items-center gap-2">
                      <PaperclipIcon className="size-4" />
                      {agent._count.agentFiles} files
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={`/chat/${agent.id}`}>Open chat</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/agents/${agent.id}/settings`}>
                        Settings
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
