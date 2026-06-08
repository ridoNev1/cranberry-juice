import { NextResponse } from "next/server"

import { listConversationMessages } from "@/lib/chat/queries"
import { getRequestSession } from "@/lib/auth-session"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const result = await listConversationMessages(session.user.id, id)

  if (!result) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    )
  }

  return NextResponse.json(result)
}
