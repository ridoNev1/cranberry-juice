import { prisma } from "@/lib/prisma"

export type MessageRole = "user" | "assistant" | "system"

export type ChatAttachmentInput = {
  id: string
  userId: string
  filename: string
  mimeType: string
  sizeBytes: number
  minioKey: string
  openaiFileId?: string | null
}

export async function listConversations(userId: string, agentId: string) {
  return prisma.conversation.findMany({
    where: { userId, agentId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  })
}

export async function listRecentConversations(userId: string) {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      agent: {
        select: {
          isDefault: true,
        },
      },
      _count: {
        select: { messages: true },
      },
    },
  })
}

export async function getConversation(userId: string, id: string) {
  return prisma.conversation.findFirst({
    where: { id, userId },
  })
}

export async function getAgentConversation({
  userId,
  agentId,
  conversationId,
}: {
  userId: string
  agentId: string
  conversationId: string
}) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, userId, agentId },
  })
}

export async function createConversation({
  userId,
  agentId,
  title,
}: {
  userId: string
  agentId: string
  title?: string | null
}) {
  return prisma.conversation.create({
    data: {
      userId,
      agentId,
      title,
    },
  })
}

export async function deleteConversation(userId: string, id: string) {
  return prisma.conversation.deleteMany({
    where: { id, userId },
  })
}

export async function listConversationMessages(
  userId: string,
  conversationId: string
) {
  const conversation = await getConversation(userId, conversationId)

  if (!conversation) {
    return null
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: {
      chatAttachments: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  return { conversation, messages }
}

export async function createMessage({
  conversationId,
  role,
  content,
  openaiResponseId,
}: {
  conversationId: string
  role: MessageRole
  content: string
  openaiResponseId?: string | null
}) {
  return prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      openaiResponseId,
    },
  })
}

export async function createChatAttachment(input: ChatAttachmentInput) {
  return prisma.chatAttachment.create({
    data: input,
  })
}

export async function listPendingChatAttachments(
  userId: string,
  attachmentIds: string[]
) {
  if (attachmentIds.length === 0) {
    return []
  }

  return prisma.chatAttachment.findMany({
    where: {
      id: { in: attachmentIds },
      userId,
      messageId: null,
    },
    orderBy: { createdAt: "asc" },
  })
}

export async function attachChatAttachmentsToMessage({
  userId,
  attachmentIds,
  agentId,
  conversationId,
  messageId,
}: {
  userId: string
  attachmentIds: string[]
  agentId: string
  conversationId: string
  messageId: string
}) {
  if (attachmentIds.length === 0) {
    return []
  }

  await prisma.chatAttachment.updateMany({
    where: {
      id: { in: attachmentIds },
      userId,
      messageId: null,
    },
    data: {
      agentId,
      conversationId,
      messageId,
    },
  })

  return prisma.chatAttachment.findMany({
    where: {
      id: { in: attachmentIds },
      userId,
      messageId,
    },
    orderBy: { createdAt: "asc" },
  })
}

export async function getLastAssistantResponseId(conversationId: string) {
  const message = await prisma.message.findFirst({
    where: {
      conversationId,
      role: "assistant",
      openaiResponseId: { not: null },
    },
    orderBy: { createdAt: "desc" },
    select: { openaiResponseId: true },
  })

  return message?.openaiResponseId ?? null
}

export async function touchConversation(id: string, title?: string | null) {
  return prisma.conversation.update({
    where: { id },
    data: {
      title: title === undefined ? undefined : title,
      updatedAt: new Date(),
    },
  })
}
