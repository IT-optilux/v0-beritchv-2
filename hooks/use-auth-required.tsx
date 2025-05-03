"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function useAuthRequired() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=${window.location.pathname}`)
    }
  }, [user, loading, router])

  return { user, loading }
}
