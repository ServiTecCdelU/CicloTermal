"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, updateDoc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-config"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Search, Shirt, Eye, RefreshCw, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface RemeraItem {
  talle: string
  cantidad: number
}

interface RemeraDoc {
  id: string
  dni: string
  nombre: string
  telefono: string
  talle?: string // legacy
  items?: RemeraItem[] // nuevo
  tieneComprobante: boolean
  estaRegistrado: boolean
  estado: "pendiente" | "entregado"
  fechaSolicitud: string
}

const estadoColors: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300",
  entregado: "bg-green-100 text-green-800 border-green-300",
}

function formatItems(r: RemeraDoc): string {
  if (r.items?.length) {
    return r.items.map((i) => `${i.talle}×${i.cantidad}`).join(", ")
  }
  return r.talle || "—"
}

export default function RemeraAdminPage() {
  const { toast } = useToast()
  const [remeras, setRemeras] = useState<RemeraDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [filtroTalle, setFiltroTalle] = useState("todos")
  const [actualizando, setActualizando] = useState<string | null>(null)

  // Comprobante lazy + caché
  const [comprobanteCache, setComprobanteCache] = useState<Record<string, string>>({})
  const [fetchingComprobante, setFetchingComprobante] = useState<string | null>(null)
  const [comprobanteModal, setComprobanteModal] = useState<{ record: RemeraDoc; base64: string } | null>(null)

  const [alias, setAlias] = useState("")
  const [aliasGuardando, setAliasGuardando] = useState(false)

  const fetchRemeras = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, "remera"))
      const docs = snap.docs.map((d) => {
        const data = d.data()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { comprobanteBase64, nombreArchivo, ...rest } = data
        return {
          id: d.id,
          ...rest,
          tieneComprobante: rest.tieneComprobante ?? !!comprobanteBase64,
        } as RemeraDoc
      })
      docs.sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime())
      setRemeras(docs)
    } catch {
      toast({ title: "Error al cargar remeras", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRemeras()
    getDoc(doc(db, "settings", "remera")).then((snap) => {
      if (snap.exists()) setAlias(snap.data().alias ?? "")
    })
  }, [])

  const guardarAlias = async () => {
    setAliasGuardando(true)
    try {
      await setDoc(doc(db, "settings", "remera"), { alias }, { merge: true })
      toast({ title: "Alias guardado" })
    } catch {
      toast({ title: "Error al guardar alias", variant: "destructive" })
    } finally {
      setAliasGuardando(false)
    }
  }

  const verComprobante = async (r: RemeraDoc) => {
    if (comprobanteCache[r.id]) {
      setComprobanteModal({ record: r, base64: comprobanteCache[r.id] })
      return
    }
    setFetchingComprobante(r.id)
    try {
      // Intentar colección separada (nuevos registros)
      const compSnap = await getDoc(doc(db, "remera_comprobantes", r.id))
      if (compSnap.exists() && compSnap.data().comprobanteBase64) {
        const b64 = compSnap.data().comprobanteBase64 as string
        setComprobanteCache((p) => ({ ...p, [r.id]: b64 }))
        setComprobanteModal({ record: r, base64: b64 })
        return
      }
      // Fallback: doc principal (registros viejos)
      const mainSnap = await getDoc(doc(db, "remera", r.id))
      if (mainSnap.exists() && mainSnap.data().comprobanteBase64) {
        const b64 = mainSnap.data().comprobanteBase64 as string
        setComprobanteCache((p) => ({ ...p, [r.id]: b64 }))
        setComprobanteModal({ record: r, base64: b64 })
        return
      }
      toast({ title: "Comprobante no disponible", variant: "destructive" })
    } catch {
      toast({ title: "Error al cargar comprobante", variant: "destructive" })
    } finally {
      setFetchingComprobante(null)
    }
  }

  const cambiarEstado = async (id: string, estado: "pendiente" | "entregado") => {
    setActualizando(id)
    try {
      await updateDoc(doc(db, "remera", id), { estado })
      setRemeras((prev) => prev.map((r) => r.id === id ? { ...r, estado } : r))
    } catch {
      toast({ title: "Error al actualizar estado", variant: "destructive" })
    } finally {
      setActualizando(null)
    }
  }

  const filtradas = remeras.filter((r) => {
    const matchBusqueda =
      !busqueda ||
      r.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.dni?.includes(busqueda) ||
      r.telefono?.includes(busqueda)
    const matchEstado = filtroEstado === "todos" || r.estado === filtroEstado
    const matchTalle =
      filtroTalle === "todos" ||
      (r.items ? r.items.some((i) => i.talle === filtroTalle) : r.talle === filtroTalle)
    return matchBusqueda && matchEstado && matchTalle
  })

  // Cuenta unidades por talle (considera cantidad en items)
  const conteoTalles = remeras.reduce<Record<string, number>>((acc, r) => {
    if (r.items?.length) {
      r.items.forEach((item) => {
        acc[item.talle] = (acc[item.talle] || 0) + item.cantidad
      })
    } else if (r.talle) {
      acc[r.talle] = (acc[r.talle] || 0) + 1
    }
    return acc
  }, {})

  const formatFecha = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("es-AR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    } catch { return iso }
  }

  return (
    <div className="space-y-6 pt-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
            Pedidos de Remera
          </h1>
          <p className="text-sm text-gray-500 mt-1">{remeras.length} pedidos en total</p>
        </div>
        <Button variant="outline" onClick={fetchRemeras} disabled={loading} className="w-full sm:w-auto">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Alias de pago */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">Alias para pago (visible en el formulario de pedido)</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Ej: ciclotermal.remera"
            className="flex-1"
          />
          <Button onClick={guardarAlias} disabled={aliasGuardando} size="sm" className="w-full sm:w-auto">
            {aliasGuardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Guardar
          </Button>
        </div>
      </div>

      {/* Resumen por talle */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
        {["S", "M", "L", "XL", "XXL"].map((t) => (
          <Card key={t} className="text-center">
            <CardContent className="p-3 sm:pt-4 sm:pb-3">
              <div className="text-xl sm:text-2xl font-bold text-violet-600">{conteoTalles[t] || 0}</div>
              <div className="text-xs text-gray-500 font-medium mt-0.5 sm:mt-1">Talle {t}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, DNI o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="entregado">Entregado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroTalle} onValueChange={setFiltroTalle}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Talle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {["S", "M", "L", "XL", "XXL"].map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Shirt className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Sin resultados</p>
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {filtradas.map((r) => (
              <div key={r.id} className="rounded-xl border bg-white shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.nombre}</p>
                    <p className="text-xs text-gray-500">{r.dni} · {r.telefono}</p>
                  </div>
                  <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${estadoColors[r.estado] || ""}`}>
                    {r.estado}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded font-semibold">
                    {formatItems(r)}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-medium ${r.estaRegistrado ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                    {r.estaRegistrado ? "Inscripto" : "No inscripto"}
                  </span>
                  <span className="text-gray-400">{formatFecha(r.fechaSolicitud)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {r.estado === "pendiente" ? (
                    <Button
                      size="sm"
                      className="h-7 text-[11px] px-2 bg-green-600 hover:bg-green-700 text-white"
                      disabled={actualizando === r.id}
                      onClick={() => cambiarEstado(r.id, "entregado")}
                    >
                      {actualizando === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Entregado"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] px-2"
                      disabled={actualizando === r.id}
                      onClick={() => cambiarEstado(r.id, "pendiente")}
                    >
                      {actualizando === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Revertir"}
                    </Button>
                  )}
                  {r.tieneComprobante && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => verComprobante(r)}
                      disabled={fetchingComprobante === r.id}
                      className="h-8 px-3"
                    >
                      {fetchingComprobante === r.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><Eye className="h-4 w-4 mr-1" /> Ver</>
                      }
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden md:block overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-600">
                  <th className="px-4 py-3 text-left font-medium">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium">DNI</th>
                  <th className="px-4 py-3 text-left font-medium">Teléfono</th>
                  <th className="px-4 py-3 text-center font-medium">Talles</th>
                  <th className="px-4 py-3 text-center font-medium">Inscripto</th>
                  <th className="px-4 py-3 text-left font-medium">Fecha</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3 text-center font-medium">Comprobante</th>
                  <th className="px-4 py-3 text-center font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{r.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{r.dni}</td>
                    <td className="px-4 py-3 text-gray-600">{r.telefono}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-violet-100 text-violet-700 rounded font-semibold text-xs">
                        {formatItems(r)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${r.estaRegistrado ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                        {r.estaRegistrado ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatFecha(r.fechaSolicitud)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${estadoColors[r.estado] || ""}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.tieneComprobante ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => verComprobante(r)}
                          disabled={fetchingComprobante === r.id}
                          className="h-7 px-2"
                        >
                          {fetchingComprobante === r.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Eye className="h-4 w-4" />
                          }
                        </Button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.estado === "pendiente" ? (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                          disabled={actualizando === r.id}
                          onClick={() => cambiarEstado(r.id, "entregado")}
                        >
                          {actualizando === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Marcar entregado"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={actualizando === r.id}
                          onClick={() => cambiarEstado(r.id, "pendiente")}
                        >
                          {actualizando === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Revertir"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>

      )}

      {/* Modal comprobante */}
      <Dialog open={!!comprobanteModal} onOpenChange={(v) => { if (!v) setComprobanteModal(null) }}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Comprobante — {comprobanteModal?.record.nombre}</DialogTitle>
          </DialogHeader>
          {comprobanteModal?.base64 && (
            comprobanteModal.base64.startsWith("data:application/pdf") ? (
              <iframe
                src={comprobanteModal.base64}
                className="w-full h-96 rounded border"
                title="comprobante"
              />
            ) : (
              <img
                src={comprobanteModal.base64}
                alt="Comprobante"
                className="w-full rounded border object-contain max-h-96"
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
