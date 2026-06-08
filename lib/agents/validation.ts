import { z } from "zod"

import { AGENT_MODELS, type AgentModel } from "./models"

export type AgentInput = {
  name: string
  description: string | null
  model: AgentModel
  systemPrompt: string | null
}

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

const textField = z
  .string()
  .optional()
  .nullable()
  .transform((value) => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
  })

const agentInputSchema = z.object({
  name: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, "Agent name is required.")
        .max(80, "Agent name must be 80 characters or less.")
    ),
  description: textField,
  model: z.enum(AGENT_MODELS, {
    error: "Choose a supported model.",
  }),
  systemPrompt: textField,
})

const agentCreateSchema = agentInputSchema.extend({
  model: agentInputSchema.shape.model.default("gpt-4o-mini"),
})

const agentUpdateSchema = agentInputSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Provide at least one field to update."
  )

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
    error: result.error.issues[0]?.message ?? "Invalid agent data.",
  }
}

export function parseAgentCreateInput(input: unknown) {
  return parseWithMessage(agentCreateSchema, input)
}

export function parseAgentUpdateInput(input: unknown) {
  return parseWithMessage(agentUpdateSchema, input)
}
