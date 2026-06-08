"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { AGENT_FILE_ACCEPT } from "@/lib/agents/files"
import {
  BookmarkIcon,
  CheckIcon,
  ExpandIcon,
  GlobeIcon,
  Loader2Icon,
  MinimizeIcon,
  PaperclipIcon,
  PlusIcon,
  SendHorizontalIcon,
  Trash2Icon,
  XIcon,
  ZapIcon,
} from "lucide-react"

type SavedPrompt = {
  id: string
  label: string
  content: string
}

export function ChatInput({
  agentId,
  attachments = [],
  disabled = false,
  isUploadingAttachment = false,
  placeholder = "Ask me anything...",
  onAttachFiles,
  onRemoveAttachment,
  onSubmit,
}: {
  agentId?: string
  attachments?: Array<{
    id: string
    filename: string
    mimeType: string
    sizeBytes: number
  }>
  disabled?: boolean
  isUploadingAttachment?: boolean
  placeholder?: string
  onAttachFiles?: (files: File[]) => void | Promise<void>
  onRemoveAttachment?: (attachmentId: string) => void
  onSubmit?: (
    message: string,
    options: { deeperResearch: boolean; webMode: boolean }
  ) => void | Promise<void>
}) {
  const [value, setValue] = useState("")
  const [expanded, setExpanded] = useState(false)
  const [deeperResearch, setDeeperResearch] = useState(false)
  const [webMode, setWebMode] = useState(false)
  const [savedPromptsOpen, setSavedPromptsOpen] = useState(false)
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([])
  const [promptsLoading, setPromptsLoading] = useState(false)
  const [newPromptOpen, setNewPromptOpen] = useState(false)
  const [newLabel, setNewLabel] = useState("")
  const [newContent, setNewContent] = useState("")
  const [savingPrompt, setSavingPrompt] = useState(false)
  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!savedPromptsOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSavedPromptsOpen(false)
        setNewPromptOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [savedPromptsOpen])

  useEffect(() => {
    if (!savedPromptsOpen || !agentId) return

    setPromptsLoading(true)
    fetch(`/api/saved-prompts?agentId=${agentId}`)
      .then((r) => r.json())
      .then((data) => setSavedPrompts(data.prompts ?? []))
      .catch(() => toast.error("Failed to load saved prompts."))
      .finally(() => setPromptsLoading(false))
  }, [savedPromptsOpen, agentId])

  const handleSubmit = async () => {
    const message = value.trim()

    if (!message || disabled) return

    await onSubmit?.(message, { deeperResearch, webMode })
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, expanded ? 400 : 200)}px`
  }, [value, expanded])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, expanded ? 400 : 200)}px`
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ""
    await onAttachFiles?.(files)
  }

  const handleSelectPrompt = (content: string) => {
    setValue(content)
    setSavedPromptsOpen(false)
    setNewPromptOpen(false)
    textareaRef.current?.focus()
  }

  const handleSavePrompt = async () => {
    if (!agentId || !newLabel.trim() || !newContent.trim()) return

    setSavingPrompt(true)
    try {
      const res = await fetch("/api/saved-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          label: newLabel.trim(),
          content: newContent.trim(),
        }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(data?.error ?? "Failed to save prompt.")
        return
      }

      setSavedPrompts((prev) => [data.prompt, ...prev])
      setNewLabel("")
      setNewContent("")
      setNewPromptOpen(false)
      toast.success("Prompt saved.")
    } finally {
      setSavingPrompt(false)
    }
  }

  const handleDeletePrompt = async (id: string) => {
    setDeletingPromptId(id)
    try {
      const res = await fetch(`/api/saved-prompts/${id}`, { method: "DELETE" })

      if (!res.ok) {
        toast.error("Failed to delete prompt.")
        return
      }

      setSavedPrompts((prev) => prev.filter((p) => p.id !== id))
    } finally {
      setDeletingPromptId(null)
    }
  }

  return (
    <div className="relative">
      {/* Saved prompts panel */}
      {savedPromptsOpen && (
        <div
          ref={panelRef}
          className="absolute bottom-full left-0 mb-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
          style={{ zIndex: 50 }}
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <span className="text-sm font-semibold text-foreground">
              Saved prompts
            </span>
            <div className="flex items-center gap-1">
              {agentId && (
                <button
                  onClick={() => setNewPromptOpen((v) => !v)}
                  className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                  title="New prompt"
                >
                  <PlusIcon className="size-3.5" />
                </button>
              )}
              <button
                onClick={() => {
                  setSavedPromptsOpen(false)
                  setNewPromptOpen(false)
                }}
                className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
          </div>

          {newPromptOpen && (
            <div className="border-b border-border p-3">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label"
                className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
              />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Prompt content"
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setNewPromptOpen(false)
                    setNewLabel("")
                    setNewContent("")
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePrompt}
                  disabled={
                    savingPrompt || !newLabel.trim() || !newContent.trim()
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-600 disabled:opacity-50"
                >
                  {savingPrompt ? (
                    <Loader2Icon className="size-3 animate-spin" />
                  ) : (
                    <CheckIcon className="size-3" />
                  )}
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto">
            {promptsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : savedPrompts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No saved prompts yet.
              </p>
            ) : (
              savedPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="group flex items-start gap-2 border-b border-border/50 px-3 py-2.5 last:border-0"
                >
                  <button
                    onClick={() => handleSelectPrompt(prompt.content)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-[13px] font-medium text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400">
                      {prompt.label}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11.5px] text-muted-foreground">
                      {prompt.content}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDeletePrompt(prompt.id)}
                    disabled={deletingPromptId === prompt.id}
                    className="mt-0.5 shrink-0 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                  >
                    {deletingPromptId === prompt.id ? (
                      <Loader2Icon className="size-3 animate-spin" />
                    ) : (
                      <Trash2Icon className="size-3" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_-16px_rgba(40,30,80,.18)] transition-all focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-200 dark:focus-within:border-violet-700 dark:focus-within:ring-violet-900/60">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={AGENT_FILE_ACCEPT}
          multiple
          onChange={handleFileChange}
        />
        <input
          ref={imageInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />

        {attachments.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-b border-border px-3 py-2">
            {attachments.map((attachment) => (
              <span
                key={attachment.id}
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-muted px-2 py-1 text-xs text-muted-foreground"
              >
                <PaperclipIcon className="size-3" />
                <span className="max-w-48 truncate">{attachment.filename}</span>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment?.(attachment.id)}
                  className="rounded p-0.5 hover:bg-background hover:text-foreground"
                  aria-label={`Remove ${attachment.filename}`}
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={2}
          className="max-h-[200px] min-h-14 resize-none border-0 bg-transparent px-5 pt-[18px] pb-1.5 text-[15.5px] leading-normal text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
          style={{ maxHeight: expanded ? "400px" : "200px" }}
        />

        {/* Mode badges */}
        {(deeperResearch || webMode) && (
          <div className="flex flex-wrap gap-1.5 px-4 pt-2 pb-1">
            {deeperResearch && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
                <ZapIcon className="size-2.5" />
                Deeper Research · gpt-5.4-mini
              </span>
            )}
            {webMode && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <GlobeIcon className="size-2.5" />
                Web search
              </span>
            )}
          </div>
        )}

        {/* Bottom toolbar */}
        <div className="flex items-center gap-2 px-3 pt-2 pb-3">
          <div className="flex min-w-0 items-center gap-2">
            {/* Deeper Research pill */}
            <button
              type="button"
              onClick={() => setDeeperResearch((v) => !v)}
              className={`flex h-[34px] items-center gap-1.5 rounded-full border px-[13px] text-[13px] font-semibold transition-colors ${
                deeperResearch
                  ? "border-violet-400 bg-violet-50 text-violet-600 dark:border-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
                  : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <ZapIcon className="size-3" />
              Deeper Research
            </button>
            {/* Image picker */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled || isUploadingAttachment}
              className="grid size-[34px] place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              title="Attach image"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Expand toggle */}
            <button
              type="button"
              onClick={() => {
                setExpanded((v) => !v)
                if (textareaRef.current) {
                  textareaRef.current.style.height = "auto"
                }
              }}
              className="grid size-[34px] place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <MinimizeIcon className="size-4" />
              ) : (
                <ExpandIcon className="size-4" />
              )}
            </button>
            {/* Web mode */}
            <button
              type="button"
              onClick={() => setWebMode((v) => !v)}
              className={`grid size-[34px] place-items-center rounded-lg transition-colors ${
                webMode
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
              title="Web mode"
            >
              <GlobeIcon className="size-4" />
            </button>
            {/* Send button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!value.trim() || disabled}
              className="flex size-9 items-center justify-center rounded-full bg-violet-500 text-white shadow-[0_6px_16px_-4px_rgba(216,199,255,.95)] transition-all hover:bg-violet-600 disabled:bg-violet-400 disabled:opacity-40"
            >
              <SendHorizontalIcon className="size-4" />
            </button>
          </div>
        </div>

        {/* Saved prompts row */}
        <div className="flex items-center justify-between border-t border-border px-3.5 py-[11px]">
          <button
            type="button"
            onClick={() => setSavedPromptsOpen((v) => !v)}
            className={`flex items-center gap-2 text-[13.5px] font-semibold transition-colors ${
              savedPromptsOpen
                ? "text-violet-600 dark:text-violet-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookmarkIcon className="size-3" />
            Saved prompts
          </button>
          <button
            type="button"
            disabled={disabled || isUploadingAttachment}
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <PaperclipIcon className="size-3.5" />
            {isUploadingAttachment ? "Uploading" : "Attach file"}
          </button>
        </div>
      </div>
    </div>
  )
}
