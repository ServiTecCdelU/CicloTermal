"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  envioTipo?: "retiro" | "envio"
  direccion?: string
  comprobanteUrl?: string
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
  const [filtroEnvio, setFiltroEnvio] = useState("todos")
  const [actualizando, setActualizando] = useState<string | null>(null)

  // Comprobante lazy + caché
  const [comprobanteCache, setComprobanteCache] = useState<Record<string, string>>({})
  const [fetchingComprobante, setFetchingComprobante] = useState<string | null>(null)
  const [comprobanteModal, setComprobanteModal] = useState<{ record: RemeraDoc; base64: string } | null>(null) // "base64" puede ser URL o base64

  const [alias, setAlias] = useState("")
  const [aliasGuardando, setAliasGuardando] = useState(false)

  const fetchRemeras = async () => {
    setLoading(true)
    try {
      const { data: rows } = await supabase.from("remera").select("*")
      const docs: RemeraDoc[] = (rows ?? []).map((r) => ({
        id: r.id,
        dni: r.dni,
        nombre: r.nombre,
        telefono: r.telefono,
        talle: r.talle,
        items: r.items ?? [],
        tieneComprobante: r.tiene_comprobante,
        estaRegistrado: r.esta_registrado,
        estado: r.estado,
        fechaSolicitud: r.fecha_solicitud,
        envioTipo: r.envio_tipo,
        direccion: r.direccion,
        comprobanteUrl: r.comprobante_url ?? undefined,
      }))
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
    supabase.from("settings").select("data").eq("id", "remera").single().then(({ data: row }) => {
      setAlias(row?.data?.alias ?? "")
    })
  }, [])

  const guardarAlias = async () => {
    setAliasGuardando(true)
    try {
      await supabase.from("settings").upsert({ id: "remera", data: { alias } })
      toast({ title: "Alias guardado" })
    } catch {
      toast({ title: "Error al guardar alias", variant: "destructive" })
    } finally {
      setAliasGuardando(false)
    }
  }

  const verComprobante = async (r: RemeraDoc) => {
    // URL de Storage (nuevo sistema)
    if (r.comprobanteUrl) {
      setComprobanteModal({ record: r, base64: r.comprobanteUrl })
      return
    }
    // Fallback: base64 en remera_comprobantes (sistema anterior)
    if (comprobanteCache[r.id]) {
      setComprobanteModal({ record: r, base64: comprobanteCache[r.id] })
      return
    }
    setFetchingComprobante(r.id)
    try {
      const { data: comp } = await supabase.from("remera_comprobantes").select("comprobante_base64").eq("id", r.id).single()
      if (comp?.comprobante_base64) {
        const b64 = comp.comprobante_base64 as string
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
      await supabase.from("remera").update({ estado }).eq("id", id)
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
    const matchEnvio = filtroEnvio === "todos" || r.envioTipo === filtroEnvio
    return matchBusqueda && matchEstado && matchTalle && matchEnvio
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
        <label className="text-sm font-medium text-gray-700 block">Datos de pago (visible en el formulario de pedido)</label>
        <Textarea
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder={"Alias: ciclotermal.remera\nTitular: ...\nCBU: ..."}
          rows={4}
        />
        <Button onClick={guardarAlias} disabled={aliasGuardando} size="sm" className="w-full sm:w-auto">
          {aliasGuardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Guardar
        </Button>
      </div>

      {/* Resumen por talle */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-3">
        {["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"].map((t) => (
          <Card key={t} className="text-center">
            <CardContent className="p-3 sm:pt-4 sm:pb-3">
              <div className="text-xl sm:text-2xl font-bold text-violet-600">{conteoTalles[t] || 0}</div>
              <div className="text-xs text-gray-500 font-medium mt-0.5 sm:mt-1">{t}</div>
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
        <Select value={filtroEnvio} onValueChange={setFiltroEnvio}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Entrega" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="retiro">Retiro en evento</SelectItem>
            <SelectItem value="envio">Envío a domicilio</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroTalle} onValueChange={setFiltroTalle}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Talle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"].map((t) => (
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
          {/* Mobile: lista compacta */}
          <div className="md:hidden divide-y rounded-xl border bg-white shadow-sm overflow-hidden">
            {filtradas.map((r) => (
              <div key={r.id} className="px-3 py-2.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm truncate">{r.nombre}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded text-[11px] font-semibold">
                      {formatItems(r)}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-medium border ${estadoColors[r.estado] || ""}`}>
                      {r.estado}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-gray-400 truncate">
                    {r.dni} · {r.telefono}
                  </p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium shrink-0">
                    {r.envioTipo === "envio" ? "Envío" : "Retiro"}
                  </span>
                </div>
                {r.envioTipo === "envio" && r.direccion && (
                  <p className="text-[10px] text-gray-500 truncate">📍 {r.direccion}</p>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  {r.tieneComprobante && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => verComprobante(r)}
                      disabled={fetchingComprobante === r.id}
                      className="h-6 w-6 p-0"
                    >
                      {fetchingComprobante === r.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Eye className="h-3.5 w-3.5" />
                      }
                    </Button>
                  )}
                  {r.estado === "pendiente" ? (
                    <Button
                      size="sm"
                      className="h-6 text-[10px] px-2 bg-green-600 hover:bg-green-700 text-white"
                      disabled={actualizando === r.id}
                      onClick={() => cambiarEstado(r.id, "entregado")}
                    >
                      {actualizando === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Entregado"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2"
                      disabled={actualizando === r.id}
                      onClick={() => cambiarEstado(r.id, "pendiente")}
                    >
                      {actualizando === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Revertir"}
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
                  <th className="px-4 py-3 text-center font-medium">Entrega</th>
                  <th className="px-4 py-3 text-left font-medium">Dirección</th>
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
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${r.envioTipo === "envio" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                        {r.envioTipo === "envio" ? "Envío" : "Retiro"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-xs truncate" title={r.direccion || ""}>
                      {r.envioTipo === "envio" && r.direccion ? r.direccion : "—"}
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
            <p className="text-xs text-gray-500">Pedido: {comprobanteModal?.record.fechaSolicitud ? formatFecha(comprobanteModal.record.fechaSolicitud) : "—"}</p>
          </DialogHeader>
          {comprobanteModal?.base64 && (
            (comprobanteModal.base64.startsWith("data:application/pdf") || comprobanteModal.base64.endsWith(".pdf")) ? (
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
