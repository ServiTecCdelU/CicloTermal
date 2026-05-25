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

const SETTINGS_CACHE_KEY = "ciclotermal_settings_v2"
const SETTINGS_TTL = 30 * 60 * 1000 // 30 minutos

function loadSettingsCache() {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > SETTINGS_TTL) return null
    return data
  } catch {
    return null
  }
}

function saveSettingsCache(data: any) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch {}
}

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [eventSettings, setEventSettings] = useState<any>(() => {
    const cached = loadSettingsCache()
    return cached?.eventSettings ?? null
  })
  const [ciclosConfig, setCiclosConfig] = useState<CicloConfig[]>(() => {
    const cached = loadSettingsCache()
    return cached?.ciclos ?? []
  })

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

    // Cargar settings y configuración de ciclos (con cache)
    const fetchSettings = async () => {
      const cached = loadSettingsCache()
      if (cached) {
        setEventSettings(cached.eventSettings ?? defaultSettings)
        if (cached.ciclos) setCiclosConfig(cached.ciclos)
        return
      }

      try {
        const [settingsRes, ciclosRes] = await Promise.all([
          supabase.from("settings").select("data").eq("id", "eventSettings").single(),
          supabase.from("configuracion").select("data").eq("id", "inscripciones").single(),
        ])

        const evSettings = settingsRes.data?.data ?? defaultSettings
        const ciclos = ciclosRes.data?.data?.ciclos ?? []

        setEventSettings(evSettings)
        if (ciclos.length) setCiclosConfig(ciclos)
        saveSettingsCache({ eventSettings: evSettings, ciclos })
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
