"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-config"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Edit3, Plus, X, Check, Upload, ExternalLink, GripVertical, ArrowUp, ArrowDown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import NextImage from "next/image"

interface HistoryItem {
  id: string
  title: string
  description: string
  imageUrl: string
  logoUrl: string
  contactLink: string
  order: number
  year: number
  createdAt: Date
}

interface FormData {
  title: string
  description: string
  image: File | null
  imagePreview: string
  logo: File | null
  logoPreview: string
  contactLink: string
}

interface AlertState {
  show: boolean
  message: string
  type: "success" | "error"
}

// Función para comprimir imagen y convertir a base64
const compressImage = (file: File, maxWidth = 400, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    // Usar el constructor nativo de HTML Image, no el componente de Next.js
    const img = new window.Image()

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo aspect ratio
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio

      // Verificar si la imagen original tiene transparencia
      const hasTransparency = file.type === "image/png" || file.type === "image/webp"

      if (hasTransparency) {
        // Para imágenes con transparencia, limpiar el canvas (fondo transparente)
        ctx?.clearRect(0, 0, canvas.width, canvas.height)
      } else {
        // Para imágenes sin transparencia, establecer fondo blanco
        if (ctx) {
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
      }

      // Dibujar imagen redimensionada
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Convertir a base64 manteniendo transparencia si es necesario
      let compressedBase64: string
      if (hasTransparency) {
        // Usar PNG para mantener transparencia
        compressedBase64 = canvas.toDataURL("image/png")

        // Si es muy grande, intentar con menor calidad (solo para PNG)
        if (compressedBase64.length > 500000) {
          // Para PNG, reducir el tamaño de la imagen en lugar de la calidad
          const smallerRatio = Math.min(300 / img.width, 300 / img.height)
          canvas.width = img.width * smallerRatio
          canvas.height = img.height * smallerRatio
          ctx?.clearRect(0, 0, canvas.width, canvas.height)
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
          compressedBase64 = canvas.toDataURL("image/png")
        }
      } else {
        // Usar JPEG para imágenes sin transparencia
        compressedBase64 = canvas.toDataURL("image/jpeg", quality)

        // Si aún es muy grande, reducir más la calidad
        if (compressedBase64.length > 500000) {
          compressedBase64 = canvas.toDataURL("image/jpeg", 0.5)
        }

        // Si sigue siendo muy grande, reducir el tamaño
        if (compressedBase64.length > 500000) {
          const smallerRatio = Math.min(300 / img.width, 300 / img.height)
          canvas.width = img.width * smallerRatio
          canvas.height = img.height * smallerRatio
          if (ctx) {
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          }
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
          compressedBase64 = canvas.toDataURL("image/jpeg", 0.6)
        }
      }

      resolve(compressedBase64)
    }

    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export default function HistoryEditor() {
  const { eventSettings } = useFirebaseContext()
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [imageModal, setImageModal] = useState<{ show: boolean; src: string; alt: string }>({
    show: false,
    src: "",
    alt: "",
  })
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    image: null,
    imagePreview: "",
    logo: null,
    logoPreview: "",
    contactLink: "",
  })
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    message: "",
    type: "success",
  })

  useEffect(() => {
    loadHistoryItems()
  }, [])

  const loadHistoryItems = async (): Promise<void> => {
    try {
      const querySnapshot = await getDocs(collection(db, "historia"))
      const historyData: HistoryItem[] = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            order: doc.data().order || 0,
          }) as HistoryItem,
      )
      historyData.sort((a, b) => a.order - b.order)
      setHistoryItems(historyData)
    } catch (error) {
      console.error("Error cargando historia:", error)
      showAlert("Error al cargar historia", "error")
    }
  }

  const showAlert = (message: string, type: "success" | "error" = "success"): void => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 5000)
  }

  const openImageModal = (src: string, alt: string) => {
    setImageModal({ show: true, src, alt })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "logo"): Promise<void> => {
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
        showAlert("Procesando imagen...", "success")

        // Comprimir imagen
        const maxWidth = type === "logo" ? 200 : 400
        const compressedBase64 = await compressImage(file, maxWidth)

        if (type === "image") {
          setFormData((prev) => ({
            ...prev,
            image: file,
            imagePreview: compressedBase64,
          }))
        } else {
          setFormData((prev) => ({
            ...prev,
            logo: file,
            logoPreview: compressedBase64,
          }))
        }

        showAlert("Imagen procesada correctamente", "success")
      } catch (error) {
        console.error("Error procesando imagen:", error)
        showAlert("Error al procesar la imagen", "error")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetForm = (): void => {
    setFormData({
      title: "",
      description: "",
      image: null,
      imagePreview: "",
      logo: null,
      logoPreview: "",
      contactLink: "",
    })
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!formData.title.trim()) {
      showAlert("El título es requerido", "error")
      return
    }

    if (!formData.description.trim()) {
      showAlert("La descripción es requerida", "error")
      return
    }

    if (!formData.imagePreview && !editingId) {
      showAlert("La imagen es requerida", "error")
      return
    }

    if (!formData.logoPreview && !editingId) {
      showAlert("El logo es requerido", "error")
      return
    }

    setLoading(true)

    try {
      const historyData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        contactLink: formData.contactLink.trim(),
        ...(formData.imagePreview && { imageUrl: formData.imagePreview }),
        ...(formData.logoPreview && { logoUrl: formData.logoPreview }),
        year: eventSettings?.currentYear || new Date().getFullYear(),
        updatedAt: new Date(),
      }

      if (editingId) {
        // Actualizar historia existente
        await updateDoc(doc(db, "historia", editingId), historyData)
        showAlert("Historia actualizada exitosamente")
      } else {
        // Crear nueva historia con order
        const maxOrder = historyItems.length > 0 ? Math.max(...historyItems.map((s) => s.order)) : -1
        await addDoc(collection(db, "historia"), {
          ...historyData,
          order: maxOrder + 1,
          createdAt: new Date(),
        })
        showAlert("Historia agregada exitosamente")
      }

      resetForm()
      loadHistoryItems()
    } catch (error) {
      console.error("Error guardando historia:", error)
      showAlert("Error al guardar historia. Verifica tu conexión a Firebase.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: HistoryItem): void => {
    setFormData({
      title: item.title,
      description: item.description,
      image: null,
      imagePreview: item.imageUrl,
      logo: null,
      logoPreview: item.logoUrl,
      contactLink: item.contactLink,
    })
    setEditingId(item.id)
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta historia?")) {
      return
    }

    try {
      await deleteDoc(doc(db, "historia", id))
      showAlert("Historia eliminada exitosamente")
      loadHistoryItems()
    } catch (error) {
      console.error("Error eliminando historia:", error)
      showAlert("Error al eliminar historia", "error")
    }
  }

  const moveItem = async (itemId: string, direction: "up" | "down") => {
    const currentIndex = historyItems.findIndex((s) => s.id === itemId)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= historyItems.length) return

    const newItems = [...historyItems]
    const [movedItem] = newItems.splice(currentIndex, 1)
    newItems.splice(newIndex, 0, movedItem)

    const batch = writeBatch(db)
    newItems.forEach((item, index) => {
      batch.update(doc(db, "historia", item.id), { order: index })
    })

    try {
      await batch.commit()
      setHistoryItems(newItems.map((item, index) => ({ ...item, order: index })))
      showAlert("Orden actualizado exitosamente")
    } catch (error) {
      console.error("Error actualizando orden:", error)
      showAlert("Error al actualizar el orden", "error")
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const items = Array.from(historyItems)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setHistoryItems(items)

    const batch = writeBatch(db)
    items.forEach((item, index) => {
      batch.update(doc(db, "historia", item.id), { order: index })
    })

    try {
      await batch.commit()
      showAlert("Orden actualizado exitosamente")
    } catch (error) {
      console.error("Error actualizando orden:", error)
      showAlert("Error al actualizar el orden", "error")
      loadHistoryItems()
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
            {editingId ? "Editar Historia" : "Agregar Nueva Historia"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Ej: Pedal Power"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactLink">Enlace de Contacto (opcional)</Label>
                  <Input
                    id="contactLink"
                    name="contactLink"
                    type="url"
                    value={formData.contactLink}
                    onChange={handleInputChange}
                    placeholder="https://linktr.ee/ejemplo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (HTML permitido) *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={8}
                    placeholder="Escribe la historia aquí. Puedes usar HTML como <p>, <strong>, etc."
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Puedes usar etiquetas HTML como &lt;p&gt;, &lt;strong&gt;, &lt;a&gt;, etc.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Logo */}
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo *</Label>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="logo"
                      className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-2 pb-2">
                        <Upload className="w-6 h-6 mb-1 text-gray-500" />
                        <p className="text-xs text-gray-500">Logo pequeño</p>
                      </div>
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, "logo")}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {formData.logoPreview && (
                    <div className="relative w-16 h-16 mx-auto border rounded overflow-hidden">
                      <NextImage
                        src={formData.logoPreview || "/placeholder.svg"}
                        alt="Vista previa del logo"
                        fill
                        className="object-contain p-1 cursor-pointer hover:opacity-80"
                        onClick={() => openImageModal(formData.logoPreview, "Vista previa del logo")}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full"
                        onClick={() => setFormData((prev) => ({ ...prev, logo: null, logoPreview: "" }))}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Imagen principal */}
                <div className="space-y-2">
                  <Label htmlFor="image">Imagen Principal *</Label>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="image"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Imagen principal</span>
                        </p>
                        <p className="text-xs text-gray-500">JPG, PNG (Max. 10MB)</p>
                      </div>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, "image")}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {formData.imagePreview && (
                    <div className="relative w-full max-w-xs mx-auto h-40 border rounded overflow-hidden">
                      <NextImage
                        src={formData.imagePreview || "/placeholder.svg"}
                        alt="Vista previa de la imagen"
                        fill
                        className="object-cover cursor-pointer hover:opacity-80"
                        onClick={() => openImageModal(formData.imagePreview, "Vista previa de la imagen")}
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
                  )}
                </div>
              </div>
            </div>

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
                    {editingId ? "Actualizar" : "Agregar"} Historia
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

      {/* Lista de Historias */}
      <Card className="shadow-md">
        <CardHeader className="bg-muted/50 border-b">
          <CardTitle className="flex items-center justify-between">
            <span>Historias Registradas ({historyItems.length})</span>
            <span className="text-sm font-normal text-muted-foreground">Arrastra para reordenar</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {historyItems.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="bg-muted/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Upload className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No hay historias registradas aún</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Agrega la primera historia usando el formulario de arriba
              </p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="history">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {historyItems.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`relative group overflow-hidden transition-all hover:shadow-lg ${
                              snapshot.isDragging ? "shadow-2xl rotate-1" : ""
                            }`}
                          >
                            <CardContent className="p-6">
                              <div className="flex gap-6">
                                {/* Drag Handle y Número */}
                                <div className="flex flex-col items-center gap-2">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                                  >
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                                  <div className="flex flex-col gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => moveItem(item.id, "up")}
                                      disabled={index === 0}
                                      className="h-6 w-6"
                                    >
                                      <ArrowUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => moveItem(item.id, "down")}
                                      disabled={index === historyItems.length - 1}
                                      className="h-6 w-6"
                                    >
                                      <ArrowDown className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Logo */}
                                <div className="w-16 h-16 bg-white rounded border flex items-center justify-center flex-shrink-0">
                                  <NextImage
                                    src={item.logoUrl || "/placeholder.svg"}
                                    alt={`Logo de ${item.title}`}
                                    width={48}
                                    height={48}
                                    className="object-contain cursor-pointer hover:opacity-80"
                                    onClick={() => openImageModal(item.logoUrl, `Logo de ${item.title}`)}
                                  />
                                </div>

                                {/* Imagen principal */}
                                <div className="w-24 h-16 bg-white rounded border overflow-hidden flex-shrink-0">
                                  <NextImage
                                    src={item.imageUrl || "/placeholder.svg"}
                                    alt={`Imagen de ${item.title}`}
                                    width={96}
                                    height={64}
                                    className="object-cover w-full h-full cursor-pointer hover:opacity-80"
                                    onClick={() => openImageModal(item.imageUrl, `Imagen de ${item.title}`)}
                                  />
                                </div>

                                {/* Contenido */}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                                  <div
                                    className="text-sm text-muted-foreground line-clamp-3 mb-2"
                                    dangerouslySetInnerHTML={{
                                      __html:
                                        (item.description || "").replace(/<[^>]*>/g, "").substring(0, 150) + "...",
                                    }}
                                  />
                                  {item.contactLink && (
                                    <a
                                      href={item.contactLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      Ver contacto
                                    </a>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Agregado: {item.createdAt.toLocaleDateString()}
                                  </p>
                                </div>

                                {/* Acciones */}
                                <div className="flex flex-col gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(item)}
                                    className="hover:bg-primary/10"
                                  >
                                    <Edit3 className="h-3 w-3 mr-1" />
                                    Editar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDelete(item.id)}
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Eliminar
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

      {/* Modal de imagen */}
      {imageModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 px-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
              onClick={() => setImageModal({ show: false, src: "", alt: "" })}
            >
              ✕
            </button>
            <NextImage
              src={imageModal.src}
              alt={imageModal.alt}
              width={800}
              height={600}
              className="object-contain max-w-full max-h-full rounded-lg"
              priority
            />
          </div>
        </div>
      )}
    </div>
  )
}
