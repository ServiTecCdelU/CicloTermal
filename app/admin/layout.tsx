"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { AdminDataProvider } from "@/lib/admin-data-context"

const ROLE_CACHE_KEY = "admin_role_v1"

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const roleResolved = useRef(false)

  useEffect(() => {
    const resolveRole = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        if (window.location.pathname !== "/admin") router.push("/admin")
        setLoading(false)
        return
      }

      // Usa rol cacheado en sessionStorage para evitar DB query en cada navegación
      const cachedRole = sessionStorage.getItem(ROLE_CACHE_KEY)
      if (cachedRole !== null) {
        const role = cachedRole || null
        setUserRole(role)
        if (role === "remera" && window.location.pathname !== "/admin/remera" && window.location.pathname !== "/admin") {
          router.push("/admin/remera")
        }
        setLoading(false)
        return
      }

      try {
        const { data } = await supabase
          .from("admins")
          .select("role")
          .eq("email", session.user.email)
          .single()

        const role = data?.role ?? ""
        sessionStorage.setItem(ROLE_CACHE_KEY, role)
        setUserRole(role || null)

        if (role === "remera" && window.location.pathname !== "/admin/remera" && window.location.pathname !== "/admin") {
          router.push("/admin/remera")
        }
      } catch {}

      setLoading(false)
    }

    if (!roleResolved.current) {
      roleResolved.current = true
      resolveRole()
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        sessionStorage.removeItem(ROLE_CACHE_KEY)
        router.push("/admin")
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

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
