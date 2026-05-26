"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Edit3, Plus, X, Check, Upload, ExternalLink, GripVertical, ArrowUp, ArrowDown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

interface Sponsor {
  id: string
  name: string
  website: string
  imageBase64: string
  order: number
  createdAt: Date
}

interface FormData {
  name: string
  website: string
  image: File | null
  imagePreview: string
}

interface AlertState {
  show: boolean
  message: string
  type: "success" | "error"
}

// Función para comprimir imagen
const compressImage = (file: File, maxWidth = 400, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio

      const hasTransparency = file.type === "image/png" || file.type === "image/webp"
      const format = hasTransparency ? "image/png" : "image/jpeg"

      if (hasTransparency) {
        ctx?.clearRect(0, 0, canvas.width, canvas.height)
      }

      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

      const compressedBase64 = canvas.toDataURL(format, hasTransparency ? undefined : quality)

      if (compressedBase64.length > 800000 && !hasTransparency) {
        resolve(canvas.toDataURL("image/jpeg", 0.6))
      } else {
        resolve(compressedBase64)
      }
    }

    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export default function SponsorsEditor() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    website: "",
    image: null,
    imagePreview: "",
  })
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    message: "",
    type: "success",
  })

  useEffect(() => {
    loadSponsors()
  }, [])

  const loadSponsors = async (): Promise<void> => {
    try {
      const { data: rows } = await supabase.from("sponsors").select("*")
      const sponsorsData: Sponsor[] = (rows || []).map((r) => ({
        ...r,
        imageBase64: r.image_base64,
        createdAt: r.created_at ? new Date(r.created_at) : new Date(),
        order: r.order || 0,
      }) as unknown as Sponsor)
      sponsorsData.sort((a, b) => a.order - b.order)
      setSponsors(sponsorsData)
    } catch (error) {
      console.error("Error cargando sponsors:", error)
      showAlert("Error al cargar sponsors", "error")
    }
  }

  const showAlert = (message: string, type: "success" | "error" = "success"): void => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 5000)
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño original (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showAlert("La imagen debe ser menor a 10MB", "error")
        return
      }

      // Validar tipo
      if (!file.type.startsWith("image/")) {
        showAlert("Debe seleccionar una imagen válida", "error")
        return
      }

      try {
        setLoading(true)
        showAlert("Comprimiendo imagen...", "success")

        // Comprimir imagen
        const compressedBase64 = await compressImage(file)

        setFormData((prev) => ({
          ...prev,
          image: file,
          imagePreview: compressedBase64,
        }))

        showAlert("Imagen procesada correctamente", "success")
      } catch (error) {
        console.error("Error comprimiendo imagen:", error)
        showAlert("Error al procesar la imagen", "error")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetForm = (): void => {
    setFormData({
      name: "",
      website: "",
      image: null,
      imagePreview: "",
    })
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showAlert("El nombre es requerido", "error")
      return
    }

    if (!formData.imagePreview && !editingId) {
      showAlert("La imagen es requerida", "error")
      return
    }

    setLoading(true)

    try {
      const sponsorDataSnake: Record<string, unknown> = {
        name: formData.name.trim(),
        website: formData.website.trim(),
        updated_at: new Date().toISOString(),
      }
      if (formData.imagePreview) sponsorDataSnake.image_base64 = formData.imagePreview

      if (editingId) {
        const { error } = await supabase.from("sponsors").update(sponsorDataSnake).eq("id", editingId)
        if (error) throw new Error(error.message)
        showAlert("Sponsor actualizado exitosamente")
      } else {
        const maxOrder = sponsors.length > 0 ? Math.max(...sponsors.map((s) => s.order)) : -1
        const { error } = await supabase.from("sponsors").insert({
          ...sponsorDataSnake,
          order: maxOrder + 1,
          created_at: new Date().toISOString(),
        })
        if (error) throw new Error(error.message)
        showAlert("Sponsor agregado exitosamente")
      }

      resetForm()
      loadSponsors()
    } catch (error) {
      console.error("Error guardando sponsor:", error)
      showAlert(`Error al guardar: ${error instanceof Error ? error.message : "Error desconocido"}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (sponsor: Sponsor): void => {
    setFormData({
      name: sponsor.name,
      website: sponsor.website,
      image: null,
      imagePreview: sponsor.imageBase64,
    })
    setEditingId(sponsor.id)
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm("¿Estás seguro de que quieres eliminar este sponsor?")) {
      return
    }

    try {
      const res = await fetch("/api/admin/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "sponsors", id }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      showAlert("Sponsor eliminado exitosamente")
      loadSponsors()
    } catch (error) {
      console.error("Error eliminando sponsor:", error)
      showAlert("Error al eliminar sponsor", "error")
    }
  }

  // Mover sponsor hacia arriba o abajo
  const moveSponsor = async (sponsorId: string, direction: "up" | "down") => {
    const currentIndex = sponsors.findIndex((s) => s.id === sponsorId)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= sponsors.length) return

    const newSponsors = [...sponsors]
    const [movedSponsor] = newSponsors.splice(currentIndex, 1)
    newSponsors.splice(newIndex, 0, movedSponsor)

    try {
      await Promise.all(newSponsors.map((sponsor, i) => supabase.from("sponsors").update({ order: i }).eq("id", sponsor.id)))
      setSponsors(newSponsors.map((sponsor, index) => ({ ...sponsor, order: index })))
      showAlert("Orden actualizado exitosamente")
    } catch (error) {
      console.error("Error actualizando orden:", error)
      showAlert("Error al actualizar el orden", "error")
    }
  }

  // Drag and drop handler
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const items = Array.from(sponsors)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSponsors(items)

    try {
      await Promise.all(items.map((sponsor, i) => supabase.from("sponsors").update({ order: i }).eq("id", sponsor.id)))
      showAlert("Orden actualizado exitosamente")
    } catch (error) {
      console.error("Error actualizando orden:", error)
      showAlert("Error al actualizar el orden", "error")
      loadSponsors()
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-7xl">
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

      {/* Formulario */}
      <Card className="shadow-md border-t-4 border-t-primary">
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center gap-2 text-primary">
            {editingId ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {editingId ? "Editar Sponsor" : "Agregar Nuevo Sponsor"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Sponsor *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej: Empresa ABC"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Sitio Web (opcional)</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://ejemplo.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Logo del Sponsor</Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="image"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-gray-500">JPG, PNG, GIF (Max. 10MB - se comprimirá automáticamente)</p>
                  </div>
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
              <p className="text-sm text-gray-500">
                Las imágenes se comprimen automáticamente para optimizar el rendimiento
              </p>
            </div>

            {/* Preview de imagen */}
            {formData.imagePreview && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Vista previa
                </Label>
                <div className="relative w-full max-w-xs mx-auto h-40 border-2 border-primary/20 rounded-lg overflow-hidden shadow-sm" style={{ backgroundImage: "repeating-conic-gradient(#d4d4d4 0% 25%, transparent 0% 50%)", backgroundSize: "16px 16px" }}>
                  <img
                    src={formData.imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-full object-contain p-2"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-6 w-6 rounded-full"
                    onClick={() => setFormData((prev) => ({ ...prev, image: null, imagePreview: "" }))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 min-w-[160px] transition-all"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    {editingId ? "Actualizar" : "Agregar"} Sponsor
                  </>
                )}
              </Button>

              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} size="lg" className="min-w-[120px]">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Sponsors */}
      <Card className="shadow-md">
        <CardHeader className="bg-muted/50 border-b">
          <CardTitle className="flex items-center justify-between">
            <span>Sponsors Registrados ({sponsors.length})</span>
            <span className="text-sm font-normal text-muted-foreground">Arrastra para reordenar</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {sponsors.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="bg-muted/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Upload className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No hay sponsors registrados aún</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Agrega el primer sponsor usando el formulario de arriba para que aparezca en esta lista
              </p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sponsors">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  >
                    {sponsors.map((sponsor, index) => (
                      <Draggable key={sponsor.id} draggableId={sponsor.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`relative group overflow-hidden transition-all hover:shadow-lg border-t-2 border-t-transparent hover:border-t-primary ${
                              snapshot.isDragging ? "shadow-2xl rotate-2" : ""
                            }`}
                          >
                            <CardContent className="p-5">
                              <div className="space-y-4">
                                {/* Drag Handle y Número de Orden */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                                    >
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => moveSponsor(sponsor.id, "up")}
                                      disabled={index === 0}
                                      className="h-6 w-6"
                                    >
                                      <ArrowUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => moveSponsor(sponsor.id, "down")}
                                      disabled={index === sponsors.length - 1}
                                      className="h-6 w-6"
                                    >
                                      <ArrowDown className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Logo */}
                                <div className="w-full h-36 rounded-lg overflow-hidden border flex items-center justify-center p-3" style={{ backgroundImage: "repeating-conic-gradient(#d4d4d4 0% 25%, transparent 0% 50%)", backgroundSize: "16px 16px" }}>
                                  <img
                                    src={sponsor.imageBase64 || "/placeholder.svg"}
                                    alt={sponsor.name}
                                    className="w-full h-full object-contain transition-transform group-hover:scale-105"
                                  />
                                </div>

                                {/* Información */}
                                <div className="space-y-2">
                                  <h3 className="font-semibold text-lg truncate" title={sponsor.name}>
                                    {sponsor.name}
                                  </h3>
                                  {sponsor.website && (
                                    <a
                                      href={sponsor.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                      Visitar sitio web
                                    </a>
                                  )}
                                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/60"></span>
                                    Agregado: {sponsor.createdAt.toLocaleDateString()}
                                  </p>
                                </div>

                                {/* Acciones */}
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(sponsor)}
                                    className="flex-1 hover:bg-primary/10 transition-colors"
                                  >
                                    <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                    Editar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDelete(sponsor.id)}
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
