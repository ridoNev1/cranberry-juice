export type ConversationDateGroup<TConversation> = {
  label: "Today" | "Yesterday" | "Earlier"
  conversations: TConversation[]
}

export function buildConversationHref({
  id,
  agentId,
  isDefaultAgent,
}: {
  id: string
  agentId: string
  isDefaultAgent: boolean
}) {
  const path = isDefaultAgent ? "/chat" : `/chat/${agentId}`

  return `${path}?conversation=${id}`
}

export function buildChatRoomRenderKey(
  agentId: string,
  conversationId: string | null
) {
  return `${agentId}:${conversationId ?? "new"}`
}

type ConversationWithUpdatedAt = {
  updatedAt: Date
}

export function groupConversationsByDate<
  TConversation extends ConversationWithUpdatedAt,
>(
  conversations: TConversation[],
  now = new Date()
): ConversationDateGroup<TConversation>[] {
  const today = startOfDay(now)
  const yesterday = addDays(today, -1)
  const buckets: ConversationDateGroup<TConversation>[] = [
    { label: "Today", conversations: [] },
    { label: "Yesterday", conversations: [] },
    { label: "Earlier", conversations: [] },
  ]

  for (const conversation of conversations) {
    const updatedDay = startOfDay(conversation.updatedAt)

    if (updatedDay.getTime() === today.getTime()) {
      buckets[0]?.conversations.push(conversation)
      continue
    }

    if (updatedDay.getTime() === yesterday.getTime()) {
      buckets[1]?.conversations.push(conversation)
      continue
    }

    buckets[2]?.conversations.push(conversation)
  }

  return buckets.filter((bucket) => bucket.conversations.length > 0)
}

function startOfDay(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
