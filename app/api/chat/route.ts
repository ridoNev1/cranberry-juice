import { NextResponse } from "next/server"
import type {
  ResponseInput,
  ResponseStreamEvent,
} from "openai/resources/responses/responses"

import { getAgent, getOrCreateDefaultAgent } from "@/lib/agents/queries"
import {
  attachChatAttachmentsToMessage,
  createConversation,
  createMessage,
  getAgentConversation,
  getLastAssistantResponseId,
  listPendingChatAttachments,
  touchConversation,
} from "@/lib/chat/queries"
import {
  buildConversationTitle,
  parseChatRequestInput,
} from "@/lib/chat/validation"
import { getRequestSession } from "@/lib/auth-session"
import { getOpenAIClient } from "@/lib/openai"
import { checkRateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"

const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60_000

export async function POST(request: Request) {
  const session = await getRequestSession(request)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rateLimit = checkRateLimit(
    `chat:${session.user.id}`,
    RATE_LIMIT,
    RATE_WINDOW_MS
  )

  if (!rateLimit.allowed) {
    const retryAfterSec = Math.ceil(rateLimit.retryAfterMs / 1000)
    return NextResponse.json(
      { error: `Too many requests. Try again in ${retryAfterSec}s.` },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      }
    )
  }

  const parsed = parseChatRequestInput(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const agent = parsed.data.agentId
    ? await getAgent(session.user.id, parsed.data.agentId)
    : await getOrCreateDefaultAgent(session.user.id)

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  const existingConversation = parsed.data.conversationId
    ? await getAgentConversation({
        userId: session.user.id,
        agentId: agent.id,
        conversationId: parsed.data.conversationId,
      })
    : null

  if (parsed.data.conversationId && !existingConversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    )
  }

  const pendingAttachments = await listPendingChatAttachments(
    session.user.id,
    parsed.data.attachmentIds
  )

  if (pendingAttachments.length !== parsed.data.attachmentIds.length) {
    return NextResponse.json(
      { error: "One or more attachments are unavailable." },
      { status: 400 }
    )
  }

  const isNewConversation = !existingConversation
  const conversation =
    existingConversation ??
    (await createConversation({
      userId: session.user.id,
      agentId: agent.id,
      title: buildConversationTitle(parsed.data.message),
    }))
  const previousResponseId = await getLastAssistantResponseId(conversation.id)
  const userMessage = await createMessage({
    conversationId: conversation.id,
    role: "user",
    content: parsed.data.message,
  })
  const userMessageAttachments = await attachChatAttachmentsToMessage({
    userId: session.user.id,
    attachmentIds: parsed.data.attachmentIds,
    agentId: agent.id,
    conversationId: conversation.id,
    messageId: userMessage.id,
  })

  if (!isNewConversation) {
    await touchConversation(conversation.id)
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let assistantContent = ""
      let openaiResponseId: string | null = null

      sendEvent(controller, encoder, "start", {
        conversation,
        userMessage: {
          ...userMessage,
          attachments: userMessageAttachments.map((attachment) => ({
            id: attachment.id,
            filename: attachment.filename,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
          })),
        },
      })

      try {
        const model = parsed.data.deeperResearch ? "gpt-5.4-mini" : agent.model

        const tools: Parameters<
          ReturnType<typeof getOpenAIClient>["responses"]["create"]
        >[0]["tools"] = []

        if (agent.vectorStoreId) {
          tools.push({
            type: "file_search",
            vector_store_ids: [agent.vectorStoreId],
          })
        }

        if (parsed.data.webMode) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools.push({ type: "web_search_preview" } as any)
        }

        const openaiStream = await getOpenAIClient().responses.create({
          model,
          instructions: agent.systemPrompt,
          input: buildOpenAIInput(parsed.data.message, userMessageAttachments),
          previous_response_id: previousResponseId,
          tools: tools.length > 0 ? tools : undefined,
          stream: true,
        })

        for await (const event of openaiStream) {
          if (event.type === "response.output_text.delta") {
            assistantContent += event.delta
            sendEvent(controller, encoder, "delta", { delta: event.delta })
            continue
          }

          if (event.type === "response.completed") {
            openaiResponseId = event.response.id
            continue
          }

          assertOpenAIStreamEventIsHealthy(event)
        }

        const assistantMessage = await createMessage({
          conversationId: conversation.id,
          role: "assistant",
          content: assistantContent,
          openaiResponseId,
        })
        await touchConversation(conversation.id)

        sendEvent(controller, encoder, "done", {
          assistantMessage,
          openaiResponseId,
        })
      } catch (error) {
        console.error("Unable to stream chat response.", error)
        sendEvent(controller, encoder, "error", {
          error: "Unable to stream response.",
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

function buildOpenAIInput(
  message: string,
  attachments: Array<{ mimeType: string; openaiFileId: string | null }>
): string | ResponseInput {
  const openaiAttachments = attachments.filter(
    (attachment): attachment is { mimeType: string; openaiFileId: string } =>
      Boolean(attachment.openaiFileId)
  )

  if (openaiAttachments.length === 0) {
    return message
  }

  return [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: message,
        },
        ...openaiAttachments.map((attachment) =>
          attachment.mimeType.startsWith("image/")
            ? {
                type: "input_image" as const,
                detail: "auto" as const,
                file_id: attachment.openaiFileId,
              }
            : {
                type: "input_file" as const,
                file_id: attachment.openaiFileId,
              }
        ),
      ],
    },
  ]
}

function sendEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  event: string,
  data: unknown
) {
  controller.enqueue(
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  )
}

function assertOpenAIStreamEventIsHealthy(event: ResponseStreamEvent) {
  if (event.type === "response.failed") {
    throw new Error(event.response.error?.message ?? "OpenAI response failed.")
  }

  if (event.type === "response.incomplete") {
    throw new Error("OpenAI response was incomplete.")
  }

  if (event.type === "error") {
    throw new Error(event.message)
  }
}
