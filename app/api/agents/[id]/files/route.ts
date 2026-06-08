import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"

import { createAgentFile, getAgent, listAgentFiles } from "@/lib/agents/queries"
import {
  buildAgentFileStorageKey,
  getAgentFileMimeType,
  isVectorStoreSupportedAgentFile,
  validateAgentUploadFile,
} from "@/lib/agents/files"
import { ensureAgentVectorStore } from "@/lib/agents/vector-store"
import { deleteAgentFileFromMinio, uploadAgentFileToMinio } from "@/lib/minio"
import {
  attachFileToAgentVectorStore,
  deleteAgentFileFromOpenAI,
  uploadAgentFileToOpenAI,
} from "@/lib/openai"
import { getRequestSession } from "@/lib/auth-session"

export const runtime = "nodejs"

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

  const files = await listAgentFiles(session.user.id, id)

  return NextResponse.json({ files })
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

  const formData = await request.formData().catch(() => null)
  const file = formData?.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Choose a file to upload." },
      { status: 400 }
    )
  }

  const validation = validateAgentUploadFile(file)

  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const fileId = randomUUID()
  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = getAgentFileMimeType(file)
  const minioKey = buildAgentFileStorageKey({
    userId: session.user.id,
    agentId: id,
    fileId,
    filename: file.name,
  })
  let openaiFileId: string | null = null
  let minioUploaded = false

  try {
    await uploadAgentFileToMinio({
      key: minioKey,
      body: buffer,
      contentType: mimeType,
    })
    minioUploaded = true

    const openaiFile = await uploadAgentFileToOpenAI({
      buffer,
      filename: file.name,
      mimeType,
    })
    openaiFileId = openaiFile.id

    let openaiVectorStoreFileId: string | null = null
    let vectorStoreStatus: string | null = null

    if (isVectorStoreSupportedAgentFile({ name: file.name, type: mimeType })) {
      vectorStoreStatus = "in_progress"
      try {
        const vectorStoreId = await ensureAgentVectorStore({
          userId: session.user.id,
          agent,
        })
        const vectorStoreFile = await attachFileToAgentVectorStore({
          vectorStoreId,
          fileId: openaiFile.id,
          agentId: agent.id,
          filename: file.name,
        })
        openaiVectorStoreFileId = vectorStoreFile.id
        vectorStoreStatus = vectorStoreFile.status
      } catch (vectorStoreError) {
        vectorStoreStatus = "failed"
        console.warn("Unable to attach file to vector store.", vectorStoreError)
      }
    }

    const agentFile = await createAgentFile({
      id: fileId,
      agentId: id,
      userId: session.user.id,
      filename: file.name,
      mimeType,
      sizeBytes: file.size,
      minioKey,
      openaiFileId,
      openaiVectorStoreFileId,
      vectorStoreStatus,
    })

    return NextResponse.json({ file: agentFile }, { status: 201 })
  } catch (error) {
    console.error("Unable to upload agent file.", error)

    if (openaiFileId) {
      await deleteAgentFileFromOpenAI(openaiFileId).catch((cleanupError) => {
        console.warn("Unable to clean up OpenAI file.", cleanupError)
      })
    }

    if (minioUploaded) {
      await deleteAgentFileFromMinio(minioKey).catch((cleanupError) => {
        console.warn("Unable to clean up MinIO file.", cleanupError)
      })
    }

    return NextResponse.json(
      { error: "Unable to upload file." },
      { status: 500 }
    )
  }
}
