import { NextResponse } from "next/server"

import { deleteAgentFile, getAgentFile } from "@/lib/agents/queries"
import { deleteAgentFileFromMinio } from "@/lib/minio"
import { deleteAgentFileFromOpenAI } from "@/lib/openai"
import { getRequestSession } from "@/lib/auth-session"

export const runtime = "nodejs"

export async function DELETE(
  request: Request,
  context: { params: Promise<{ fileId: string }> }
) {
  const session = await getRequestSession(request)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { fileId } = await context.params
  const agentFile = await getAgentFile(session.user.id, fileId)

  if (!agentFile) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  if (agentFile.openaiFileId) {
    await deleteAgentFileFromOpenAI(agentFile.openaiFileId).catch((error) => {
      console.warn("Unable to delete OpenAI file.", error)
    })
  }

  await deleteAgentFileFromMinio(agentFile.minioKey).catch((error) => {
    console.warn("Unable to delete MinIO file.", error)
  })

  await deleteAgentFile(session.user.id, fileId)

  return new Response(null, { status: 204 })
}
