"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export interface CicloConfig {
  año: number
  habilitado: boolean
  fechaDesde: string
  fechaHasta: string
}

interface FirebaseContextType {
  user: User | null
  loading: boolean
  eventSettings: any
  ciclosConfig: CicloConfig[]
  isFirebaseAvailable: boolean
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  loading: true,
  eventSettings: null,
  ciclosConfig: [],
  isFirebaseAvailable: true,
})

export const useFirebaseContext = () => useContext(FirebaseContext)

const defaultSettings = {
  cupoMaximo: 300,
  precio: 35000,
  metodoPago: "Transferencia bancaria",
  inscripcionesAbiertas: true,
  currentYear: new Date().getFullYear(),
  edicion: "",
}

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [eventSettings, setEventSettings] = useState<any>(null)
  const [ciclosConfig, setCiclosConfig] = useState<CicloConfig[]>([])

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Cargar settings y configuración de ciclos
    const fetchSettings = async () => {
      try {
        const [settingsRes, ciclosRes] = await Promise.all([
          supabase.from("settings").select("data").eq("id", "eventSettings").single(),
          supabase.from("configuracion").select("data").eq("id", "inscripciones").single(),
        ])

        setEventSettings(settingsRes.data?.data ?? defaultSettings)
        if (ciclosRes.data?.data?.ciclos) {
          setCiclosConfig(ciclosRes.data.data.ciclos)
        }
      } catch {
        setEventSettings(defaultSettings)
      }
    }

    fetchSettings()

    return () => subscription.unsubscribe()
  }, [])

  return (
    <FirebaseContext.Provider value={{ user, loading, eventSettings, ciclosConfig, isFirebaseAvailable: true }}>
      {children}
    </FirebaseContext.Provider>
  )
}
