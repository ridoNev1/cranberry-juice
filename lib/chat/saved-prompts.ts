import { prisma } from "@/lib/prisma"

export async function listSavedPrompts(userId: string, agentId: string) {
  return prisma.savedPrompt.findMany({
    where: { userId, agentId },
    orderBy: { createdAt: "desc" },
  })
}

export async function createSavedPrompt({
  userId,
  agentId,
  label,
  content,
}: {
  userId: string
  agentId: string
  label: string
  content: string
}) {
  return prisma.savedPrompt.create({
    data: { userId, agentId, label, content },
  })
}

export async function deleteSavedPrompt(userId: string, id: string) {
  return prisma.savedPrompt.deleteMany({
    where: { id, userId },
  })
}
