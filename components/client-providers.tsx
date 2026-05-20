"use client"

import dynamic from "next/dynamic"
import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const FirebaseProvider = dynamic(
  () => import("@/lib/firebase/firebase-provider").then((m) => m.FirebaseProvider),
  { ssr: false },
)

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <FirebaseProvider>
        {children}
        <Toaster />
      </FirebaseProvider>
    </ThemeProvider>
  )
}
