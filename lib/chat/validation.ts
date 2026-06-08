import { z } from "zod"

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

const optionalTrimmedText = z
  .string()
  .optional()
  .nullable()
  .transform((value) => {
    const trimmed = value?.trim()
    return trimmed || null
  })

const chatRequestSchema = z.object({
  agentId: optionalTrimmedText,
  attachmentIds: z.array(z.string().trim().min(1)).max(5).default([]),
  conversationId: optionalTrimmedText,
  deeperResearch: z.boolean().default(false),
  webMode: z.boolean().default(false),
  message: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, "Message is required.")
        .max(20_000, "Message must be 20,000 characters or less.")
    ),
})

const conversationCreateSchema = z.object({
  title: optionalTrimmedText,
})

export type ChatRequestInput = z.infer<typeof chatRequestSchema>
export type ConversationCreateInput = z.infer<typeof conversationCreateSchema>

export function parseChatRequestInput(
  input: unknown
): ParseResult<ChatRequestInput> {
  return parseWithMessage(chatRequestSchema, input)
}

export function parseConversationCreateInput(
  input: unknown
): ParseResult<ConversationCreateInput> {
  return parseWithMessage(conversationCreateSchema, input)
}

export function buildConversationTitle(message: string) {
  const compact = message.trim().replace(/\s+/g, " ")

  if (compact.length <= 60) {
    return compact || "New chat"
  }

  const prefix = compact.slice(0, 57).trimEnd()
  const lastSpaceIndex = prefix.lastIndexOf(" ")

  return `${prefix.slice(0, lastSpaceIndex).trimEnd()}...`
}

function parseWithMessage<T>(
  schema: z.ZodType<T>,
  input: unknown
): ParseResult<T> {
  const result = schema.safeParse(input)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return {
    success: false,
    error: result.error.issues[0]?.message ?? "Invalid chat data.",
  }
}
