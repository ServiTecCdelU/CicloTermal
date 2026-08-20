"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { authHeaders } from "@/lib/supabase/auth-headers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Edit3, Plus, X, Check, Upload, ExternalLink, GripVertical, ArrowUp, ArrowDown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

interface BikeFriendly {
  id: string
  name: string
  website: string
  image_base64: string
  order: number
  created_at: string
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

      if (hasTransparency) ctx?.clearRect(0, 0, canvas.width, canvas.height)
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

      const compressed = canvas.toDataURL(format, hasTransparency ? undefined : quality)
      resolve(compressed.length > 800000 && !hasTransparency ? canvas.toDataURL("image/jpeg", 0.6) : compressed)
    }

    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export default function BikeFriendlyEditor() {
  const [items, setItems] = useState<BikeFriendly[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({ name: "", website: "", image: null, imagePreview: "" })
  const [alert, setAlert] = useState<AlertState>({ show: false, message: "", type: "success" })

  useEffect(() => { loadItems() }, [])

  const loadItems = async () => {
    const { data } = await supabase.from("bike_friendly").select("*").order("order", { ascending: true })
    setItems((data || []) as BikeFriendly[])
  }

  const showAlert = (message: string, type: "success" | "error" = "success") => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 5000)
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) { showAlert("La imagen debe ser menor a 10MB", "error"); return }
    if (!file.type.startsWith("image/")) { showAlert("Debe seleccionar una imagen válida", "error"); return }

    try {
      setLoading(true)
      const compressed = await compressImage(file)
      setFormData((prev) => ({ ...prev, image: file, imagePreview: compressed }))
      showAlert("Imagen procesada correctamente")
    } catch {
      showAlert("Error al procesar la imagen", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({ name: "", website: "", image: null, imagePreview: "" })
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) { showAlert("El nombre es requerido", "error"); return }
    if (!formData.imagePreview && !editingId) { showAlert("La imagen es requerida", "error"); return }

    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        website: formData.website.trim(),
        updated_at: new Date().toISOString(),
      }
      if (formData.imagePreview) payload.image_base64 = formData.imagePreview

      if (editingId) {
        await supabase.from("bike_friendly").update(payload).eq("id", editingId)
        showAlert("Alojamiento actualizado exitosamente")
      } else {
        const maxOrder = items.length > 0 ? Math.max(...items.map((s) => s.order)) : -1
        await supabase.from("bike_friendly").insert({ ...payload, order: maxOrder + 1, created_at: new Date().toISOString() })
        showAlert("Alojamiento agregado exitosamente")
      }

      resetForm()
      loadItems()
    } catch {
      showAlert("Error al guardar. La imagen puede ser muy grande.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: BikeFriendly) => {
    setFormData({ name: item.name, website: item.website, image: null, imagePreview: item.image_base64 })
    setEditingId(item.id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que querés eliminar este alojamiento?")) return
    try {
      const res = await fetch("/api/admin/delete", {
        method: "DELETE",
        headers: await authHeaders(),
        body: JSON.stringify({ table: "bike_friendly", id }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      showAlert("Alojamiento eliminado exitosamente")
      loadItems()
    } catch (error) {
      showAlert("Error al eliminar alojamiento", "error")
    }
  }

  const moveItem = async (itemId: string, direction: "up" | "down") => {
    const idx = items.findIndex((s) => s.id === itemId)
    if (idx === -1) return
    const newIdx = direction === "up" ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= items.length) return

    const newItems = [...items]
    const [moved] = newItems.splice(idx, 1)
    newItems.splice(newIdx, 0, moved)

    await Promise.all(newItems.map((item, i) => supabase.from("bike_friendly").update({ order: i }).eq("id", item.id)))
    setItems(newItems.map((item, i) => ({ ...item, order: i })))
    showAlert("Orden actualizado exitosamente")
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return
    const newItems = Array.from(items)
    const [reordered] = newItems.splice(result.source.index, 1)
    newItems.splice(result.destination.index, 0, reordered)
    setItems(newItems)
    await Promise.all(newItems.map((item, i) => supabase.from("bike_friendly").update({ order: i }).eq("id", item.id)))
    showAlert("Orden actualizado exitosamente")
  }

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-7xl">
      {alert.show && (
        <Alert className={`shadow-sm animate-in fade-in slide-in-from-top duration-300 ${alert.type === "error" ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}`}>
          <div className="flex items-center gap-2">
            {alert.type === "error" ? <X className="h-4 w-4 text-red-600" /> : <Check className="h-4 w-4 text-green-600" />}
            <AlertDescription className={`font-medium ${alert.type === "error" ? "text-red-700" : "text-green-700"}`}>
              {alert.message}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <Card className="shadow-md border-t-4 border-t-primary">
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center gap-2 text-primary">
            {editingId ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {editingId ? "Editar Alojamiento" : "Agregar Alojamiento BikeFriendly"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Alojamiento *</Label>
                <Input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} placeholder="Ej: Hostel El Ciclista" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Sitio Web (opcional)</Label>
                <Input id="website" name="website" type="url" value={formData.website} onChange={handleInputChange} placeholder="https://ejemplo.com" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Logo / Foto del Alojamiento</Label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="image" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                    <p className="text-xs text-gray-500">JPG, PNG, GIF (Max. 10MB - se comprimirá automáticamente)</p>
                  </div>
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            </div>

            {formData.imagePreview && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" />Vista previa</Label>
                <div className="relative w-full max-w-xs mx-auto h-40 border-2 border-primary/20 rounded-lg overflow-hidden shadow-sm" style={{ backgroundImage: "repeating-conic-gradient(#d4d4d4 0% 25%, transparent 0% 50%)", backgroundSize: "16px 16px" }}>
                  <img src={formData.imagePreview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-contain p-2" />
                  <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 h-6 w-6 rounded-full" onClick={() => setFormData((prev) => ({ ...prev, image: null, imagePreview: "" }))}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex items-center gap-2 min-w-[160px]" size="lg">
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
                ) : (
                  <><Check className="h-5 w-5" />{editingId ? "Actualizar" : "Agregar"} Alojamiento</>
                )}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} size="lg" className="min-w-[120px]">
                  <X className="h-4 w-4 mr-2" />Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="bg-muted/50 border-b">
          <CardTitle className="flex items-center justify-between">
            <span>Alojamientos Registrados ({items.length})</span>
            <span className="text-sm font-normal text-muted-foreground">Arrastra para reordenar</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {items.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="bg-muted/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Upload className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No hay alojamientos registrados aún</h3>
              <p className="text-muted-foreground max-w-md mx-auto">Agrega el primero usando el formulario de arriba</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="bike_friendly">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <Card ref={provided.innerRef} {...provided.draggableProps} className={`relative group overflow-hidden transition-all hover:shadow-lg border-t-2 border-t-transparent hover:border-t-primary ${snapshot.isDragging ? "shadow-2xl rotate-2" : ""}`}>
                            <CardContent className="p-5">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" onClick={() => moveItem(item.id, "up")} disabled={index === 0} className="h-6 w-6">
                                      <ArrowUp className="h-3 w-3" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => moveItem(item.id, "down")} disabled={index === items.length - 1} className="h-6 w-6">
                                      <ArrowDown className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="w-full h-36 rounded-lg overflow-hidden border flex items-center justify-center p-3" style={{ backgroundImage: "repeating-conic-gradient(#d4d4d4 0% 25%, transparent 0% 50%)", backgroundSize: "16px 16px" }}>
                                  <img src={item.image_base64 || "/placeholder.svg"} alt={item.name} className="w-full h-full object-contain transition-transform group-hover:scale-105" />
                                </div>

                                <div className="space-y-2">
                                  <h3 className="font-semibold text-lg truncate" title={item.name}>{item.name}</h3>
                                  {item.website && (
                                    <a href={item.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 text-sm font-medium transition-colors">
                                      <ExternalLink className="h-3.5 w-3.5" />Visitar sitio web
                                    </a>
                                  )}
                                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/60"></span>
                                    Agregado: {new Date(item.created_at).toLocaleDateString()}
                                  </p>
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <Button size="sm" variant="outline" onClick={() => handleEdit(item)} className="flex-1 hover:bg-primary/10 transition-colors">
                                    <Edit3 className="h-3.5 w-3.5 mr-1.5" />Editar
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors">
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
