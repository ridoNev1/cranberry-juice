export const MAX_AGENT_FILE_SIZE_BYTES = 10 * 1024 * 1024

const ALLOWED_AGENT_FILE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
])

const ALLOWED_AGENT_FILE_EXTENSIONS = new Set([
  ".jpeg",
  ".jpg",
  ".pdf",
  ".png",
  ".webp",
])

export const AGENT_FILE_ACCEPT = [
  ...Array.from(ALLOWED_AGENT_FILE_EXTENSIONS),
  ...Array.from(ALLOWED_AGENT_FILE_TYPES),
].join(",")

type UploadFileMetadata = {
  name: string
  type: string
  size: number
}

export type AgentFileValidationResult =
  | { success: true }
  | { success: false; error: string }

export function validateAgentUploadFile(
  file: UploadFileMetadata
): AgentFileValidationResult {
  if (file.size <= 0) {
    return { success: false, error: "Choose a non-empty file." }
  }

  if (file.size > MAX_AGENT_FILE_SIZE_BYTES) {
    return { success: false, error: "Files must be 10 MB or smaller." }
  }

  if (!isSupportedAgentFileType(file)) {
    return {
      success: false,
      error: "Upload PDF or image files.",
    }
  }

  return { success: true }
}

export function isVectorStoreSupportedAgentFile(file: {
  name: string
  type: string
}) {
  return (
    file.type === "application/pdf" ||
    getFilenameExtension(file.name) === ".pdf"
  )
}

export function getAgentFileMimeType(file: { name: string; type: string }) {
  if (file.type) {
    return file.type
  }

  switch (getFilenameExtension(file.name)) {
    case ".jpeg":
    case ".jpg":
      return "image/jpeg"
    case ".pdf":
      return "application/pdf"
    case ".png":
      return "image/png"
    case ".webp":
      return "image/webp"
    default:
      return "application/octet-stream"
  }
}

function isSupportedAgentFileType(file: UploadFileMetadata) {
  if (ALLOWED_AGENT_FILE_TYPES.has(file.type)) {
    return true
  }

  if (file.type && file.type !== "application/octet-stream") {
    return false
  }

  return ALLOWED_AGENT_FILE_EXTENSIONS.has(getFilenameExtension(file.name))
}

export function buildAgentFileStorageKey({
  userId,
  agentId,
  fileId,
  filename,
}: {
  userId: string
  agentId: string
  fileId: string
  filename: string
}) {
  return `agents/${userId}/${agentId}/${fileId}-${sanitizeFilename(filename)}`
}

function sanitizeFilename(filename: string) {
  const trimmed = filename.trim() || "file"
  return trimmed
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9._-]/g, "")
    .replace(/_+/g, "_")
    .slice(0, 120)
}

function getFilenameExtension(filename: string) {
  const match = filename
    .trim()
    .toLowerCase()
    .match(/\.[^.]+$/)
  return match?.[0] ?? ""
}
