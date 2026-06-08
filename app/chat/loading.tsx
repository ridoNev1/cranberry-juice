import { Skeleton } from "@/components/ui/skeleton"

export default function ChatLoading() {
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <Skeleton className="size-6 rounded-md" />
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-4 w-32 rounded" />
      </header>

      {/* Empty state skeleton */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <Skeleton className="size-[120px] rounded-full" />
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-6 w-64 rounded-lg" />
        </div>
        {/* Input skeleton */}
        <div className="w-full max-w-[720px] space-y-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
