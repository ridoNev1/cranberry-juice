"use client"

import { useSession } from "@/lib/auth-client"
import { ChatInput } from "@/components/chat/chat-input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { SparklesIcon, BarChart2Icon, LightbulbIcon, SearchIcon } from "lucide-react"

const SUGGESTED_PROMPTS = [
  {
    icon: BarChart2Icon,
    title: "Synthesize Data",
    description: "Turn my meeting notes into 5 key bullet points for the team.",
  },
  {
    icon: LightbulbIcon,
    title: "Creative Brainstorm",
    description: "Generate 3 taglines for a new sustainable fashion brand.",
  },
  {
    icon: SearchIcon,
    title: "Check Facts",
    description: "Compare key differences between GDPR and CCPA.",
  },
]

export default function ChatPage() {
  const { data: session } = useSession()
  const firstName = session?.user?.name?.split(" ")[0] ?? "there"

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between px-4 shrink-0 border-b border-border">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2 ml-1">
            <div className="flex size-6 items-center justify-center rounded-full bg-violet-500 dark:bg-violet-600 text-white">
              <SparklesIcon className="size-3.5" />
            </div>
            <span className="font-semibold text-sm text-foreground">Cranberry Juice</span>
          </div>
        </div>
      </header>

      {/* Welcome area */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-6 overflow-y-auto">
        <div className="w-full max-w-2xl flex flex-col items-center gap-6">

          {/* Purple orb — consistent across themes */}
          <div className="relative flex items-center justify-center size-32">
            <div className="absolute inset-0 rounded-full opacity-30 dark:opacity-20 blur-2xl bg-violet-400" />
            <div
              className="relative size-28 rounded-full shadow-lg"
              style={{
                background: "radial-gradient(circle at 35% 35%, #ffffff 0%, #c4b5fd 30%, #a78bfa 65%, #8b5cf6 100%)",
              }}
            />
          </div>

          {/* Greeting */}
          <div className="text-center space-y-1">
            <p className="text-2xl font-semibold text-violet-500 dark:text-violet-400">
              Hello, {firstName}
            </p>
            <h1 className="text-3xl font-bold text-foreground font-heading">
              How can I assist you today?
            </h1>
          </div>

          {/* Chat input */}
          <div className="w-full">
            <ChatInput />
          </div>

          {/* Suggested prompts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            {SUGGESTED_PROMPTS.map((prompt) => {
              const Icon = prompt.icon
              return (
                <button
                  key={prompt.title}
                  className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left hover:border-violet-300 dark:hover:border-violet-700 hover:bg-accent/50 transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <Icon className="size-5 text-muted-foreground group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors" />
                  <div>
                    <p className="font-semibold text-sm text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {prompt.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {prompt.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>


    </div>
  )
}
