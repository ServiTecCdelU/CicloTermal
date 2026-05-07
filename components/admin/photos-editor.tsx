"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
} from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-config"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Edit3, Plus, X, Check, Upload, ExternalLink, ArrowUp, ArrowDown, Camera, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import NextImage from "next/image"

interface PhotoItem {
  id: string
  imageUrl: string
  description: string
  order: number
  year: number
  createdAt: Date
}

interface PhotographerItem {
  id: string
  name: string
  link: string
  description: string
  order: number
  year: number
  createdAt: Date
}

interface PhotoFormData {
  image: File | null
  imagePreview: string
  description: string
}

interface PhotographerFormData {
  name: string
  link: string
  description: string
}

interface AlertState {
  show: boolean
  message: string
  type: "success" | "error"
}

// Función para comprimir imagen y convertir a base64
const compressImage = (file: File, maxWidth = 600, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new window.Image()

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio

      const hasTransparency = file.type === "image/png" || file.type === "image/webp"

      if (hasTransparency) {
        ctx?.clearRect(0, 0, canvas.width, canvas.height)
      } else {
        if (ctx) {
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
      }

      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

      let compressedBase64: string
      if (hasTransparency) {
        compressedBase64 = canvas.toDataURL("image/png")
        if (compressedBase64.length > 800000) {
          const smallerRatio = Math.min(400 / img.width, 400 / img.height)
          canvas.width = img.width * smallerRatio
          canvas.height = img.height * smallerRatio
          ctx?.clearRect(0, 0, canvas.width, canvas.height)
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
          compressedBase64 = canvas.toDataURL("image/png")
        }
      } else {
        compressedBase64 = canvas.toDataURL("image/jpeg", quality)
        if (compressedBase64.length > 800000) {
          compressedBase64 = canvas.toDataURL("image/jpeg", 0.6)
        }
        if (compressedBase64.length > 800000) {
          const smallerRatio = Math.min(400 / img.width, 400 / img.height)
          canvas.width = img.width * smallerRatio
          canvas.height = img.height * smallerRatio
          if (ctx) {
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          }
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
          compressedBase64 = canvas.toDataURL("image/jpeg", 0.7)
        }
      }

      resolve(compressedBase64)
    }

    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export default function PhotosEditor() {
  const { eventSettings } = useFirebaseContext()
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [featuredPhotos, setFeaturedPhotos] = useState<PhotoItem[]>([])
  const [photographers, setPhotographers] = useState<PhotographerItem[]>([])
  const [loading, setLoading] = useState(false)
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null)
  const [editingPhotographerId, setEditingPhotographerId] = useState<string | null>(null)
  const [imageModal, setImageModal] = useState<{ show: boolean; src: string; alt: string }>({
    show: false,
    src: "",
    alt: "",
  })
  const [photoFormData, setPhotoFormData] = useState<PhotoFormData>({
    image: null,
    imagePreview: "",
    description: "",
  })
  const [photographerFormData, setPhotographerFormData] = useState<PhotographerFormData>({
    name: "",
    link: "",
    description: "",
  })
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    message: "",
    type: "success",
  })

  useEffect(() => {
    if (eventSettings?.currentYear) {
      setSelectedYear(eventSettings.currentYear)
    }
  }, [eventSettings])

  useEffect(() => {
    loadFeaturedPhotos()
    loadPhotographers()
  }, [selectedYear])

  const loadFeaturedPhotos = async (): Promise<void> => {
    try {
      const featuredQuery = query(
        collection(db, "galeriaFotos"),
        where("year", "==", selectedYear),
        where("type", "==", "featured"),
        orderBy("order", "asc"),
      )
      const querySnapshot = await getDocs(featuredQuery)
      const featuredData: PhotoItem[] = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          }) as PhotoItem,
      )
      setFeaturedPhotos(featuredData)
    } catch (error) {
      console.error("Error cargando fotos destacadas:", error)
      showAlert("Error al cargar fotos destacadas", "error")
    }
  }

  const loadPhotographers = async (): Promise<void> => {
    try {
      const photographersQuery = query(
        collection(db, "galeriaFotos"),
        where("year", "==", selectedYear),
        where("type", "==", "photographer"),
        orderBy("order", "asc"),
      )
      const querySnapshot = await getDocs(photographersQuery)
      const photographersData: PhotographerItem[] = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          }) as PhotographerItem,
      )
      setPhotographers(photographersData)
    } catch (error) {
      console.error("Error cargando fotógrafos:", error)
      showAlert("Error al cargar fotógrafos", "error")
    }
  }

  const showAlert = (message: string, type: "success" | "error" = "success"): void => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 5000)
  }

  const openImageModal = (src: string, alt: string) => {
    setImageModal({ show: true, src, alt })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showAlert("La imagen debe ser menor a 10MB", "error")
        return
      }

      if (!file.type.startsWith("image/")) {
        showAlert("Debe seleccionar una imagen válida", "error")
        return
      }

      try {
        setLoading(true)
        showAlert("Procesando imagen...", "success")

        const compressedBase64 = await compressImage(file, 600)

        setPhotoFormData((prev) => ({
          ...prev,
          image: file,
          imagePreview: compressedBase64,
        }))

        showAlert("Imagen procesada correctamente", "success")
      } catch (error) {
        console.error("Error procesando imagen:", error)
        showAlert("Error al procesar la imagen", "error")
      } finally {
        setLoading(false)
      }
    }
  }

  const resetPhotoForm = (): void => {
    setPhotoFormData({
      image: null,
      imagePreview: "",
      description: "",
    })
    setEditingPhotoId(null)
  }

  const resetPhotographerForm = (): void => {
    setPhotographerFormData({
      name: "",
      link: "",
      description: "",
    })
    setEditingPhotographerId(null)
  }

  const handlePhotoSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!photoFormData.imagePreview && !editingPhotoId) {
      showAlert("La imagen es requerida", "error")
      return
    }

    setLoading(true)

    try {
      let imageUrl = photoFormData.imagePreview

      if (photoFormData.image) {
        imageUrl = photoFormData.imagePreview
      }

      const photoData = {
        description: photoFormData.description.trim(),
        imageUrl: imageUrl,
        year: selectedYear,
        type: "featured",
        updatedAt: new Date(),
      }

      if (editingPhotoId) {
        await updateDoc(doc(db, "galeriaFotos", editingPhotoId), photoData)
        showAlert("Foto destacada actualizada exitosamente")
      } else {
        const maxOrder = featuredPhotos.length > 0 ? Math.max(...featuredPhotos.map((p) => p.order)) : -1
        await addDoc(collection(db, "galeriaFotos"), {
          ...photoData,
          order: maxOrder + 1,
          createdAt: new Date(),
        })
        showAlert("Foto destacada agregada exitosamente")
      }

      resetPhotoForm()
      loadFeaturedPhotos()
    } catch (error) {
      console.error("Error guardando foto:", error)
      showAlert("Error al guardar foto", "error")
    } finally {
      setLoading(false)
    }
  }

  const handlePhotographerSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!photographerFormData.name.trim()) {
      showAlert("El nombre del fotógrafo es requerido", "error")
      return
    }

    if (!photographerFormData.link.trim()) {
      showAlert("El enlace es requerido", "error")
      return
    }

    setLoading(true)

    try {
      const photographerData = {
        name: photographerFormData.name.trim(),
        link: photographerFormData.link.trim(),
        description: photographerFormData.description.trim(),
        year: selectedYear,
        type: "photographer",
        updatedAt: new Date(),
      }

      if (editingPhotographerId) {
        await updateDoc(doc(db, "galeriaFotos", editingPhotographerId), photographerData)
        showAlert("Fotógrafo actualizado exitosamente")
      } else {
        const maxOrder = photographers.length > 0 ? Math.max(...photographers.map((p) => p.order)) : -1
        await addDoc(collection(db, "galeriaFotos"), {
          ...photographerData,
          order: maxOrder + 1,
          createdAt: new Date(),
        })
        showAlert("Fotógrafo agregado exitosamente")
      }

      resetPhotographerForm()
      loadPhotographers()
    } catch (error) {
      console.error("Error guardando fotógrafo:", error)
      showAlert("Error al guardar fotógrafo", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleEditPhoto = (photo: PhotoItem): void => {
    setPhotoFormData({
      image: null,
      imagePreview: photo.imageUrl,
      description: photo.description,
    })
    setEditingPhotoId(photo.id)
  }

  const handleEditPhotographer = (photographer: PhotographerItem): void => {
    setPhotographerFormData({
      name: photographer.name,
      link: photographer.link,
      description: photographer.description,
    })
    setEditingPhotographerId(photographer.id)
  }

  const handleDeletePhoto = async (id: string): Promise<void> => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta foto destacada?")) {
      return
    }

    try {
      await deleteDoc(doc(db, "galeriaFotos", id))
      showAlert("Foto destacada eliminada exitosamente")
      loadFeaturedPhotos()
    } catch (error) {
      console.error("Error eliminando foto:", error)
      showAlert("Error al eliminar foto", "error")
    }
  }

  const handleDeletePhotographer = async (id: string): Promise<void> => {
    if (!confirm("¿Estás seguro de que quieres eliminar este fotógrafo?")) {
      return
    }

    try {
      await deleteDoc(doc(db, "galeriaFotos", id))
      showAlert("Fotógrafo eliminado exitosamente")
      loadPhotographers()
    } catch (error) {
      console.error("Error eliminando fotógrafo:", error)
      showAlert("Error al eliminar fotógrafo", "error")
    }
  }

  const movePhotoItem = async (itemId: string, direction: "up" | "down") => {
    const currentIndex = featuredPhotos.findIndex((p) => p.id === itemId)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= featuredPhotos.length) return

    const newItems = [...featuredPhotos]
    const [movedItem] = newItems.splice(currentIndex, 1)
    newItems.splice(newIndex, 0, movedItem)

    const batch = writeBatch(db)
    newItems.forEach((item, index) => {
      batch.update(doc(db, "galeriaFotos", item.id), { order: index })
    })

    try {
      await batch.commit()
      setFeaturedPhotos(newItems.map((item, index) => ({ ...item, order: index })))
      showAlert("Orden actualizado exitosamente")
    } catch (error) {
      console.error("Error actualizando orden:", error)
      showAlert("Error al actualizar el orden", "error")
    }
  }

  const movePhotographerItem = async (itemId: string, direction: "up" | "down") => {
    const currentIndex = photographers.findIndex((p) => p.id === itemId)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= photographers.length) return

    const newItems = [...photographers]
    const [movedItem] = newItems.splice(currentIndex, 1)
    newItems.splice(newIndex, 0, movedItem)

    const batch = writeBatch(db)
    newItems.forEach((item, index) => {
      batch.update(doc(db, "galeriaFotos", item.id), { order: index })
    })

    try {
      await batch.commit()
      setPhotographers(newItems.map((item, index) => ({ ...item, order: index })))
      showAlert("Orden actualizado exitosamente")
    } catch (error) {
      console.error("Error actualizando orden:", error)
      showAlert("Error al actualizar el orden", "error")
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

      {/* Header */}
      <Card className="shadow-md">
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Camera className="h-5 w-5" />
            Gestión de Galería de Fotos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="year-select">Año del evento:</Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number.parseInt(value))}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs - Solo Destacadas y Fotógrafos */}
      <Tabs defaultValue="featured" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="featured" className="flex items-center gap-2" data-value="featured">
            <Camera className="h-4 w-4" />
            Fotos Destacadas
          </TabsTrigger>
          <TabsTrigger value="photographers" className="flex items-center gap-2" data-value="photographers">
            <Users className="h-4 w-4" />
            Fotógrafos {selectedYear}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="space-y-6">
          {/* Formulario de fotos destacadas */}
          <Card className="shadow-md border-t-4 border-t-primary">
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center gap-2 text-primary">
                {editingPhotoId ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {editingPhotoId ? "Editar Foto Destacada" : "Agregar Nueva Foto Destacada"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handlePhotoSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="photo-description">Descripción (opcional)</Label>
                      <Textarea
                        id="photo-description"
                        value={photoFormData.description}
                        onChange={(e) => setPhotoFormData((prev) => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        placeholder="Descripción de la foto..."
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="photo-image">Imagen *</Label>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="photo-image"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-500" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Seleccionar imagen</span>
                            </p>
                            <p className="text-xs text-gray-500">JPG, PNG (Max. 10MB)</p>
                          </div>
                          <Input
                            id="photo-image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {photoFormData.imagePreview && (
                        <div className="relative w-full max-w-xs mx-auto h-40 border rounded overflow-hidden">
                          <NextImage
                            src={photoFormData.imagePreview || "/placeholder.svg"}
                            alt="Vista previa"
                            fill
                            className="object-cover cursor-pointer hover:opacity-80"
                            onClick={() => openImageModal(photoFormData.imagePreview, "Vista previa")}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 right-2 h-6 w-6 rounded-full"
                            onClick={() => setPhotoFormData((prev) => ({ ...prev, image: null, imagePreview: "" }))}
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
                        {editingPhotoId ? "Actualizar" : "Agregar"} Foto
                      </>
                    )}
                  </Button>

                  {editingPhotoId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetPhotoForm}
                      size="lg"
                      className="min-w-[120px]"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Lista de fotos destacadas */}
          <Card className="shadow-md">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="flex items-center justify-between">
                <span>
                  Fotos Destacadas {selectedYear} ({featuredPhotos.length})
                </span>
                <span className="text-sm font-normal text-muted-foreground">Aparecen en la página principal</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {featuredPhotos.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="bg-muted/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Camera className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No hay fotos destacadas aún</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Agrega la primera foto destacada usando el formulario de arriba
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredPhotos.map((photo, index) => (
                    <Card key={photo.id} className="relative group overflow-hidden transition-all hover:shadow-lg">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Imagen */}
                          <div className="relative aspect-square overflow-hidden rounded-lg">
                            <NextImage
                              src={photo.imageUrl || "/placeholder.svg"}
                              alt={photo.description || "Foto del evento"}
                              fill
                              className="object-cover cursor-pointer hover:opacity-80"
                              onClick={() => openImageModal(photo.imageUrl, photo.description || "Foto del evento")}
                            />
                          </div>

                          {/* Descripción */}
                          {photo.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{photo.description}</p>
                          )}

                          {/* Controles */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">#{index + 1}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => movePhotoItem(photo.id, "up")}
                                disabled={index === 0}
                                className="h-6 w-6"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => movePhotoItem(photo.id, "down")}
                                disabled={index === featuredPhotos.length - 1}
                                className="h-6 w-6"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditPhoto(photo)}
                                className="h-6 w-6"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeletePhoto(photo.id)}
                                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photographers" className="space-y-6">
          {/* Formulario de fotógrafos */}
          <Card className="shadow-md border-t-4 border-t-primary">
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center gap-2 text-primary">
                {editingPhotographerId ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {editingPhotographerId ? "Editar Fotógrafo" : "Agregar Nuevo Fotógrafo"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handlePhotographerSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="photographer-name">Nombre del Fotógrafo *</Label>
                      <Input
                        id="photographer-name"
                        value={photographerFormData.name}
                        onChange={(e) => setPhotographerFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Ej: Juan Pérez"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="photographer-link">Enlace a Galería *</Label>
                      <Input
                        id="photographer-link"
                        type="url"
                        value={photographerFormData.link}
                        onChange={(e) => setPhotographerFormData((prev) => ({ ...prev, link: e.target.value }))}
                        placeholder="https://drive.google.com/..."
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="photographer-description">Descripción (opcional)</Label>
                      <Textarea
                        id="photographer-description"
                        value={photographerFormData.description}
                        onChange={(e) => setPhotographerFormData((prev) => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        placeholder="Descripción del fotógrafo o tipo de fotos..."
                      />
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
                        {editingPhotographerId ? "Actualizar" : "Agregar"} Fotógrafo
                      </>
                    )}
                  </Button>

                  {editingPhotographerId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetPhotographerForm}
                      size="lg"
                      className="min-w-[120px]"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Lista de fotógrafos */}
          <Card className="shadow-md">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="flex items-center justify-between">
                <span>
                  Fotógrafos {selectedYear} ({photographers.length})
                </span>
                <span className="text-sm font-normal text-muted-foreground">Aparecen en ambas páginas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {photographers.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="bg-muted/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No hay fotógrafos registrados aún</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Agrega el primer fotógrafo usando el formulario de arriba
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {photographers.map((photographer, index) => (
                    <Card
                      key={photographer.id}
                      className="relative group overflow-hidden transition-all hover:shadow-lg"
                    >
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          {/* Número y controles */}
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                            <div className="flex flex-col gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => movePhotographerItem(photographer.id, "up")}
                                disabled={index === 0}
                                className="h-6 w-6"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => movePhotographerItem(photographer.id, "down")}
                                disabled={index === photographers.length - 1}
                                className="h-6 w-6"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-2">{photographer.name}</h3>
                            {photographer.description && (
                              <p className="text-sm text-muted-foreground mb-2">{photographer.description}</p>
                            )}
                            <a
                              href={photographer.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Ver galería
                            </a>
                            <p className="text-xs text-muted-foreground mt-2">
                              Agregado: {photographer.createdAt.toLocaleDateString()}
                            </p>
                          </div>

                          {/* Acciones */}
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditPhotographer(photographer)}
                              className="hover:bg-primary/10"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePhotographer(photographer.id)}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
