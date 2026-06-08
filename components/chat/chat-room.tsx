"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "sonner"
import {
  BarChart2Icon,
  BotIcon,
  LightbulbIcon,
  Loader2Icon,
  SearchIcon,
  UserIcon,
} from "lucide-react"

import { ChatInput } from "@/components/chat/chat-input"
import { cn } from "@/lib/utils"

type ChatRole = "user" | "assistant" | "system"

export type ChatRoomMessage = {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  attachments?: ChatRoomAttachment[]
}

export type ChatRoomAttachment = {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
}

type StreamEvent =
  | {
      type: "start"
      data: {
        conversation: { id: string }
        userMessage: ChatRoomMessage
      }
    }
  | { type: "delta"; data: { delta: string } }
  | {
      type: "done"
      data: {
        assistantMessage: ChatRoomMessage
        openaiResponseId: string | null
      }
    }
  | { type: "error"; data: { error: string } }

const GLOBAL_SUGGESTED_PROMPTS = [
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

export function ChatRoom({
  agent,
  conversationBasePath,
  emptyDescription = "Ask a question to start a conversation with this agent.",
  emptyTitle = `${agent.name} is ready`,
  initialConversationId,
  initialMessages,
}: {
  agent: {
    id: string
    name: string
    model: string
  }
  conversationBasePath: string
  emptyDescription?: string
  emptyLayout?: "agent" | "global"
  emptyTitle?: string
  initialConversationId: string | null
  initialMessages: ChatRoomMessage[]
}) {
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [conversationId, setConversationId] = useState(initialConversationId)
  const [messages, setMessages] = useState(initialMessages)
  const [attachments, setAttachments] = useState<ChatRoomAttachment[]>([])
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isStreaming])

  async function handleSubmit(
    message: string,
    options: { deeperResearch: boolean; webMode: boolean } = {
      deeperResearch: false,
      webMode: false,
    }
  ) {
    if (isStreaming) {
      return
    }

    const messageAttachments = attachments
    const userTempId = `user-${crypto.randomUUID()}`
    const assistantTempId = `assistant-${crypto.randomUUID()}`

    setMessages((current) => [
      ...current,
      {
        id: userTempId,
        role: "user",
        content: message,
        createdAt: new Date().toISOString(),
        attachments: messageAttachments,
      },
      {
        id: assistantTempId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      },
    ])
    setIsStreaming(true)

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: agent.id,
        attachmentIds: messageAttachments.map((attachment) => attachment.id),
        conversationId,
        message,
        deeperResearch: options.deeperResearch,
        webMode: options.webMode,
      }),
    }).catch(() => null)

    if (!response?.ok || !response.body) {
      const payload = await response?.json().catch(() => null)
      setIsStreaming(false)
      setMessages((current) =>
        current.filter((item) => item.id !== assistantTempId)
      )
      toast.error(payload?.error ?? "Unable to send message.")
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let receivedConversationId = conversationId

    try {
      while (true) {
        const { value, done } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const result = consumeStreamEvents(buffer)
        buffer = result.remaining

        for (const event of result.events) {
          if (event.type === "start") {
            receivedConversationId = event.data.conversation.id
            setConversationId(event.data.conversation.id)
            setAttachments([])
            setMessages((current) =>
              current.map((item) =>
                item.id === userTempId ? event.data.userMessage : item
              )
            )
            continue
          }

          if (event.type === "delta") {
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantTempId
                  ? { ...item, content: item.content + event.data.delta }
                  : item
              )
            )
            continue
          }

          if (event.type === "done") {
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantTempId ? event.data.assistantMessage : item
              )
            )
            continue
          }

          toast.error(event.data.error)
          setMessages((current) =>
            current.map((item) =>
              item.id === assistantTempId
                ? { ...item, content: `Error: ${event.data.error}` }
                : item
            )
          )
        }
      }
    } catch (error) {
      console.error(error)
      toast.error("The chat stream was interrupted.")
    } finally {
      setIsStreaming(false)
      if (!conversationId && receivedConversationId) {
        router.replace(
          `${conversationBasePath}?conversation=${receivedConversationId}`
        )
        router.refresh()
      }
    }
  }

  async function handleAttachFiles(files: File[]) {
    if (files.length === 0 || isUploadingAttachment) {
      return
    }

    setIsUploadingAttachment(true)

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/chat/files", {
          method: "POST",
          body: formData,
        })
        const payload = await response.json().catch(() => null)

        if (!response.ok) {
          toast.error(payload?.error ?? "Unable to upload file.")
          continue
        }

        setAttachments((current) => [...current, payload.attachment])
      }
    } finally {
      setIsUploadingAttachment(false)
    }
  }

  function handleRemoveAttachment(attachmentId: string) {
    setAttachments((current) =>
      current.filter((attachment) => attachment.id !== attachmentId)
    )
  }

  const sharedInput = (
    <ChatInput
      agentId={agent.id}
      attachments={attachments}
      disabled={isStreaming || isUploadingAttachment}
      isUploadingAttachment={isUploadingAttachment}
      placeholder={`Message ${agent.name}`}
      onAttachFiles={handleAttachFiles}
      onRemoveAttachment={handleRemoveAttachment}
      onSubmit={(message, options) => handleSubmit(message, options)}
    />
  )
  const showOnboardingEmptyState = messages.length === 0

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
        {showOnboardingEmptyState ? (
          <div className="flex min-h-full flex-col items-center justify-center px-2 pb-6">
            <div className="flex w-full max-w-[720px] flex-col items-center">
              <div className="mb-1.5 grid h-[138px] place-items-center">
                <div
                  className="size-[120px] rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at 38% 34%, #ffffff 0%, rgba(255,255,255,.4) 14%, transparent 32%), radial-gradient(circle at 50% 50%, #a78bfa 0%, #c084fc 42%, #8b5cf6 70%, transparent 74%)",
                    boxShadow:
                      "0 0 60px 8px rgba(216,199,255,.95), inset 0 0 30px rgba(255,255,255,.5)",
                    animation:
                      "cranberry-orb-float 5.5s ease-in-out infinite, cranberry-orb-hue 9s linear infinite",
                    filter: "saturate(1.05)",
                  }}
                />
              </div>

              <div className="text-center">
                <p className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text font-heading text-[30px] leading-[1.08] font-bold tracking-normal text-transparent sm:text-[36px]">
                  {emptyTitle}
                </p>
                <h1 className="mt-1 font-heading text-[34px] leading-tight font-bold tracking-normal text-foreground sm:text-[38px]">
                  {emptyDescription}
                </h1>
              </div>

              <div className="mt-[34px] w-full">{sharedInput}</div>

              <div className="mt-4 grid w-full grid-cols-1 gap-[14px] sm:grid-cols-3">
                {GLOBAL_SUGGESTED_PROMPTS.map((prompt) => {
                  const Icon = prompt.icon

                  return (
                    <button
                      key={prompt.title}
                      type="button"
                      onClick={() => handleSubmit(prompt.description)}
                      className="group flex cursor-pointer flex-col rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-950/10 dark:hover:border-violet-700"
                    >
                      <span className="mb-[26px] flex size-[30px] items-center justify-center rounded-lg bg-violet-50 text-violet-500 dark:bg-violet-950/40 dark:text-violet-400">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[14.5px] leading-tight font-semibold tracking-normal text-foreground transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400">
                          {prompt.title}
                        </p>
                        <p className="mt-1 text-[12.5px] leading-[1.45] text-muted-foreground">
                          {prompt.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isStreaming ? (
              <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                <Loader2Icon className="size-3.5 animate-spin" />
                Streaming response
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {!showOnboardingEmptyState ? (
        <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-4">
          {sharedInput}
        </div>
      ) : null}
    </div>
  )
}

function MessageBubble({ message }: { message: ChatRoomMessage }) {
  const isUser = message.role === "user"

  return (
    <article
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser ? (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500 text-white">
          <BotIcon className="size-4" />
        </div>
      ) : null}

      <div
        className={cn(
          "max-w-[85%] min-w-0 rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-background dark:text-white"
            : "border bg-background text-foreground"
        )}
      >
        {message.attachments?.length ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {message.attachments.map((attachment) => (
              <span
                key={attachment.id}
                className="rounded-md border border-current/15 px-2 py-1 text-xs opacity-80"
              >
                {attachment.filename}
              </span>
            ))}
          </div>
        ) : null}

        {message.content ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => (
                <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>
              ),
              code: ({ children }) => (
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
                  {children}
                </code>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <Loader2Icon className="size-3.5 animate-spin" />
            Thinking
          </span>
        )}
      </div>

      {isUser ? (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <UserIcon className="size-4" />
        </div>
      ) : null}
    </article>
  )
}

function consumeStreamEvents(buffer: string) {
  const chunks = buffer.split("\n\n")
  const remaining = chunks.pop() ?? ""
  const events = chunks
    .map(parseStreamEvent)
    .filter((event): event is StreamEvent => Boolean(event))

  return { events, remaining }
}

function parseStreamEvent(chunk: string): StreamEvent | null {
  const eventLine = chunk.split("\n").find((line) => line.startsWith("event: "))
  const dataLine = chunk.split("\n").find((line) => line.startsWith("data: "))

  if (!eventLine || !dataLine) {
    return null
  }

  return {
    type: eventLine.slice("event: ".length),
    data: JSON.parse(dataLine.slice("data: ".length)),
  } as StreamEvent
}
