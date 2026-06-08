import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"

import { buildChatAttachmentStorageKey } from "@/lib/chat/attachments"
import { createChatAttachment } from "@/lib/chat/queries"
import {
  getAgentFileMimeType,
  validateAgentUploadFile,
} from "@/lib/agents/files"
import { getRequestSession } from "@/lib/auth-session"
import { deleteAgentFileFromMinio, uploadAgentFileToMinio } from "@/lib/minio"
import {
  deleteAgentFileFromOpenAI,
  uploadAgentFileToOpenAI,
} from "@/lib/openai"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const session = await getRequestSession(request)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

  const attachmentId = randomUUID()
  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = getAgentFileMimeType(file)
  const minioKey = buildChatAttachmentStorageKey({
    userId: session.user.id,
    attachmentId,
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

    const attachment = await createChatAttachment({
      id: attachmentId,
      userId: session.user.id,
      filename: file.name,
      mimeType,
      sizeBytes: file.size,
      minioKey,
      openaiFileId,
    })

    return NextResponse.json({ attachment }, { status: 201 })
  } catch (error) {
    console.error("Unable to upload chat attachment.", error)

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
