import OpenAI, { toFile } from "openai"
import type { FilePurpose } from "openai/resources/files"

let client: OpenAI | null = null

export function getOpenAIClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: requireEnv("OPENAI_API_KEY"),
    })
  }

  return client
}

export async function uploadAgentFileToOpenAI({
  buffer,
  filename,
  mimeType,
}: {
  buffer: Buffer
  filename: string
  mimeType: string
}) {
  const uploadable = await toFile(buffer, filename, { type: mimeType })

  return getOpenAIClient().files.create({
    file: uploadable,
    purpose: getFilePurpose(mimeType),
  })
}

export async function deleteAgentFileFromOpenAI(fileId: string) {
  await getOpenAIClient().files.delete(fileId)
}

export async function createAgentVectorStore({
  agentId,
  name,
}: {
  agentId: string
  name: string
}) {
  return getOpenAIClient().vectorStores.create({
    name: `${name} (${agentId})`,
    metadata: {
      agentId,
    },
  })
}

export async function deleteAgentVectorStore(vectorStoreId: string) {
  await getOpenAIClient().vectorStores.delete(vectorStoreId)
}

export async function attachFileToAgentVectorStore({
  vectorStoreId,
  fileId,
  agentId,
  filename,
}: {
  vectorStoreId: string
  fileId: string
  agentId: string
  filename: string
}) {
  return getOpenAIClient().vectorStores.files.createAndPoll(vectorStoreId, {
    file_id: fileId,
    attributes: {
      agentId,
      filename,
    },
  })
}

function getFilePurpose(mimeType: string): FilePurpose {
  if (mimeType.startsWith("image/")) {
    return "vision"
  }

  return "assistants"
}

function requireEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required.`)
  }

  return value
}
