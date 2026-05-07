
"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { auth } from "@/lib/firebase/firebase-config"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isFirebaseAvailable } = useFirebaseContext()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseAvailable) {
      setLoading(false)
      return
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user && pathname !== "/admin") {
        router.push("/admin")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router, pathname, isFirebaseAvailable])

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

  if (!isFirebaseAvailable) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Firebase no configurado</AlertTitle>
          <AlertDescription>
            Para acceder al panel de administración, necesitas configurar las variables de entorno de Firebase. Por
            favor, regresa a la página de inicio de sesión para ver las instrucciones.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Volver a la página de inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <AdminSidebar />
      <div className="flex-1 p-4 md:p-6">{children}</div>
    </div>
  )
}