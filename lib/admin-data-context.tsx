"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-config"

interface AdminDataContextType {
  registrations: any[]
  expenses: any[]
  loadingRegistrations: boolean
  loadingExpenses: boolean
  refreshRegistrations: () => Promise<void>
  refreshExpenses: () => Promise<void>
}

const AdminDataContext = createContext<AdminDataContextType>({
  registrations: [],
  expenses: [],
  loadingRegistrations: true,
  loadingExpenses: true,
  refreshRegistrations: async () => {},
  refreshExpenses: async () => {},
})

export const useAdminData = () => useContext(AdminDataContext)

const isBase64Data = (str: any) =>
  typeof str === "string" && (str.startsWith("data:") || str.startsWith("iVBOR") || str.includes("JVBERi0"))

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [registrations, setRegistrations] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [loadingRegistrations, setLoadingRegistrations] = useState(true)
  const [loadingExpenses, setLoadingExpenses] = useState(true)

  const fetchRegistrations = useCallback(async () => {
    setLoadingRegistrations(true)
    try {
      const ref = collection(db, "participantesCicloTermal")
      const q = query(ref, orderBy("fechaInscripcion", "desc"))
      const snapshot = await getDocs(q)

      const data = snapshot.docs.map((docSnap) => {
        const d = docSnap.data()
        return {
          id: docSnap.id,
          ...d,
          imagenBase64: undefined,
          comprobantePagoUrl: d.comprobantePagoUrl && !isBase64Data(d.comprobantePagoUrl)
            ? d.comprobantePagoUrl
            : undefined,
          hasComprobante: !!(d.imagenBase64 || d.comprobantePagoUrl),
          fechaInscripcion: d.fechaInscripcion?.toDate?.() || null,
        }
      })

      setRegistrations(data)
    } catch (error) {
      console.error("Error fetching registrations:", error)
    } finally {
      setLoadingRegistrations(false)
    }
  }, [])

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true)
    try {
      const ref = collection(db, "gastos2025")
      const snapshot = await getDocs(ref)

      const data = snapshot.docs.map((docSnap) => {
        const d = docSnap.data()
        return {
          id: docSnap.id,
          ...d,
          fecha: d.fecha?.toDate?.() || new Date(),
        }
      })

      setExpenses(data.sort((a, b) => b.fecha.getTime() - a.fecha.getTime()))
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setLoadingExpenses(false)
    }
  }, [])

  useEffect(() => {
    fetchRegistrations()
    fetchExpenses()
  }, [fetchRegistrations, fetchExpenses])

  return (
    <AdminDataContext.Provider
      value={{
        registrations,
        expenses,
        loadingRegistrations,
        loadingExpenses,
        refreshRegistrations: fetchRegistrations,
        refreshExpenses: fetchExpenses,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  )
}
