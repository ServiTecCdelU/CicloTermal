"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { AdminDataProvider } from "@/lib/admin-data-context"

// Rutas permitidas por rol. El rol "admin" accede a todo.
const REMERA_ALLOWED = ["/admin", "/admin/remera"]

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

      // El rol se resuelve siempre contra la DB: no se cachea en el browser
      // porque el cliente puede manipular el storage.
      let role = ""
      try {
        const { data } = await supabase
          .from("admins")
          .select("role")
          .eq("email", session.user.email)
          .single()
        role = data?.role ?? ""
      } catch {
        role = ""
      }

      // Sin rol habilitado (pending, vacío o error) → se cierra la sesión.
      if (role !== "admin" && role !== "remera") {
        await supabase.auth.signOut()
        setUserRole(null)
        setLoading(false)
        if (window.location.pathname !== "/admin") router.replace("/admin")
        return
      }

      setUserRole(role)

      if (role === "remera" && !REMERA_ALLOWED.includes(window.location.pathname)) {
        router.replace("/admin/remera")
      }

      setLoading(false)
    }

    if (!roleResolved.current) {
      roleResolved.current = true
      resolveRole()
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUserRole(null)
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

  // Sin rol habilitado no se renderiza ninguna página del panel.
  if (userRole !== "admin" && userRole !== "remera") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Acceso no autorizado.</p>
      </div>
    )
  }

  if (userRole === "remera" && pathname !== "/admin/remera") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Acceso no autorizado.</p>
      </div>
    )
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
