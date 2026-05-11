"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase/firebase-config"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings2 } from "lucide-react"

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 2099 - 2025 + 1 }, (_, i) => 2025 + i)

const emptySettings = {
  cupoMaximo: 300,
  precio: 35000,
  metodoPago: "Transferencia bancaria",
  datosPago: "",
  currentYear: CURRENT_YEAR,
}

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(emptySettings)

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "eventSettings"))
        if (snap.exists()) {
          const d = snap.data()
          setSettings({
            cupoMaximo: d.cupoMaximo ?? 300,
            precio: d.precio ?? 35000,
            metodoPago: d.metodoPago ?? "Transferencia bancaria",
            datosPago: d.datosPago ?? "",
            currentYear: d.currentYear ?? CURRENT_YEAR,
          })
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">Cargando configuración...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Evento</h1>
        <p className="text-muted-foreground mt-1">Parámetros generales del cicloturismo</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
            Configuración General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Año actual */}
          <div className="space-y-2">
            <Label htmlFor="currentYear">Año actual del evento</Label>
            <Select
              value={String(settings.currentYear)}
              onValueChange={(v) => setSettings({ ...settings, currentYear: Number(v) })}
            >
              <SelectTrigger id="currentYear" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t" />

          {/* Cupo y precio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="cupoMaximo">Cupo máximo</Label>
              <Input
                id="cupoMaximo"
                name="cupoMaximo"
                type="number"
                value={settings.cupoMaximo}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Precio de inscripción ($)</Label>
              <Input
                id="precio"
                name="precio"
                type="number"
                value={settings.precio}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="border-t" />

          {/* Pago */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metodoPago">Método de pago</Label>
              <Input
                id="metodoPago"
                name="metodoPago"
                value={settings.metodoPago}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="datosPago">Datos bancarios</Label>
              <Textarea
                id="datosPago"
                name="datosPago"
                value={settings.datosPago}
                onChange={handleInputChange}
                rows={4}
                placeholder="CBU, alias, titular..."
              />
            </div>
          </div>

        </CardContent>
        <CardFooter className="flex justify-end border-t pt-4">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
