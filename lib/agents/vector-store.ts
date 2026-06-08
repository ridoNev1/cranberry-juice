import type { Agent } from "@prisma/client"

import { setAgentVectorStoreId } from "@/lib/agents/queries"
import { createAgentVectorStore } from "@/lib/openai"

export async function ensureAgentVectorStore({
  userId,
  agent,
}: {
  userId: string
  agent: Pick<Agent, "id" | "name" | "vectorStoreId">
}) {
  if (agent.vectorStoreId) {
    return agent.vectorStoreId
  }

  const vectorStore = await createAgentVectorStore({
    agentId: agent.id,
    name: agent.name,
  })

  await setAgentVectorStoreId({
    userId,
    agentId: agent.id,
    vectorStoreId: vectorStore.id,
  })

  return vectorStore.id
}
