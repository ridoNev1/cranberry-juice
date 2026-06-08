import { Skeleton } from "@/components/ui/skeleton"

export default function AgentChatLoading() {
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="size-6 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-28 rounded" />
            <Skeleton className="h-2.5 w-16 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-28 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden px-4 py-5">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
          <div className="flex gap-3">
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <Skeleton className="h-16 w-2/3 rounded-lg" />
          </div>
          <div className="flex justify-end gap-3">
            <Skeleton className="h-10 w-1/2 rounded-lg" />
            <Skeleton className="size-8 shrink-0 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <Skeleton className="h-24 w-3/4 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Input skeleton */}
      <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-4">
        <Skeleton className="h-36 w-full rounded-2xl" />
      </div>
    </div>
  )
}
