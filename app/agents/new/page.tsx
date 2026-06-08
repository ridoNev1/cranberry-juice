import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { getCurrentSession } from "@/lib/auth-current"
import { AgentForm } from "@/components/agents/agent-form"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"

export default async function NewAgentPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

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
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 md:p-6">
        <div>
          <h1 className="font-heading text-xl font-semibold">Create agent</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set the model and system prompt that define this project agent.
          </p>
        </div>

        <AgentForm />
      </div>
    </div>
  )
}
