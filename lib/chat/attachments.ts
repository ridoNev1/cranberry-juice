export function buildChatAttachmentStorageKey({
  userId,
  attachmentId,
  filename,
}: {
  userId: string
  attachmentId: string
  filename: string
}) {
  return `chat/${userId}/${attachmentId}-${sanitizeFilename(filename)}`
}

function sanitizeFilename(filename: string) {
  const trimmed = filename.trim() || "file"
  return trimmed
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9._-]/g, "")
    .replace(/_+/g, "_")
    .slice(0, 120)
}
