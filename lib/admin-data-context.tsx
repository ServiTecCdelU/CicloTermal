"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { collection, getDocs, query, orderBy, where } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-config"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"

const CACHE_KEY_BASE = "ciclotermal_registrations_v1"
const CACHE_TTL = 30 * 60 * 1000 // 30 minutos

interface AdminDataContextType {
  registrations: any[]
  expenses: any[]
  loadingRegistrations: boolean
  loadingExpenses: boolean
  refreshRegistrations: (year?: number) => Promise<void>
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
    comprobantePagoUrl: d.comprobantePagoUrl && !isBase64Data(d.comprobantePagoUrl) ? d.comprobantePagoUrl : undefined,
    hasComprobante: !!(d.imagenBase64 || d.comprobantePagoUrl),
    fechaInscripcion: parseFecha(d.fechaInscripcion),
  }
}

const loadFromCacheForKey = (key: string, ignoreExpiry = false): any[] | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (!ignoreExpiry && Date.now() - ts > CACHE_TTL) return null
    return data.map((r: any) => ({
      ...r,
      fechaInscripcion: r.fechaInscripcion ? new Date(r.fechaInscripcion) : null,
    }))
  } catch {
    return null
  }
}

const saveToCacheForKey = (key: string, data: any[]) => {
  if (typeof window === "undefined") return
  try {
    const serializable = data.map((r) => ({
      ...r,
      fechaInscripcion: r.fechaInscripcion instanceof Date ? r.fechaInscripcion.toISOString() : null,
    }))
    localStorage.setItem(key, JSON.stringify({ data: serializable, ts: Date.now() }))
  } catch {}
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const { eventSettings } = useFirebaseContext()
  const [registrations, setRegistrations] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [loadingRegistrations, setLoadingRegistrations] = useState(true)
  const [loadingExpenses, setLoadingExpenses] = useState(true)

  // Determina el año a cargar: preferir selección del usuario en localStorage, luego eventSettings.currentYear, luego año actual
  const determineYearToLoad = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ciclotermal_selected_year")
      if (stored) {
        const n = Number(stored)
        if (!Number.isNaN(n)) return n
      }
    }
    return eventSettings?.currentYear || new Date().getFullYear()
  }

  const fetchRegistrations = useCallback(async (year?: number, forceRefresh = false) => {
    const yearToLoad = year ?? determineYearToLoad()
    const cacheKey = `${CACHE_KEY_BASE}_${yearToLoad}`

    // Mostrar caché inmediatamente si existe (incluso si está vencida)
    if (!forceRefresh) {
      const cached = loadFromCacheForKey(cacheKey)
      if (cached) {
        setRegistrations(cached)
        setLoadingRegistrations(false)
        return
      }
    }

    setLoadingRegistrations(true)
    try {
      const ref = collection(db, "participantesCicloTermal")
      const q = query(ref, where("años", "array-contains", yearToLoad), orderBy("fechaInscripcion", "desc"))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(mapDoc)
      setRegistrations(data)
      saveToCacheForKey(cacheKey, data)
    } catch (error) {
      console.error("Error fetching registrations:", error)
    } finally {
      setLoadingRegistrations(false)
    }
  }, [eventSettings])

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

  // refreshRegistrations acepta opcionalmente un año para forzar recarga de ese año
  const refreshRegistrations = useCallback(async (year?: number) => {
    if (typeof window !== "undefined") {
      try {
        const key = `${CACHE_KEY_BASE}_${year ?? determineYearToLoad()}`
        localStorage.removeItem(key)
      } catch {}
    }
    await fetchRegistrations(year, true)
  }, [fetchRegistrations])

  useEffect(() => {
    const yearToLoad = determineYearToLoad()
    const cacheKey = `${CACHE_KEY_BASE}_${yearToLoad}`

    // Primero: mostrar caché (fresca o vencida) para render instantáneo
    const freshCache = loadFromCacheForKey(cacheKey)
    if (freshCache) {
      setRegistrations(freshCache)
      setLoadingRegistrations(false)
      return // Caché fresca, no re-fetch
    }

    const staleCache = loadFromCacheForKey(cacheKey, true)
    if (staleCache) {
      setRegistrations(staleCache)
      setLoadingRegistrations(false)
      // Refrescar en background sin mostrar loading
      fetchRegistrations(yearToLoad, true)
    } else {
      fetchRegistrations(yearToLoad)
    }

    fetchExpenses()
  }, [fetchRegistrations, fetchExpenses, eventSettings])

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
