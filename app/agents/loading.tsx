import { Skeleton } from "@/components/ui/skeleton"

export default function AgentsLoading() {
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        <Skeleton className="h-7 w-28 rounded-lg" />
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                </div>
                <Skeleton className="size-7 rounded-lg" />
              </div>
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-4/5 rounded" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
