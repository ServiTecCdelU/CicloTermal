"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase-config"

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
  isFirebaseAvailable: false,
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
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(false)

  useEffect(() => {
    try {
      // auth y db siempre existen en el cliente gracias a "use client" en firebase-config
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u)
        setLoading(false)
      })

      setIsFirebaseAvailable(true)

      const fetchSettings = async () => {
        try {
          const [settingsSnap, ciclosSnap] = await Promise.all([
            getDoc(doc(db, "settings", "eventSettings")),
            getDoc(doc(db, "configuracion", "inscripciones")),
          ])

          setEventSettings(settingsSnap.exists() ? settingsSnap.data() : defaultSettings)
          if (ciclosSnap.exists()) {
            setCiclosConfig(ciclosSnap.data().ciclos || [])
          }
        } catch (error: any) {
          if (error?.code !== "unavailable" && !error?.message?.includes("offline")) {
            console.warn("Error fetching event settings:", error)
          }
          setEventSettings(defaultSettings)
        }
      }

      fetchSettings()

      return () => unsubscribe()
    } catch {
      setLoading(false)
      setEventSettings(defaultSettings)
    }
  }, [])

  return (
    <FirebaseContext.Provider value={{ user, loading, eventSettings, ciclosConfig, isFirebaseAvailable }}>
      {children}
    </FirebaseContext.Provider>
  )
}
