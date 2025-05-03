"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function useAuthRequired() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=${pathname}`)
    }
  }, [user, loading, router, pathname])

  return { user, loading }
}
