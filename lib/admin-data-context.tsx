"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { supabase } from "@/lib/supabase/client"
import { normalizeRow } from "@/lib/use-cached-firestore"

const CACHE_KEY = "ciclotermal_registrations_v4"
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
  if (typeof value === "string" || typeof value === "number") return new Date(value)
  if (value instanceof Date) return value
  return null
}

const mapRow = (row: any) => {
  const d = normalizeRow(row)
  return {
    ...d,
    id: d.dni ?? d.id, // participantes usa dni como PK
    imagenBase64: undefined,
    comprobantePagoUrl: d.comprobantePagoUrl && !isBase64Data(d.comprobantePagoUrl)
      ? d.comprobantePagoUrl : undefined,
    hasComprobante: !!(d.comprobantePagoUrl),
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

const CURRENT_YEAR = new Date().getFullYear()

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [registrations, setRegistrations] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [loadingRegistrations, setLoadingRegistrations] = useState(true)
  const [loadingExpenses, setLoadingExpenses] = useState(true)

  const fetchRegistrations = useCallback(async (year = CURRENT_YEAR, forceRefresh = false) => {
    const cacheKey = `${CACHE_KEY}_${year}`
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
      const { data: rows, error } = await supabase
        .from("participantes")
        .select("*")
        .contains("años", [year])

      if (error) throw error

      const data = (rows ?? []).map(mapRow).sort((a, b) => {
        const ta = a.fechaInscripcion instanceof Date ? a.fechaInscripcion.getTime() : 0
        const tb = b.fechaInscripcion instanceof Date ? b.fechaInscripcion.getTime() : 0
        return tb - ta
      })

      setRegistrations(data)
      if (data.length > 0) saveToCacheForKey(cacheKey, data)
    } catch (error) {
      console.error("Error fetching registrations:", error)
    } finally {
      setLoadingRegistrations(false)
    }
  }, [])

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true)
    try {
      const { data: rows, error } = await supabase
        .from("gastos")
        .select("*")
        .eq("year", CURRENT_YEAR)

      if (error) throw error

      const data = (rows ?? []).map((r) => {
        const d = normalizeRow(r)
        return { ...d, fecha: parseFecha(d.fecha) || new Date() }
      })

      setExpenses(data.sort((a, b) => b.fecha.getTime() - a.fecha.getTime()))
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setLoadingExpenses(false)
    }
  }, [])

  const refreshRegistrations = useCallback(async (year = CURRENT_YEAR) => {
    if (typeof window !== "undefined") {
      try { localStorage.removeItem(`${CACHE_KEY}_${year}`) } catch {}
    }
    await fetchRegistrations(year, true)
  }, [fetchRegistrations])

  useEffect(() => {
    const cacheKey = `${CACHE_KEY}_${CURRENT_YEAR}`
    const freshCache = loadFromCacheForKey(cacheKey)
    if (freshCache) {
      setRegistrations(freshCache)
      setLoadingRegistrations(false)
      fetchExpenses()
      return
    }

    const staleCache = loadFromCacheForKey(cacheKey, true)
    if (staleCache) {
      setRegistrations(staleCache)
      setLoadingRegistrations(false)
      fetchRegistrations(CURRENT_YEAR, true)
    } else {
      fetchRegistrations(CURRENT_YEAR)
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
