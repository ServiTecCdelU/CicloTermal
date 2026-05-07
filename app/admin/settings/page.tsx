"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase/firebase-config"
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore"
import { AlertCircle } from "lucide-react"

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [years, setYears] = useState([])
  const [settings, setSettings] = useState({
    cupoMaximo: 300,
    precio: 35000,
    metodoPago: "Transferencia bancaria",
    datosPago: "",
    inscripcionesAbiertas: true,
    currentYear: new Date().getFullYear(),
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = doc(db, "settings", "eventSettings")
        const docSnap = await getDoc(settingsDoc)

        if (docSnap.exists()) {
          setSettings(docSnap.data())
        }

        // Fetch available years
        const yearsRef = collection(db, "eventYears")
        const yearsSnapshot = await getDocs(yearsRef)
        const yearsData = yearsSnapshot.docs.map((doc) => doc.data().year)
        setYears(yearsData.sort((a, b) => b - a)) // Sort years in descending order
      } catch (error) {
        console.error("Error fetching settings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setSettings({
      ...settings,
      [name]: type === "number" ? Number(value) : value,
    })
  }

  const handleSwitchChange = (checked) => {
    setSettings({
      ...settings,
      inscripcionesAbiertas: checked,
    })
  }

  const handleSelectChange = (name, value) => {
    setSettings({
      ...settings,
      [name]: name === "currentYear" ? Number(value) : value,
    })
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, "settings", "eventSettings"), settings)
      toast({
        title: "Configuración guardada",
        description: "Los cambios han sido guardados correctamente",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const startNewEdition = async () => {
    if (
      !confirm(
        "¿Estás seguro de que deseas iniciar una nueva edición? Esto guardará todos los datos actuales y creará una nueva edición vacía.",
      )
    ) {
      return
    }

    setSaving(true)
    try {
      const nextYear = new Date().getFullYear() + 1
      const newEdition = `Edición ${nextYear}`

      // Add new year to eventYears collection
      await setDoc(doc(db, "eventYears", nextYear.toString()), {
        year: nextYear,
        edition: newEdition,
      })

      // Update current year in settings
      await setDoc(doc(db, "settings", "eventSettings"), {
        ...settings,
        currentYear: nextYear,
      })

      // Reset registrations for new year
      // (We don't delete old registrations, they remain in the database with their year)

      toast({
        title: "Nueva edición creada",
        description: `Se ha iniciado la edición del año ${nextYear}`,
      })

      // Refresh the page to show new settings
      window.location.reload()
    } catch (error) {
      console.error("Error creating new edition:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la nueva edición",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
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

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuración General</CardTitle>
            <CardDescription>Configura los parámetros generales del evento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cupoMaximo">Cupo máximo de participantes</Label>
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
                <Input id="precio" name="precio" type="number" value={settings.precio} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodoPago">Método de pago</Label>
                <Input id="metodoPago" name="metodoPago" value={settings.metodoPago} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentYear">Año actual del evento</Label>
                <Select
                  value={settings.currentYear.toString()}
                  onValueChange={(value) => handleSelectChange("currentYear", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar año" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="datosPago">Datos de pago (información bancaria)</Label>
              <Textarea
                id="datosPago"
                name="datosPago"
                value={settings.datosPago}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="inscripcionesAbiertas"
                checked={settings.inscripcionesAbiertas}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="inscripcionesAbiertas">Inscripciones abiertas</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Cancelar
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nueva Edición</CardTitle>
            <CardDescription>Inicia una nueva edición del evento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-2 p-4 bg-amber-50 rounded-md">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-700">Atención</h4>
                <p className="text-sm text-amber-600">
                  Al iniciar una nueva edición, se guardará toda la información actual y se creará una nueva edición
                  vacía. Las inscripciones anteriores se mantendrán en el sistema pero asociadas a la edición anterior.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="destructive" onClick={startNewEdition} disabled={saving} className="ml-auto">
              {saving ? "Procesando..." : "Iniciar nueva edición"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}