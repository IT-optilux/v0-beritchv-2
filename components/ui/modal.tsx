"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  className?: string
}

export function Modal({ isOpen, onClose, children, title, className }: ModalProps) {
  const [open, setOpen] = useState(false)

  // Sincronizar el estado interno con la prop isOpen
  useEffect(() => {
    if (isOpen) {
      setOpen(true)
    } else {
      const timer = setTimeout(() => setOpen(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogOverlay
        className={cn("fixed inset-0 z-50 bg-black/50 transition-opacity", isOpen ? "opacity-100" : "opacity-0")}
      />
      <DialogContent
        className={cn(
          "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg transition-all duration-300",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95",
          className,
        )}
      >
        {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
        {children}
      </DialogContent>
    </Dialog>
  )
}
