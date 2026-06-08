import { NextResponse } from "next/server"

import { deleteAgent, getAgent, updateAgent } from "@/lib/agents/queries"
import { parseAgentUpdateInput } from "@/lib/agents/validation"
import { getRequestSession } from "@/lib/auth-session"
import { deleteAgentVectorStore } from "@/lib/openai"

export async function GET(
  request: Request,
  context: RouteContext<"/api/agents/[id]">
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

  return NextResponse.json({ agent })
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/agents/[id]">
) {
  const session = await getRequestSession(request)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = parseAgentUpdateInput(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const { id } = await context.params
  const [agent] = await updateAgent(session.user.id, id, parsed.data)

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  return NextResponse.json({ agent })
}

export async function DELETE(
  request: Request,
  context: RouteContext<"/api/agents/[id]">
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

  const result = await deleteAgent(session.user.id, id)

  if (result.count === 0) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  if (agent.vectorStoreId) {
    await deleteAgentVectorStore(agent.vectorStoreId).catch((error) => {
      console.warn("Unable to delete vector store.", error)
    })
  }

  return new Response(null, { status: 204 })
}
