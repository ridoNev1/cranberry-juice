export const AGENT_MODEL_OPTIONS = [
  {
    id: "gpt-4o-mini",
    label: "GPT-4o mini",
    category: "Fast",
  },
  {
    id: "gpt-4.1-mini",
    label: "GPT-4.1 mini",
    category: "Balanced",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    category: "Multimodal",
  },
  {
    id: "gpt-5-mini",
    label: "GPT-5 mini",
    category: "Reasoning",
  },
  {
    id: "gpt-5.4-mini",
    label: "GPT-5.4 mini",
    category: "Reasoning",
  },
] as const

export const AGENT_MODELS = AGENT_MODEL_OPTIONS.map((model) => model.id) as [
  (typeof AGENT_MODEL_OPTIONS)[number]["id"],
  ...(typeof AGENT_MODEL_OPTIONS)[number]["id"][],
]

export type AgentModel = (typeof AGENT_MODELS)[number]

export function getAgentModelOption(modelId: string) {
  return AGENT_MODEL_OPTIONS.find((model) => model.id === modelId)
}
