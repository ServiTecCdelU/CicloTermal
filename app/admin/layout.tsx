"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { AdminDataProvider } from "@/lib/admin-data-context"

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user && pathname !== "/admin") {
        router.push("/admin")
        setLoading(false)
        return
      }

      if (session?.user) {
        try {
          const { data } = await supabase
            .from("admins")
            .select("role")
            .eq("email", session.user.email)
            .single()

          const role = data?.role ?? null
          setUserRole(role)

          if (role === "remera" && pathname !== "/admin/remera" && pathname !== "/admin") {
            router.push("/admin/remera")
          }
        } catch {
          // Si falla la consulta de rol, dejar pasar
        }
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [router, pathname])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Cargando...</p>
      </div>
    )
  }

  if (pathname === "/admin") {
    return children
  }

  return (
    <AdminDataProvider>
      <div className="flex min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
        <AdminSidebar userRole={userRole} />
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </div>
    </AdminDataProvider>
  )
}
