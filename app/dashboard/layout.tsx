"use client"

import type React from "react"

import { useAuthRequired } from "@/hooks/use-auth-required"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { FirebaseInitializer } from "@/components/firebase-initializer"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuthRequired()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-optilab-blue border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
      </div>
      <FirebaseInitializer />
    </div>
  )
}
