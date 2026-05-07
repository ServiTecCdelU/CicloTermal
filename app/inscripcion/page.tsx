"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-config"
import { Loader2 } from "lucide-react"

export default function InscripcionRedirect() {
  const router = useRouter()
  const [error, setError] = useState(false)

  useEffect(() => {
    const redirect = async () => {
      try {
        const snap = await getDoc(doc(db, "configuracion", "inscripciones"))
        if (snap.exists()) {
          const ciclos: any[] = snap.data().ciclos || []
          const today = new Date().toISOString().slice(0, 10)
          const activo = ciclos.find(
            (c) =>
              c.habilitado &&
              (!c.fechaDesde || today >= c.fechaDesde) &&
              (!c.fechaHasta || today <= c.fechaHasta),
          )
          if (activo) {
            router.replace(`/inscripcion/${activo.año}`)
            return
          }
          // Si hay alguno habilitado aunque esté fuera de rango, redirigir igual
          const habilitado = ciclos.find((c) => c.habilitado)
          if (habilitado) {
            router.replace(`/inscripcion/${habilitado.año}`)
            return
          }
        }
        setError(true)
      } catch {
        setError(true)
      }
    }
    redirect()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <h1 className="text-2xl font-bold text-gray-700">Inscripción no disponible</h1>
        <p className="text-gray-500">No hay inscripciones abiertas en este momento.</p>
        <a href="/" className="text-blue-600 hover:underline">Volver al inicio</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  )
}
