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

const firebaseAvailable = (() => {
  try {
    return !!(auth && typeof auth.onAuthStateChanged === "function")
  } catch {
    return false
  }
})()

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
  const [loading, setLoading] = useState(firebaseAvailable)
  const [eventSettings, setEventSettings] = useState<any>(firebaseAvailable ? null : defaultSettings)
  const [ciclosConfig, setCiclosConfig] = useState<CicloConfig[]>([])
  const isFirebaseAvailable = firebaseAvailable

  useEffect(() => {
    if (!firebaseAvailable) return

    // Auth y settings en paralelo
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

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
  }, [])

  return (
    <FirebaseContext.Provider value={{ user, loading, eventSettings, ciclosConfig, isFirebaseAvailable }}>
      {children}
    </FirebaseContext.Provider>
  )
}
