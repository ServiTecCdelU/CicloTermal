"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase/firebase-config"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExternalLink, Plus, Settings2, ToggleLeft, CheckCircle } from "lucide-react"
import type { CicloConfig } from "@/lib/firebase/firebase-provider"

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 2099 - 2025 + 1 }, (_, i) => 2025 + i)

const emptySettings: {
  cupoMaximo: number
  precio: number
  metodoPago: string
  datosPago1: string
  datosPago2: string
  currentYear: number
  fechaEvento: string
  edicion: string
} = {
  cupoMaximo: 300,
  precio: 35000,
  metodoPago: "Transferencia bancaria",
  datosPago1: "",
  datosPago2: "",
  currentYear: CURRENT_YEAR,
  fechaEvento: "",
  edicion: "",
}

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingCiclo, setSavingCiclo] = useState<number | null>(null)
  const [savingFechas, setSavingFechas] = useState<number | null>(null)
  const [addingYear, setAddingYear] = useState(false)
  const [settings, setSettings] = useState(emptySettings)
  const [ciclos, setCiclos] = useState<CicloConfig[]>([])
  const [ciclosEdit, setCiclosEdit] = useState<CicloConfig[]>([])
  const [confirmacion, setConfirmacion] = useState({
    titulo: "¡Inscripción Exitosa!",
    descripcion: "Tu inscripción al Cicloturismo Termal 2026 ha sido registrada exitosamente.",
    mensaje: "Pronto recibirás un correo de confirmación con todos los detalles.\nRecuerda presentar tu DNI el día del evento para la acreditación.",
    infoExtra: "• Presentate con tu DNI el día del evento.\n• Lugar de acreditación: Frente al predio de la Terminal de Ómnibus de Federación.\n• Horario de acreditación: 7:30 AM\n• Horario de salida: 8:30 AM",
  })
  const [savingConfirmacion, setSavingConfirmacion] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [settingsSnap, ciclosSnap, confirmSnap] = await Promise.all([
          getDoc(doc(db, "settings", "eventSettings")),
          getDoc(doc(db, "configuracion", "inscripciones")),
          getDoc(doc(db, "settings", "confirmacion")),
        ])
        if (settingsSnap.exists()) {
          const d = settingsSnap.data()
          setSettings({
            cupoMaximo: d.cupoMaximo ?? 300,
            precio: d.precio ?? 35000,
            metodoPago: d.metodoPago ?? "Transferencia bancaria",
            datosPago1: d.datosPago1 ?? "",
            datosPago2: d.datosPago2 ?? "",
            currentYear: d.currentYear ?? CURRENT_YEAR,
            fechaEvento: d.fechaEvento ?? "",
            edicion: d.edicion ?? "",
          })
        }
        if (ciclosSnap.exists()) {
          const data = ciclosSnap.data().ciclos ?? []
          setCiclos(data)
          setCiclosEdit(data)
        }
        if (confirmSnap.exists()) {
          const d = confirmSnap.data()
          setConfirmacion((prev) => ({
            titulo: d.titulo ?? prev.titulo,
            descripcion: d.descripcion ?? prev.descripcion,
            mensaje: d.mensaje ?? prev.mensaje,
            infoExtra: d.infoExtra ?? prev.infoExtra,
          }))
        }
      } catch (error) {
        console.error("Error cargando configuración:", error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setSettings({ ...settings, [name]: type === "number" ? Number(value) : value })
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, "settings", "eventSettings"), settings, { merge: true })
      toast({ title: "Configuración guardada" })
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const saveConfirmacion = async () => {
    setSavingConfirmacion(true)
    try {
      await setDoc(doc(db, "settings", "confirmacion"), confirmacion)
      toast({ title: "Mensaje de confirmación guardado" })
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" })
    } finally {
      setSavingConfirmacion(false)
    }
  }

  const updateCicloEdit =(año: number, field: keyof CicloConfig, value: any) => {
    setCiclosEdit((prev) => prev.map((c) => (c.año === año ? { ...c, [field]: value } : c)))
  }

  const toggleCiclo = async (año: number, abrir: boolean) => {
    setSavingCiclo(año)
    try {
      const updated = ciclos.some((c) => c.año === año)
        ? ciclos.map((c) => (c.año === año ? { ...c, habilitado: abrir } : c))
        : [...ciclos, { año, habilitado: abrir, fechaDesde: "", fechaHasta: "" }]
      await setDoc(doc(db, "configuracion", "inscripciones"), { ciclos: updated })
      setCiclos(updated)
      setCiclosEdit(updated)
      toast({ title: abrir ? `Inscripciones ${año} abiertas` : `Inscripciones ${año} cerradas` })
    } catch {
      toast({ title: "Error al actualizar", variant: "destructive" })
    } finally {
      setSavingCiclo(null)
    }
  }

  const saveCicloFechas = async (año: number) => {
    setSavingFechas(año)
    try {
      const cicloEdit = ciclosEdit.find((c) => c.año === año)
      const updated = ciclos.map((c) =>
        c.año === año ? { ...c, fechaDesde: cicloEdit!.fechaDesde, fechaHasta: cicloEdit!.fechaHasta } : c
      )
      await setDoc(doc(db, "configuracion", "inscripciones"), { ciclos: updated })
      setCiclos(updated)
      toast({ title: `Fechas del ${año} guardadas` })
    } catch {
      toast({ title: "Error al guardar fechas", variant: "destructive" })
    } finally {
      setSavingFechas(null)
    }
  }

  const addNewYear = async () => {
    setAddingYear(true)
    try {
      const maxYear = ciclos.length > 0 ? Math.max(...ciclos.map((c) => c.año)) : CURRENT_YEAR
      const newYear = maxYear + 1
      const updated = [...ciclos, { año: newYear, habilitado: false, fechaDesde: "", fechaHasta: "" }]
      await setDoc(doc(db, "configuracion", "inscripciones"), { ciclos: updated })
      setCiclos(updated)
      setCiclosEdit(updated)
      toast({ title: `Ciclo ${newYear} agregado` })
    } catch {
      toast({ title: "Error al agregar año", variant: "destructive" })
    } finally {
      setAddingYear(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">Cargando configuración...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configuración del Evento</h1>
        <p className="text-muted-foreground mt-1">Parámetros generales del cicloturismo</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ToggleLeft className="h-5 w-5 text-muted-foreground" />
            Gestión de Inscripciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ciclosEdit.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay ciclos configurados. Agregá uno.</p>
          )}
          {ciclosEdit.map((ciclo) => (
            <div key={ciclo.año} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Inscripciones {ciclo.año}</p>
                  <p className="text-sm text-muted-foreground">
                    {ciclo.habilitado ? "Habilitadas" : "Deshabilitadas"}
                  </p>
                </div>
                <Switch
                  checked={ciclo.habilitado}
                  onCheckedChange={(v) => toggleCiclo(ciclo.año, v)}
                  disabled={savingCiclo === ciclo.año}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Fecha desde</Label>
                  <Input
                    type="date"
                    value={ciclo.fechaDesde}
                    onChange={(e) => updateCicloEdit(ciclo.año, "fechaDesde", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Fecha hasta</Label>
                  <Input
                    type="date"
                    value={ciclo.fechaHasta}
                    onChange={(e) => updateCicloEdit(ciclo.año, "fechaHasta", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <Button
                  size="sm"
                  onClick={() => saveCicloFechas(ciclo.año)}
                  disabled={savingFechas === ciclo.año}
                >
                  {savingFechas === ciclo.año ? "Guardando..." : "Guardar fechas"}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/inscripcion/${ciclo.año}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver inscripción {ciclo.año}
                  </a>
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addNewYear} disabled={addingYear} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {addingYear ? "Agregando..." : "Agregar nuevo año"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
            Configuración General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className="space-y-2">
            <Label htmlFor="edicion">Nombre de la edición</Label>
            <Input
              id="edicion"
              name="edicion"
              value={settings.edicion ?? ""}
              onChange={handleInputChange}
              placeholder="Ej: Segunda Edición, Tercera Edición..."
            />
            <p className="text-xs text-muted-foreground">
              Se muestra en el sitio público y en las redes sociales.
            </p>
          </div>

          <div className="border-t" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="currentYear">Año actual del evento</Label>
              <Select
                value={String(settings.currentYear)}
                onValueChange={(v) => setSettings({ ...settings, currentYear: Number(v) })}
              >
                <SelectTrigger id="currentYear" className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaEvento">Fecha del evento</Label>
              <Input
                id="fechaEvento"
                name="fechaEvento"
                type="date"
                value={settings.fechaEvento ?? ""}
                onChange={handleInputChange}
              />
              {settings.fechaEvento && (
                <p className="text-xs text-muted-foreground">
                  {new Date(settings.fechaEvento + "T00:00:00").toLocaleDateString("es-AR", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="border-t" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="cupoMaximo">Cupo máximo</Label>
              <Input
                id="cupoMaximo"
                name="cupoMaximo"
                type="number"
                value={settings.cupoMaximo ?? 300}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Precio de inscripción ($)</Label>
              <Input
                id="precio"
                name="precio"
                type="number"
                value={settings.precio ?? 0}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="border-t" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metodoPago">Método de pago</Label>
              <Input
                id="metodoPago"
                name="metodoPago"
                value={settings.metodoPago ?? ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="datosPago1">Dato de pago 1 - Argentina</Label>
                <Textarea
                  id="datosPago1"
                  name="datosPago1"
                  value={settings.datosPago1 ?? ""}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder={"Banco: Naranja X\nTitular: ...\nCBU: ...\nAlias: ...\nImporte: $35.000 (ARS)"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="datosPago2">Dato de pago 2 - Uruguay</Label>
                <Textarea
                  id="datosPago2"
                  name="datosPago2"
                  value={settings.datosPago2 ?? ""}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder={"Banco: Prex\nTitular: ...\nCBU: ...\nAlias: ...\nImporte: $1.300 (UYU)"}
                />
              </div>
            </div>
          </div>

        </CardContent>
        <CardFooter className="flex justify-end border-t pt-4">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
            Mensaje de Inscripción Exitosa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={confirmacion.titulo}
              onChange={(e) => setConfirmacion({ ...confirmacion, titulo: e.target.value })}
              placeholder="¡Inscripción Exitosa!"
            />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={confirmacion.descripcion}
              onChange={(e) => setConfirmacion({ ...confirmacion, descripcion: e.target.value })}
              rows={2}
              placeholder="Tu inscripción ha sido registrada exitosamente."
            />
          </div>
          <div className="space-y-2">
            <Label>Mensaje adicional</Label>
            <Textarea
              value={confirmacion.mensaje}
              onChange={(e) => setConfirmacion({ ...confirmacion, mensaje: e.target.value })}
              rows={3}
              placeholder="Pronto recibirás un correo de confirmación..."
            />
          </div>
          <div className="space-y-2">
            <Label>Información importante</Label>
            <Textarea
              value={confirmacion.infoExtra}
              onChange={(e) => setConfirmacion({ ...confirmacion, infoExtra: e.target.value })}
              rows={5}
              placeholder={"• Presentate con tu DNI el día del evento.\n• Lugar de acreditación: ..."}
            />
            <p className="text-xs text-muted-foreground">Usá un punto (•) al inicio de cada línea para listar ítems.</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-4">
          <Button onClick={saveConfirmacion} disabled={savingConfirmacion}>
            {savingConfirmacion ? "Guardando..." : "Guardar mensaje"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
