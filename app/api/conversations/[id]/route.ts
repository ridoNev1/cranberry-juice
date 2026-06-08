import { NextResponse } from "next/server"

import { deleteConversation, getConversation } from "@/lib/chat/queries"
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
  const conversation = await getConversation(session.user.id, id)

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    )
  }

  return NextResponse.json({ conversation })
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const result = await deleteConversation(session.user.id, id)

  if (result.count === 0) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    )
  }

  return new Response(null, { status: 204 })
}
