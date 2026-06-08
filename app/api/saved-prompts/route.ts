import { NextResponse } from "next/server"
import { z } from "zod"

import { getRequestSession } from "@/lib/auth-session"
import {
  createSavedPrompt,
  listSavedPrompts,
} from "@/lib/chat/saved-prompts"

export async function GET(request: Request) {
  const session = await getRequestSession(request)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get("agentId")

  if (!agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 })
  }

  const prompts = await listSavedPrompts(session.user.id, agentId)

  return NextResponse.json({ prompts })
}

const createSchema = z.object({
  agentId: z.string().min(1),
  label: z.string().min(1).max(100),
  content: z.string().min(1).max(4000),
})

export async function POST(request: Request) {
  const session = await getRequestSession(request)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const prompt = await createSavedPrompt({
    userId: session.user.id,
    agentId: parsed.data.agentId,
    label: parsed.data.label,
    content: parsed.data.content,
  })

  return NextResponse.json({ prompt }, { status: 201 })
}
