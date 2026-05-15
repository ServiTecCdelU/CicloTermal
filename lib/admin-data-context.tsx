"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-config"

const CACHE_KEY = "ciclotermal_registrations_v1"
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

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

const parseFecha = (value: any): Date | null => {
  if (!value) return null
  if (typeof value?.toDate === "function") return value.toDate()
  if (typeof value === "string" || typeof value === "number") return new Date(value)
  if (value instanceof Date) return value
  return null
}

const mapDoc = (docSnap: any) => {
  const d = docSnap.data()
  return {
    id: docSnap.id,
    ...d,
    imagenBase64: undefined,
    comprobantePagoUrl: d.comprobantePagoUrl && !isBase64Data(d.comprobantePagoUrl)
      ? d.comprobantePagoUrl
      : undefined,
    hasComprobante: !!(d.imagenBase64 || d.comprobantePagoUrl),
    fechaInscripcion: parseFecha(d.fechaInscripcion),
  }
}

const loadFromCache = (): any[] | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data.map((r: any) => ({
      ...r,
      fechaInscripcion: r.fechaInscripcion ? new Date(r.fechaInscripcion) : null,
    }))
  } catch {
    return null
  }
}

const saveToCache = (data: any[]) => {
  if (typeof window === "undefined") return
  try {
    const serializable = data.map((r) => ({
      ...r,
      fechaInscripcion: r.fechaInscripcion instanceof Date ? r.fechaInscripcion.toISOString() : null,
    }))
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: serializable, ts: Date.now() }))
  } catch {}
}

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
      const data = snapshot.docs.map(mapDoc)
      setRegistrations(data)
      saveToCache(data)
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
        return { id: docSnap.id, ...d, fecha: parseFecha(d.fecha) || new Date() }
      })
      setExpenses(data.sort((a, b) => b.fecha.getTime() - a.fecha.getTime()))
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setLoadingExpenses(false)
    }
  }, [])

  const refreshRegistrations = useCallback(async () => {
    if (typeof window !== "undefined") {
      try { localStorage.removeItem(CACHE_KEY) } catch {}
    }
    await fetchRegistrations()
  }, [fetchRegistrations])

  useEffect(() => {
    // Mostrar caché inmediatamente si está fresca
    const cached = loadFromCache()
    if (cached) {
      setRegistrations(cached)
      setLoadingRegistrations(false)
    } else {
      fetchRegistrations()
    }
    fetchExpenses()
  }, [fetchRegistrations, fetchExpenses])

  return (
    <AdminDataContext.Provider
      value={{
        registrations,
        expenses,
        loadingRegistrations,
        loadingExpenses,
        refreshRegistrations,
        refreshExpenses: fetchExpenses,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  )
}
