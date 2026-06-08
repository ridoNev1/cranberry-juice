import { prisma } from "@/lib/prisma"
import type { AgentInput } from "@/lib/agents/validation"

export type AgentSummary = {
  id: string
  name: string
  description: string | null
  model: string
  systemPrompt: string | null
  vectorStoreId: string | null
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
  _count: {
    conversations: number
    agentFiles: number
  }
}

export type AgentFileInput = {
  id: string
  agentId: string
  userId: string
  filename: string
  mimeType: string
  sizeBytes: number
  minioKey: string
  openaiFileId?: string | null
  openaiVectorStoreFileId?: string | null
  vectorStoreStatus?: string | null
}

export async function listAgents(userId: string) {
  return prisma.agent.findMany({
    where: { userId, isDefault: false },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          conversations: true,
          agentFiles: true,
        },
      },
    },
  })
}

export async function getOrCreateDefaultAgent(userId: string) {
  const existingAgent = await prisma.agent.findFirst({
    where: { userId, isDefault: true },
    include: {
      _count: {
        select: {
          conversations: true,
          agentFiles: true,
        },
      },
    },
  })

  if (existingAgent) {
    return existingAgent
  }

  return prisma.agent.create({
    data: {
      userId,
      isDefault: true,
      name: "Cranberry Assistant",
      description: "Default assistant for regular chats.",
      model: "gpt-4o-mini",
    },
    include: {
      _count: {
        select: {
          conversations: true,
          agentFiles: true,
        },
      },
    },
  })
}

export async function getAgent(userId: string, id: string) {
  return prisma.agent.findFirst({
    where: { id, userId },
    include: {
      _count: {
        select: {
          conversations: true,
          agentFiles: true,
        },
      },
    },
  })
}

export async function createAgent(
  userId: string,
  input: AgentInput,
  options?: { vectorStoreId?: string | null }
) {
  return prisma.agent.create({
    data: {
      ...input,
      userId,
      vectorStoreId: options?.vectorStoreId,
    },
  })
}

export async function updateAgent(
  userId: string,
  id: string,
  input: Partial<AgentInput>
) {
  return prisma.agent.updateManyAndReturn({
    where: { id, userId },
    data: input,
  })
}

export async function deleteAgent(userId: string, id: string) {
  return prisma.agent.deleteMany({
    where: { id, userId },
  })
}

export async function setAgentVectorStoreId({
  userId,
  agentId,
  vectorStoreId,
}: {
  userId: string
  agentId: string
  vectorStoreId: string
}) {
  const [agent] = await prisma.agent.updateManyAndReturn({
    where: { id: agentId, userId },
    data: { vectorStoreId },
  })

  return agent ?? null
}

export async function listAgentFiles(userId: string, agentId: string) {
  return prisma.agentFile.findMany({
    where: { userId, agentId },
    orderBy: { createdAt: "desc" },
  })
}

export async function createAgentFile(input: AgentFileInput) {
  return prisma.agentFile.create({
    data: input,
  })
}

export async function getAgentFile(userId: string, id: string) {
  return prisma.agentFile.findFirst({
    where: { id, userId },
  })
}

export async function deleteAgentFile(userId: string, id: string) {
  return prisma.agentFile.deleteMany({
    where: { id, userId },
  })
}

export async function updateAgentFileVectorStore({
  userId,
  fileId,
  openaiVectorStoreFileId,
  vectorStoreStatus,
}: {
  userId: string
  fileId: string
  openaiVectorStoreFileId?: string | null
  vectorStoreStatus: string
}) {
  const [agentFile] = await prisma.agentFile.updateManyAndReturn({
    where: { id: fileId, userId },
    data: {
      openaiVectorStoreFileId,
      vectorStoreStatus,
    },
  })

  return agentFile ?? null
}
