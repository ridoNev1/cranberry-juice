"use client"

import { useRef, useState, type ChangeEvent } from "react"
import { toast } from "sonner"
import {
  FileIcon,
  Loader2Icon,
  PaperclipIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"

import { AGENT_FILE_ACCEPT } from "@/lib/agents/files"
import { Button } from "@/components/ui/button"

export type AgentFileView = {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
  openaiFileId: string | null
  vectorStoreStatus: string | null
  createdAt: string
}

export function FileUploader({
  agentId,
  initialFiles,
}: {
  agentId: string
  initialFiles: AgentFileView[]
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState(initialFiles)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    setIsUploading(true)

    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`/api/agents/${agentId}/files`, {
      method: "POST",
      body: formData,
    })
    const payload = await response.json().catch(() => null)
    setIsUploading(false)

    if (!response.ok) {
      toast.error(payload?.error ?? "Unable to upload file.")
      return
    }

    setFiles((current) => [payload.file, ...current])
    toast.success("File uploaded.")
  }

  async function handleDelete(fileId: string) {
    setDeletingId(fileId)

    const response = await fetch(`/api/files/${fileId}`, {
      method: "DELETE",
    })
    setDeletingId(null)

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      toast.error(payload?.error ?? "Unable to delete file.")
      return
    }

    setFiles((current) => current.filter((file) => file.id !== fileId))
    toast.success("File deleted.")
  }

  return (
    <section className="rounded-lg border bg-background">
      <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <PaperclipIcon className="size-4 text-muted-foreground" />
            <h2 className="font-heading text-base font-semibold">Files</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            PDF and images only. PDFs are indexed for chat search. Max 10 MB.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={AGENT_FILE_ACCEPT}
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <UploadIcon />
          )}
          Upload file
        </Button>
      </div>

      {files.length === 0 ? (
        <div className="flex min-h-36 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileIcon className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium">No files attached</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload PDFs or reference images for this agent.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex min-w-0 items-center justify-between gap-3 p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-card text-muted-foreground">
                  <FileIcon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {file.filename}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {formatFileSize(file.sizeBytes)} · {file.mimeType}
                    {file.vectorStoreStatus
                      ? ` · vector ${file.vectorStoreStatus}`
                      : ""}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(file.id)}
                disabled={deletingId === file.id}
                aria-label={`Delete ${file.filename}`}
              >
                {deletingId === file.id ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <Trash2Icon />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const kilobytes = bytes / 1024

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`
}
