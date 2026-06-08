"use client"

import { Button } from "@/components/ui/button"
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "destructive",
  loading = false,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  confirmVariant?: "destructive" | "default"
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant={confirmVariant} disabled={loading} onClick={onConfirm}>
            {loading ? "Deleting…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}
