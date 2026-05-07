"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase/firebase-config"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { Loader2, Upload, Shirt, Check, X, ImageIcon, Edit3, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface JerseyFeature {
  id: string
  title: string
  description: string
}

interface JerseyData {
  title: string
  description: string
  imageUrl: string
  showSection: boolean
  year: number
  callToActionTitle: string
  callToActionDescription: string
  features: JerseyFeature[]
}

interface AlertState {
  show: boolean
  message: string
  type: "success" | "error"
}

// Función para comprimir imagen a base64
const compressImage = (file: File, maxWidth = 800, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new window.Image()

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio

      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
      const compressedBase64 = canvas.toDataURL("image/jpeg", quality)
      resolve(compressedBase64)
    }

    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

const defaultFeatures: JerseyFeature[] = [
  { id: "1", title: "Material Premium", description: "Tela transpirable y cómoda" },
  { id: "2", title: "Diseño Exclusivo", description: "Solo para participantes" },
  { id: "3", title: "Todos los Talles", description: "S, M, L, XL, XXL" },
  { id: "4", title: "Recuerdo Único", description: "Lleva el evento contigo" },
]

export default function JerseyEditor() {
  const { toast } = useToast()
  const { eventSettings } = useFirebaseContext()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [jerseyData, setJerseyData] = useState<JerseyData>({
    title: "Remera Oficial del Evento",
    description:
      "Diseño exclusivo para la Segunda Edición del Cicloturismo Termal de Federación. Confeccionada con materiales de alta calidad, perfecta para ciclistas que buscan comodidad y estilo.",
    imageUrl: "/placeholder.svg?height=600&width=600",
    showSection: true,
    year: new Date().getFullYear(),
    callToActionTitle: "¡Incluida en tu inscripción!",
    callToActionDescription: "Cada participante recibe su remera oficial como parte de los beneficios del evento.",
    features: defaultFeatures,
  })
  const [file, setFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [editingFeature, setEditingFeature] = useState<string | null>(null)
  const [featureForm, setFeatureForm] = useState({ title: "", description: "" })
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    message: "",
    type: "success",
  })

  useEffect(() => {
    const fetchJerseyData = async () => {
      try {
        const currentYear = eventSettings?.currentYear || new Date().getFullYear()
        const jerseyDoc = doc(db, "jersey", "info")
        const docSnap = await getDoc(jerseyDoc)

        if (docSnap.exists()) {
          const data = docSnap.data()
          if (data.year === currentYear) {
            setJerseyData({
              title: data.title || jerseyData.title,
              description: data.description || jerseyData.description,
              imageUrl: data.imageUrl || jerseyData.imageUrl,
              showSection: data.showSection !== undefined ? data.showSection : jerseyData.showSection,
              year: currentYear,
              callToActionTitle: data.callToActionTitle || jerseyData.callToActionTitle,
              callToActionDescription: data.callToActionDescription || jerseyData.callToActionDescription,
              features: data.features || defaultFeatures,
            })
          } else {
            setJerseyData((prev) => ({ ...prev, year: currentYear }))
          }
        } else {
          setJerseyData((prev) => ({ ...prev, year: currentYear }))
        }
      } catch (error) {
        console.error("Error fetching jersey data:", error)
        showAlert("Error al cargar datos de la remera", "error")
      } finally {
        setLoading(false)
      }
    }

    fetchJerseyData()
  }, [eventSettings])

  const showAlert = (message: string, type: "success" | "error" = "success"): void => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 5000)
  }

  const handleInputChange = (field: keyof JerseyData, value: any) => {
    setJerseyData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        showAlert("La imagen debe ser menor a 5MB", "error")
        return
      }

      if (!selectedFile.type.startsWith("image/")) {
        showAlert("Debe seleccionar una imagen válida", "error")
        return
      }

      try {
        setSaving(true)
        const compressedBase64 = await compressImage(selectedFile)
        setFile(selectedFile)
        setImagePreview(compressedBase64)
        showAlert("Imagen procesada correctamente")
      } catch (error) {
        console.error("Error comprimiendo imagen:", error)
        showAlert("Error al procesar la imagen", "error")
      } finally {
        setSaving(false)
      }
    }
  }

  const handleFeatureSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!featureForm.title.trim() || !featureForm.description.trim()) {
      showAlert("Título y descripción son requeridos", "error")
      return
    }

    if (editingFeature) {
      // Editar característica existente
      setJerseyData((prev) => ({
        ...prev,
        features: prev.features.map((feature) =>
          feature.id === editingFeature
            ? { ...feature, title: featureForm.title.trim(), description: featureForm.description.trim() }
            : feature,
        ),
      }))
      showAlert("Característica actualizada")
    } else {
      // Agregar nueva característica
      const newFeature: JerseyFeature = {
        id: Date.now().toString(),
        title: featureForm.title.trim(),
        description: featureForm.description.trim(),
      }
      setJerseyData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature],
      }))
      showAlert("Característica agregada")
    }

    resetFeatureForm()
  }

  const handleEditFeature = (feature: JerseyFeature) => {
    setFeatureForm({ title: feature.title, description: feature.description })
    setEditingFeature(feature.id)
  }

  const handleDeleteFeature = (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta característica?")) return

    setJerseyData((prev) => ({
      ...prev,
      features: prev.features.filter((feature) => feature.id !== id),
    }))
    showAlert("Característica eliminada")
  }

  const resetFeatureForm = () => {
    setFeatureForm({ title: "", description: "" })
    setEditingFeature(null)
  }

  const saveChanges = async () => {
    setSaving(true)
    try {
      let imageUrl = jerseyData.imageUrl

      // Use compressed base64 if new image was selected
      if (imagePreview) {
        imageUrl = imagePreview
      }

      const currentYear = eventSettings?.currentYear || new Date().getFullYear()

      // Save to Firestore
      await setDoc(doc(db, "jersey", "info"), {
        ...jerseyData,
        imageUrl,
        year: currentYear,
        updatedAt: new Date(),
      })

      // Update local state
      setJerseyData((prev) => ({ ...prev, imageUrl }))

      // Reset file states
      setFile(null)
      setImagePreview("")

      showAlert("Información de la remera actualizada correctamente")
    } catch (error) {
      console.error("Error saving jersey data:", error)
      showAlert("Error al guardar los cambios", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert */}
      {alert.show && (
        <Alert
          className={`shadow-sm animate-in fade-in slide-in-from-top duration-300 ${
            alert.type === "error" ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === "error" ? (
              <X className="h-4 w-4 text-red-600" />
            ) : (
              <Check className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={`font-medium ${alert.type === "error" ? "text-red-700" : "text-green-700"}`}>
              {alert.message}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shirt className="h-5 w-5 text-pink-500" />
              Información de la Remera
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={jerseyData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Ej: Remera Oficial del Evento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={jerseyData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={6}
                placeholder="Describe las características de la remera..."
              />
              <p className="text-xs text-muted-foreground">
                Descripción principal que aparecerá en la sección de la remera
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="showSection"
                checked={jerseyData.showSection}
                onCheckedChange={(checked) => handleInputChange("showSection", checked)}
              />
              <Label htmlFor="showSection">Mostrar sección en la página</Label>
            </div>
          </CardContent>
        </Card>

        {/* Imagen de la remera */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-violet-500" />
              Imagen de la Remera
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vista previa actual */}
            <div className="relative aspect-square max-w-sm mx-auto border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <Image
                src={imagePreview || jerseyData.imageUrl || "/placeholder.svg?height=400&width=400"}
                alt="Vista previa de la remera"
                fill
                className="object-contain p-4"
              />
              {imagePreview && (
                <div className="absolute top-2 right-2">
                  <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">Nueva imagen</div>
                </div>
              )}
            </div>

            {/* Subir imagen */}
            <div className="space-y-2">
              <Label htmlFor="jersey-image">Subir nueva imagen</Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="jersey-image"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300 hover:border-gray-400"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG (Max. 5MB)</p>
                  </div>
                  <Input
                    id="jersey-image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Botón para limpiar imagen */}
            {(file || imagePreview) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFile(null)
                  setImagePreview("")
                }}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar imagen nueva
              </Button>
            )}
          </CardContent>
        </Card>
      </div>



      {/* Características */}
      <Card>
        <CardHeader>
          <CardTitle>Características de la Remera</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulario para agregar/editar características */}
          <form onSubmit={handleFeatureSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feature-title">Título *</Label>
                <Input
                  id="feature-title"
                  value={featureForm.title}
                  onChange={(e) => setFeatureForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Material Premium"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feature-description">Descripción *</Label>
                <Input
                  id="feature-description"
                  value={featureForm.description}
                  onChange={(e) => setFeatureForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Ej: Tela transpirable y cómoda"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingFeature ? "Actualizar" : "Agregar"} Característica
              </Button>
              {editingFeature && (
                <Button type="button" variant="outline" onClick={resetFeatureForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>

          {/* Lista de características */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jerseyData.features.map((feature, index) => (
              <div key={feature.id} className="p-4 border rounded-lg bg-white">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEditFeature(feature)}>
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteFeature(feature.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          {jerseyData.features.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay características agregadas</p>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Call to Action */}
      <Card>
        <CardHeader>
          <CardTitle>Call to Action</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cta-title">Título del Call to Action</Label>
            <Input
              id="cta-title"
              value={jerseyData.callToActionTitle}
              onChange={(e) => handleInputChange("callToActionTitle", e.target.value)}
              placeholder="¡Incluida en tu inscripción!"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta-description">Descripción</Label>
            <Textarea
              id="cta-description"
              value={jerseyData.callToActionDescription}
              onChange={(e) => handleInputChange("callToActionDescription", e.target.value)}
              rows={3}
              placeholder="Cada participante recibe su remera oficial..."
            />
          </div>
        </CardContent>
      </Card>
      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button onClick={saveChanges} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
