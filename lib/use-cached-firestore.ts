"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

const CACHE_TTL = 60 * 60 * 1000 // 1 hora para datos públicos

interface CacheEntry {
  data: any
  ts: number
}

const memoryCache = new Map<string, CacheEntry>()

// snake_case → camelCase para normalizar filas de Supabase
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

export function normalizeRow(row: any): any {
  if (!row || typeof row !== "object" || Array.isArray(row)) return row
  const out: any = {}
  for (const [key, value] of Object.entries(row)) {
    out[toCamelCase(key)] = value
  }
  return out
}

function loadFromStorage(key: string): any | null {
  const mem = memoryCache.get(key)
  if (mem && Date.now() - mem.ts < CACHE_TTL) return mem.data

  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    memoryCache.set(key, { data, ts })
    return data
  } catch {
    return null
  }
}

function saveToStorage(key: string, data: any) {
  const entry = { data, ts: Date.now() }
  memoryCache.set(key, entry)
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {}
}

// Invalida entradas de cache cuyo key empieza con el prefijo dado (memoria + localStorage)
export function invalidateCache(prefix: string) {
  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(prefix)) memoryCache.delete(key)
  }
  if (typeof window === "undefined") return
  try {
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) toRemove.push(key)
    }
    toRemove.forEach((key) => localStorage.removeItem(key))
  } catch {}
}

// buildQuery recibe la query de Supabase y devuelve la query con filtros/orden aplicados
type QueryBuilder = (q: any) => any

export function useCachedCollection(
  cacheKey: string,
  tableName: string,
  buildQuery?: QueryBuilder,
  enabled = true,
) {
  const [data, setData] = useState<any[]>(() => loadFromStorage(cacheKey) ?? [])
  const [loading, setLoading] = useState(() => !loadFromStorage(cacheKey))

  useEffect(() => {
    if (!enabled) return

    // Stale-while-revalidate: muestra cache al instante pero siempre revalida contra el server
    const cached = loadFromStorage(cacheKey)
    if (cached) {
      setData(cached)
      setLoading(false)
    }

    let cancelled = false
    const fetchData = async () => {
      try {
        let q = supabase.from(tableName).select("*")
        if (buildQuery) q = buildQuery(q)
        const { data: rows, error } = await q
        if (error) throw error
        const normalized = (rows ?? []).map(normalizeRow)
        if (!cancelled) {
          setData(normalized)
          saveToStorage(cacheKey, normalized)
        }
      } catch (error) {
        console.error(`Error fetching ${tableName}:`, error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [cacheKey, tableName, enabled])

  return { data, loading }
}

export function useCachedDoc(
  cacheKey: string,
  tableName: string,
  id: string,
  enabled = true,
) {
  const [data, setData] = useState<any>(() => loadFromStorage(cacheKey))
  const [loading, setLoading] = useState(() => !loadFromStorage(cacheKey))

  useEffect(() => {
    if (!enabled) return

    const cached = loadFromStorage(cacheKey)
    if (cached) {
      setData(cached)
      setLoading(false)
      return // Cache fresco, no va al servidor
    }

    let cancelled = false
    const fetchData = async () => {
      try {
        const { data: row, error } = await supabase
          .from(tableName)
          .select("*")
          .eq("id", id)
          .single()
        if (error) throw error
        const normalized = normalizeRow(row)
        if (!cancelled) {
          setData(normalized)
          saveToStorage(cacheKey, normalized)
        }
      } catch (error) {
        console.error(`Error fetching ${tableName}/${id}:`, error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [cacheKey, tableName, id, enabled])

  return { data, loading }
}
