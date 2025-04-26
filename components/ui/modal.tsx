"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      document.body.style.overflow = "hidden"
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      document.body.style.overflow = ""
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isVisible) return null

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full ${sizeClasses[size]} rounded-lg bg-white shadow-lg transition-transform duration-300 ${
          isOpen ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold text-optilab-blue">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
