"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, getDoc, doc, type QueryConstraint } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-config"

const CACHE_TTL = 60 * 60 * 1000 // 1 hora para datos públicos

interface CacheEntry {
  data: any
  ts: number
}

const memoryCache = new Map<string, CacheEntry>()

function loadFromStorage(key: string): any | null {
  // Primero intentar memoria (más rápido que localStorage)
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

export function useCachedCollection(
  cacheKey: string,
  collectionName: string,
  constraints: QueryConstraint[] = [],
  enabled = true,
) {
  const [data, setData] = useState<any[]>(() => loadFromStorage(cacheKey) ?? [])
  const [loading, setLoading] = useState(() => !loadFromStorage(cacheKey))

  useEffect(() => {
    if (!enabled) return

    const cached = loadFromStorage(cacheKey)
    if (cached) {
      setData(cached)
      setLoading(false)
      return
    }

    let cancelled = false
    const fetchData = async () => {
      try {
        const ref = collection(db, collectionName)
        const q = constraints.length > 0 ? query(ref, ...constraints) : query(ref)
        const snapshot = await getDocs(q)
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        if (!cancelled) {
          setData(docs)
          saveToStorage(cacheKey, docs)
        }
      } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [cacheKey, collectionName, enabled])

  return { data, loading }
}

export function useCachedDoc(
  cacheKey: string,
  collectionName: string,
  docId: string,
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
      return
    }

    let cancelled = false
    const fetchData = async () => {
      try {
        const docRef = doc(db, collectionName, docId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists() && !cancelled) {
          const docData = { id: docSnap.id, ...docSnap.data() }
          setData(docData)
          saveToStorage(cacheKey, docData)
        }
      } catch (error) {
        console.error(`Error fetching ${collectionName}/${docId}:`, error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [cacheKey, collectionName, docId, enabled])

  return { data, loading }
}
