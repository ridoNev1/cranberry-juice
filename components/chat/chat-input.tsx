"use client"

import { useState, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"
import { SendHorizontalIcon, PaperclipIcon, MonitorIcon, GlobeIcon, ZapIcon, BookmarkIcon } from "lucide-react"

export function ChatInput() {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    if (!value.trim()) return
    console.log("Send:", value)
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

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
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-md overflow-hidden focus-within:border-violet-300 dark:focus-within:border-violet-700 focus-within:ring-1 focus-within:ring-violet-200 dark:focus-within:ring-violet-800 transition-all">
      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Ask me anything…"
        rows={2}
        className="min-h-[64px] max-h-[200px] resize-none border-0 bg-transparent px-4 pt-4 pb-2 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground text-foreground"
      />

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        <div className="flex items-center gap-1">
          {/* Deeper Research pill */}
          <button className="flex items-center gap-1.5 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 px-3 py-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors">
            <ZapIcon className="size-3" />
            Deeper Research
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
            <MonitorIcon className="size-4" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
            <GlobeIcon className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Attach file */}
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <PaperclipIcon className="size-3.5" />
            Attach file
          </button>

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="flex size-8 items-center justify-center rounded-full transition-all disabled:opacity-30 bg-violet-500 hover:bg-violet-600 disabled:bg-muted"
          >
            <SendHorizontalIcon className="size-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* Saved prompts row */}
      <div className="flex items-center border-t border-border px-4 py-2">
        <button className="flex items-center gap-1.5 text-xs text-violet-500 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition-colors">
          <BookmarkIcon className="size-3" />
          Saved prompts
        </button>
      </div>
    </div>
  )
}
