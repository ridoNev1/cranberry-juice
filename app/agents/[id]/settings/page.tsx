import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { getAgent, listAgentFiles } from "@/lib/agents/queries"
import { getCurrentSession } from "@/lib/auth-current"
import { AgentForm } from "@/components/agents/agent-form"
import {
  FileUploader,
  type AgentFileView,
} from "@/components/agents/file-uploader"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function AgentSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  const { id } = await params
  const agent = await getAgent(session.user.id, id)

  if (!agent) {
    notFound()
  }

  const files = await listAgentFiles(session.user.id, agent.id)
  const fileViews: AgentFileView[] = files.map((file) => ({
    ...file,
    createdAt: file.createdAt.toISOString(),
  }))

  return (
    <div className="flex h-full flex-col overflow-hidden text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Button asChild variant="ghost" size="sm">
            <Link href="/agents">
              <ArrowLeftIcon />
              Agents
            </Link>
          </Button>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 md:p-6">
        <div>
          <h1 className="font-heading text-xl font-semibold">{agent.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit model selection, description, and the system prompt.
          </p>
        </div>

        <AgentForm agent={agent} />
        <FileUploader agentId={agent.id} initialFiles={fileViews} />
      </div>
    </div>
  )
}
