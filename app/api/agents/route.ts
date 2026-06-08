import { NextResponse } from "next/server"

import {
  listAgents,
  createAgent,
  setAgentVectorStoreId,
} from "@/lib/agents/queries"
import { parseAgentCreateInput } from "@/lib/agents/validation"
import { getRequestSession } from "@/lib/auth-session"
import { createAgentVectorStore } from "@/lib/openai"

export async function GET(request: Request) {
  const session = await getRequestSession(request)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const agents = await listAgents(session.user.id)

  return NextResponse.json({ agents })
}

export async function POST(request: Request) {
  const session = await getRequestSession(request)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = parseAgentCreateInput(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const agent = await createAgent(session.user.id, parsed.data)

  try {
    const vectorStore = await createAgentVectorStore({
      agentId: agent.id,
      name: agent.name,
    })
    const agentWithVectorStore = await setAgentVectorStoreId({
      userId: session.user.id,
      agentId: agent.id,
      vectorStoreId: vectorStore.id,
    })

    return NextResponse.json(
      { agent: agentWithVectorStore ?? agent },
      { status: 201 }
    )
  } catch (error) {
    console.warn("Agent created without vector store.", error)
    return NextResponse.json({ agent }, { status: 201 })
  }
}
