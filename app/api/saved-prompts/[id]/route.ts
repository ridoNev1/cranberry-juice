import { NextResponse } from "next/server"

import { getRequestSession } from "@/lib/auth-session"
import { deleteSavedPrompt } from "@/lib/chat/saved-prompts"

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const result = await deleteSavedPrompt(session.user.id, id)

  if (result.count === 0) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 })
  }

  return new Response(null, { status: 204 })
}
