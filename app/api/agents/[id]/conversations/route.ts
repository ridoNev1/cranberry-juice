import { NextResponse } from "next/server"

import { getAgent } from "@/lib/agents/queries"
import { createConversation, listConversations } from "@/lib/chat/queries"
import { parseConversationCreateInput } from "@/lib/chat/validation"
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
  const agent = await getAgent(session.user.id, id)

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  const conversations = await listConversations(session.user.id, id)

  return NextResponse.json({ conversations })
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const agent = await getAgent(session.user.id, id)

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  const parsed = parseConversationCreateInput(
    await request.json().catch(() => ({}))
  )

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const conversation = await createConversation({
    userId: session.user.id,
    agentId: id,
    title: parsed.data.title,
  })

  return NextResponse.json({ conversation }, { status: 201 })
}
