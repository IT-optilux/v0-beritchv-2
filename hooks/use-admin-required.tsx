"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function useAdminRequired() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(`/login?redirect=${window.location.pathname}`)
      } else if (!isAdmin) {
        router.push("/dashboard")
      }
    }
  }, [user, loading, isAdmin, router])

  return { user, loading, isAdmin }
}
