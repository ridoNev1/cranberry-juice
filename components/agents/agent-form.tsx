"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Form, Field as FormischField, useForm } from "@formisch/react"
import type { SubmitHandler } from "@formisch/react"
import * as v from "valibot"
import { toast } from "sonner"
import {
  BotIcon,
  FileTextIcon,
  Loader2Icon,
  MessageSquareIcon,
  PaperclipIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react"

import {
  AGENT_MODEL_OPTIONS,
  AGENT_MODELS,
  getAgentModelOption,
  type AgentModel,
} from "@/lib/agents/models"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type AgentFormValues = {
  id?: string
  name?: string
  description?: string | null
  model?: string
  systemPrompt?: string | null
  _count?: {
    conversations?: number
    agentFiles?: number
  }
}

const nullableText = v.pipe(
  v.string(),
  v.transform((value) => {
    const trimmed = value.trim()
    return trimmed || null
  })
)

const AgentFormSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Please enter agent name."),
    v.maxLength(80, "Agent name must be 80 characters or less.")
  ),
  description: nullableText,
  model: v.picklist(AGENT_MODELS, "Choose a supported model."),
  systemPrompt: nullableText,
})

export function AgentForm({ agent }: { agent?: AgentFormValues }) {
  const router = useRouter()
  const initialModel =
    (getAgentModelOption(agent?.model ?? "")?.id as AgentModel | undefined) ??
    "gpt-4o-mini"
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [name, setName] = useState(agent?.name ?? "")
  const [description, setDescription] = useState(agent?.description ?? "")
  const [model, setModel] = useState<AgentModel>(initialModel)
  const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt ?? "")

  const form = useForm({
    schema: AgentFormSchema,
    initialInput: {
      name: agent?.name ?? "",
      description: agent?.description ?? "",
      model: initialModel,
      systemPrompt: agent?.systemPrompt ?? "",
    },
  })

  const isEditing = Boolean(agent?.id)
  const previewName = name.trim() || "Research Helper"
  const previewDescription =
    description.trim() || "This agent will use your project instructions."
  const previewPrompt =
    systemPrompt.trim() ||
    "No system prompt yet. Add behavior, tone, constraints, and domain context."
  const chatCount = agent?._count?.conversations ?? 0
  const fileCount = agent?._count?.agentFiles ?? 0
  const modelOption = getAgentModelOption(model)

  const handleSubmit: SubmitHandler<typeof AgentFormSchema> = async (
    output
  ) => {
    setIsSaving(true)

    const response = await fetch(
      isEditing ? `/api/agents/${agent?.id}` : "/api/agents",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(output),
      }
    )

    const payload = await response.json().catch(() => null)
    setIsSaving(false)

    if (!response.ok) {
      toast.error(payload?.error ?? "Unable to save agent.")
      return
    }

    toast.success(isEditing ? "Agent updated." : "Agent created.")
    router.push(
      isEditing
        ? `/agents/${agent?.id}/settings`
        : `/agents/${payload.agent.id}/settings`
    )
    router.refresh()
  }

  async function handleDelete() {
    if (!agent?.id) return

    setIsDeleting(true)
    const response = await fetch(`/api/agents/${agent.id}`, {
      method: "DELETE",
    })
    setIsDeleting(false)

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      toast.error(payload?.error ?? "Unable to delete agent.")
      return
    }

    toast.success("Agent deleted.")
    setConfirmDeleteOpen(false)
    router.push("/agents")
    router.refresh()
  }

  return (
    <Form
      of={form}
      onSubmit={handleSubmit}
      className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
    >
      <FieldGroup className="min-w-0 gap-5">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
          <FormischField of={form} path={["name"]}>
            {(field) => (
              <Field data-invalid={field.errors !== null}>
                <FieldLabel htmlFor="agent-name">Name</FieldLabel>
                <Input
                  {...field.props}
                  id="agent-name"
                  value={(field.input as string | null) ?? ""}
                  onChange={(event) => {
                    field.props.onChange(event)
                    setName(event.target.value)
                  }}
                  maxLength={80}
                  placeholder="Research Helper"
                  aria-invalid={field.errors !== null}
                />
                {field.errors ? (
                  <FieldError
                    errors={field.errors.map((message) => ({ message }))}
                  />
                ) : null}
              </Field>
            )}
          </FormischField>

          <FormischField of={form} path={["model"]}>
            {(field) => (
              <Field data-invalid={field.errors !== null}>
                <FieldLabel htmlFor="agent-model">Model</FieldLabel>
                <Select
                  name={field.props.name}
                  value={(field.input as string | null) ?? "gpt-4o-mini"}
                  onValueChange={(value) => {
                    const nextModel = value as AgentModel
                    field.onChange(nextModel)
                    setModel(nextModel)
                  }}
                >
                  <SelectTrigger
                    id="agent-model"
                    aria-invalid={field.errors !== null}
                  >
                    <SelectValue placeholder="Choose model" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_MODEL_OPTIONS.map((modelOption) => (
                      <SelectItem key={modelOption.id} value={modelOption.id}>
                        {modelOption.label} · {modelOption.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.errors ? (
                  <FieldError
                    errors={field.errors.map((message) => ({ message }))}
                  />
                ) : null}
              </Field>
            )}
          </FormischField>
        </div>

        <FormischField of={form} path={["description"]}>
          {(field) => (
            <Field data-invalid={field.errors !== null}>
              <FieldLabel htmlFor="agent-description">Description</FieldLabel>
              <Textarea
                {...field.props}
                id="agent-description"
                value={(field.input as string | null) ?? ""}
                onChange={(event) => {
                  field.props.onChange(event)
                  setDescription(event.target.value)
                }}
                rows={3}
                placeholder="What this agent is for"
                aria-invalid={field.errors !== null}
              />
              {field.errors ? (
                <FieldError
                  errors={field.errors.map((message) => ({ message }))}
                />
              ) : null}
            </Field>
          )}
        </FormischField>

        <FormischField of={form} path={["systemPrompt"]}>
          {(field) => (
            <Field data-invalid={field.errors !== null}>
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor="agent-system-prompt">
                  System prompt
                </FieldLabel>
                <span className="text-xs text-muted-foreground">
                  {systemPrompt.trim().length} chars
                </span>
              </div>
              <Textarea
                {...field.props}
                id="agent-system-prompt"
                value={(field.input as string | null) ?? ""}
                onChange={(event) => {
                  field.props.onChange(event)
                  setSystemPrompt(event.target.value)
                }}
                rows={10}
                placeholder="Set behavior, tone, constraints, and domain context."
                className="min-h-64"
                aria-invalid={field.errors !== null}
              />
              {field.errors ? (
                <FieldError
                  errors={field.errors.map((message) => ({ message }))}
                />
              ) : null}
            </Field>
          )}
        </FormischField>

        <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={isSaving || isDeleting}
              >
                <Trash2Icon />
                Delete agent
              </Button>
              <ConfirmDialog
                open={confirmDeleteOpen}
                title="Delete agent?"
                description="This will permanently delete the agent and all its conversations. This action cannot be undone."
                confirmLabel="Delete agent"
                loading={isDeleting}
                onOpenChange={setConfirmDeleteOpen}
                onConfirm={handleDelete}
              />
            </>
          ) : (
            <span />
          )}

          <Button type="submit" disabled={isSaving || isDeleting}>
            {isSaving ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
            {isEditing ? "Save changes" : "Create agent"}
          </Button>
        </div>
      </FieldGroup>

      <aside className="min-w-0 xl:sticky xl:top-0 xl:self-start">
        <div className="rounded-lg border bg-background p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500 text-white">
                <BotIcon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Preview
                </p>
                <h2 className="truncate font-heading text-base font-semibold">
                  {previewName}
                </h2>
              </div>
            </div>
          </div>

          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {previewDescription}
          </p>

          <div className="mt-4 rounded-md border bg-card px-3 py-2">
            <span className="text-xs text-muted-foreground">Model</span>
            <p className="font-mono text-sm">{model}</p>
            {modelOption ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {modelOption.category}
              </p>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2">
              <MessageSquareIcon className="size-4" />
              {chatCount} chats
            </div>
            <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2">
              <PaperclipIcon className="size-4" />
              {fileCount} files
            </div>
          </div>

          <div className="mt-4 rounded-md border bg-card p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <FileTextIcon className="size-4 text-muted-foreground" />
              System prompt
            </div>
            <p className="line-clamp-[8] text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {previewPrompt}
            </p>
          </div>
        </div>
      </aside>
    </Form>
  )
}
