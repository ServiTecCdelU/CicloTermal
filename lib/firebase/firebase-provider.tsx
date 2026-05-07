"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase-config"

interface FirebaseContextType {
  user: User | null
  loading: boolean
  eventSettings: any
  isFirebaseAvailable: boolean
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  loading: true,
  eventSettings: null,
  isFirebaseAvailable: false,
})

export const useFirebaseContext = () => useContext(FirebaseContext)

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [eventSettings, setEventSettings] = useState(null)
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(false)

  // Verificar si Firebase está disponible
  useEffect(() => {
    try {
      // Intentar acceder a auth para verificar si Firebase está inicializado correctamente
      if (auth && typeof auth.onAuthStateChanged === "function") {
        setIsFirebaseAvailable(true)
      } else {
        console.warn("Firebase Auth no está disponible. Algunas funcionalidades estarán limitadas.")
        setIsFirebaseAvailable(false)
        setLoading(false)
      }
    } catch (error) {
      console.error("Error al verificar Firebase:", error)
      setIsFirebaseAvailable(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isFirebaseAvailable) return

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [isFirebaseAvailable])

  useEffect(() => {
    const fetchEventSettings = async () => {
      if (!isFirebaseAvailable) {
        // Configuración predeterminada si Firebase no está disponible
        setEventSettings({
          cupoMaximo: 300,
          precio: 35000,
          metodoPago: "Transferencia bancaria",
          inscripcionesAbiertas: true,
          currentYear: new Date().getFullYear(),
        })
        return
      }

      try {
        const settingsDoc = doc(db, "settings", "eventSettings")
        const docSnap = await getDoc(settingsDoc)

        if (docSnap.exists()) {
          setEventSettings(docSnap.data())
        } else {
          // Set default settings if none exist
          setEventSettings({
            cupoMaximo: 300,
            precio: 35000,
            metodoPago: "Transferencia bancaria",
            inscripcionesAbiertas: true,
            currentYear: new Date().getFullYear(),
          })
        }
      } catch (error) {
        console.error("Error fetching event settings:", error)
        // Set default settings on error
        setEventSettings({
          cupoMaximo: 300,
          precio: 35000,
          metodoPago: "Transferencia bancaria",
          inscripcionesAbiertas: true,
          currentYear: new Date().getFullYear(),
        })
      }
    }

    fetchEventSettings()
  }, [isFirebaseAvailable])

  return (
    <FirebaseContext.Provider value={{ user, loading, eventSettings, isFirebaseAvailable }}>
      {children}
    </FirebaseContext.Provider>
  )
}
