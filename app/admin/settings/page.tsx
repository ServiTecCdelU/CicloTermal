"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase/firebase-config"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { AlertCircle, Plus, Calendar } from "lucide-react"
import type { CicloConfig } from "@/lib/firebase/firebase-provider"

const emptySettings = {
  cupoMaximo: 300,
  precio: 35000,
  metodoPago: "Transferencia bancaria",
  datosPago: "",
}

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingCiclos, setSavingCiclos] = useState(false)
  const [settings, setSettings] = useState(emptySettings)
  const [ciclos, setCiclos] = useState<CicloConfig[]>([])

  useEffect(() => {
    const fetch = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, "settings", "eventSettings"))
        if (settingsSnap.exists()) {
          const data = settingsSnap.data()
          setSettings({
            cupoMaximo: data.cupoMaximo ?? 300,
            precio: data.precio ?? 35000,
            metodoPago: data.metodoPago ?? "Transferencia bancaria",
            datosPago: data.datosPago ?? "",
          })
        }

        const ciclosSnap = await getDoc(doc(db, "configuracion", "inscripciones"))
        if (ciclosSnap.exists()) {
          setCiclos(ciclosSnap.data().ciclos || [])
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

  const saveCiclos = async () => {
    setSavingCiclos(true)
    try {
      await setDoc(doc(db, "configuracion", "inscripciones"), { ciclos })
      toast({ title: "Ciclos guardados" })
    } catch {
      toast({ title: "Error al guardar ciclos", variant: "destructive" })
    } finally {
      setSavingCiclos(false)
    }
  }

  const toggleCiclo = (idx: number, habilitado: boolean) => {
    setCiclos(ciclos.map((c, i) => (i === idx ? { ...c, habilitado } : c)))
  }

  const updateCicloFecha = (idx: number, field: "fechaDesde" | "fechaHasta", value: string) => {
    setCiclos(ciclos.map((c, i) => (i === idx ? { ...c, [field]: value } : c)))
  }

  const addYear = () => {
    const maxAño = ciclos.length > 0 ? Math.max(...ciclos.map((c) => c.año)) : new Date().getFullYear()
    const nextAño = maxAño + 1
    if (ciclos.some((c) => c.año === nextAño)) return
    setCiclos([...ciclos, { año: nextAño, habilitado: false, fechaDesde: "", fechaHasta: "" }])
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Cargando configuración...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Evento</h1>
        <p className="text-muted-foreground">Administra la configuración general del evento</p>
      </div>

      {/* ── Configuración general ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
          <CardDescription>Cupo, precio y datos de pago</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="cupoMaximo">Cupo máximo de participantes</Label>
              <Input id="cupoMaximo" name="cupoMaximo" type="number" value={settings.cupoMaximo} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Precio de inscripción ($)</Label>
              <Input id="precio" name="precio" type="number" value={settings.precio} onChange={handleInputChange} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="metodoPago">Método de pago</Label>
              <Input id="metodoPago" name="metodoPago" value={settings.metodoPago} onChange={handleInputChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="datosPago">Datos bancarios para el formulario</Label>
            <Textarea id="datosPago" name="datosPago" value={settings.datosPago} onChange={handleInputChange} rows={4} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </CardFooter>
      </Card>

      {/* ── Gestión de ciclos / inscripciones ────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Inscripciones por año (ciclos)
          </CardTitle>
          <CardDescription>
            Habilitá o deshabilitá inscripciones y establecé el rango de fechas para cada ciclo.
            La ruta de inscripción será <code>/inscripcion/[año]</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ciclos.length === 0 && (
            <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-md">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <p className="text-sm text-amber-700">No hay ciclos configurados. Agregá un año para comenzar.</p>
            </div>
          )}

          {ciclos
            .slice()
            .sort((a, b) => b.año - a.año)
            .map((ciclo, rawIdx) => {
              const idx = ciclos.findIndex((c) => c.año === ciclo.año)
              return (
                <div key={ciclo.año} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Cicloturismo {ciclo.año}</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={ciclo.habilitado}
                        onCheckedChange={(v) => toggleCiclo(idx, v)}
                        id={`habilitado-${ciclo.año}`}
                      />
                      <Label htmlFor={`habilitado-${ciclo.año}`} className="cursor-pointer">
                        {ciclo.habilitado ? "Habilitado" : "Deshabilitado"}
                      </Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`desde-${ciclo.año}`}>Fecha de apertura</Label>
                      <Input
                        id={`desde-${ciclo.año}`}
                        type="date"
                        value={ciclo.fechaDesde}
                        onChange={(e) => updateCicloFecha(idx, "fechaDesde", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`hasta-${ciclo.año}`}>Fecha de cierre</Label>
                      <Input
                        id={`hasta-${ciclo.año}`}
                        type="date"
                        value={ciclo.fechaHasta}
                        onChange={(e) => updateCicloFecha(idx, "fechaHasta", e.target.value)}
                      />
                    </div>
                  </div>

                  {ciclo.habilitado && (
                    <p className="text-xs text-green-700 bg-green-50 px-3 py-1 rounded">
                      Inscripción activa en <code>/inscripcion/{ciclo.año}</code>
                      {ciclo.fechaDesde && ciclo.fechaHasta
                        ? ` — del ${ciclo.fechaDesde} al ${ciclo.fechaHasta}`
                        : " (sin rango de fechas definido)"}
                    </p>
                  )}
                </div>
              )
            })}

          <Button variant="outline" className="w-full" onClick={addYear}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar nuevo año
          </Button>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={saveCiclos} disabled={savingCiclos}>
            {savingCiclos ? "Guardando..." : "Guardar ciclos"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
