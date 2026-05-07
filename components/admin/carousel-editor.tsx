"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase/firebase-config"
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where, orderBy } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { Trash2, Plus, ArrowUp, ArrowDown, Loader2 } from "lucide-react"

export default function CarouselEditor() {
  const { toast } = useToast()
  const { eventSettings } = useFirebaseContext()
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchCarouselImages = async () => {
      try {
        const carouselRef = collection(db, "carousel")
        const currentYearCarousel = query(
          carouselRef,
          where("year", "==", eventSettings?.currentYear || new Date().getFullYear()),
          orderBy("order", "asc"),
        )
        const snapshot = await getDocs(currentYearCarousel)

        const slidesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setSlides(slidesData)
      } catch (error) {
        console.error("Error fetching carousel images:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCarouselImages()
  }, [eventSettings])

  const handleAddSlide = () => {
    setSlides([
      ...slides,
      {
        id: `temp-${Date.now()}`,
        imageUrl: "/placeholder.svg?height=600&width=1200",
        title: "Nuevo slide",
        subtitle: "Descripción del slide",
        buttonText: "Inscribirme",
        buttonUrl: "/inscripcion",
        order: slides.length,
        year: eventSettings?.currentYear || new Date().getFullYear(),
        isNew: true,
        file: null,
      },
    ])
  }

  const handleRemoveSlide = async (index, slide) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este slide?")) {
      return
    }

    try {
      if (!slide.isNew && slide.id) {
        // Delete from Firestore
        await deleteDoc(doc(db, "carousel", slide.id))

        // Delete image from Storage if it's not a placeholder
        if (slide.imageUrl && !slide.imageUrl.includes("placeholder.svg")) {
          const imageRef = ref(storage, slide.imageUrl)
          await deleteObject(imageRef).catch((err) => console.log("Image might not exist:", err))
        }
      }

      const newSlides = [...slides]
      newSlides.splice(index, 1)

      // Update order for remaining slides
      const updatedSlides = newSlides.map((s, i) => ({
        ...s,
        order: i,
      }))

      setSlides(updatedSlides)

      toast({
        title: "Slide eliminado",
        description: "El slide ha sido eliminado correctamente",
      })
    } catch (error) {
      console.error("Error removing slide:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el slide",
        variant: "destructive",
      })
    }
  }

  const handleMoveSlide = (index, direction) => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === slides.length - 1)) {
      return
    }

    const newSlides = [...slides]
    const newIndex = direction === "up" ? index - 1 : index + 1

    // Swap slides
    const temp = newSlides[index]
    newSlides[index] = newSlides[newIndex]
    newSlides[newIndex] = temp

    // Update order
    const updatedSlides = newSlides.map((slide, i) => ({
      ...slide,
      order: i,
    }))

    setSlides(updatedSlides)
  }

  const handleInputChange = (index, field, value) => {
    const newSlides = [...slides]
    newSlides[index] = {
      ...newSlides[index],
      [field]: value,
    }
    setSlides(newSlides)
  }

  const handleFileChange = (index, e) => {
    const file = e.target.files[0]
    if (!file) return

    const newSlides = [...slides]
    newSlides[index] = {
      ...newSlides[index],
      file,
      // Create a temporary URL for preview
      imageUrl: URL.createObjectURL(file),
    }
    setSlides(newSlides)
  }

  const saveChanges = async () => {
    setSaving(true)
    try {
      for (const slide of slides) {
        // If there's a new file, upload it first
        let imageUrl = slide.imageUrl
        if (slide.file) {
          const storageRef = ref(storage, `carousel/${Date.now()}_${slide.file.name}`)
          await uploadBytes(storageRef, slide.file)
          imageUrl = await getDownloadURL(storageRef)
        }

        const slideData = {
          imageUrl,
          title: slide.title,
          subtitle: slide.subtitle,
          buttonText: slide.buttonText,
          buttonUrl: slide.buttonUrl,
          order: slide.order,
          year: eventSettings?.currentYear || new Date().getFullYear(),
        }

        if (slide.isNew) {
          // Add new slide
          await addDoc(collection(db, "carousel"), slideData)
        } else {
          // Update existing slide
          await updateDoc(doc(db, "carousel", slide.id), slideData)
        }
      }

      toast({
        title: "Cambios guardados",
        description: "Los cambios han sido guardados correctamente",
      })

      // Refresh slides
      const carouselRef = collection(db, "carousel")
      const currentYearCarousel = query(
        carouselRef,
        where("year", "==", eventSettings?.currentYear || new Date().getFullYear()),
        orderBy("order", "asc"),
      )
      const snapshot = await getDocs(currentYearCarousel)

      const slidesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setSlides(slidesData)
    } catch (error) {
      console.error("Error saving changes:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      })
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Slides del carrusel</h3>
        <Button onClick={handleAddSlide} className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          Agregar slide
        </Button>
      </div>

      {slides.length === 0 ? (
        <div className="text-center py-8 bg-muted rounded-lg">
          <p className="text-muted-foreground">No hay slides en el carrusel</p>
          <Button onClick={handleAddSlide} variant="outline" className="mt-4">
            Agregar primer slide
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {slides.map((slide, index) => (
            <div key={slide.id || index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Slide {index + 1}</h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveSlide(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveSlide(index, "down")}
                    disabled={index === slides.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSlide(index, slide)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="relative aspect-video overflow-hidden rounded-md mb-2">
                    <Image
                      src={slide.imageUrl || "/placeholder.svg?height=600&width=1200"}
                      alt={slide.title || "Slide preview"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`image-${index}`}>Imagen</Label>
                    <Input
                      id={`image-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(index, e)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`title-${index}`}>Título</Label>
                    <Input
                      id={`title-${index}`}
                      value={slide.title || ""}
                      onChange={(e) => handleInputChange(index, "title", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`subtitle-${index}`}>Subtítulo</Label>
                    <Input
                      id={`subtitle-${index}`}
                      value={slide.subtitle || ""}
                      onChange={(e) => handleInputChange(index, "subtitle", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`buttonText-${index}`}>Texto del botón</Label>
                    <Input
                      id={`buttonText-${index}`}
                      value={slide.buttonText || ""}
                      onChange={(e) => handleInputChange(index, "buttonText", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`buttonUrl-${index}`}>URL del botón</Label>
                    <Input
                      id={`buttonUrl-${index}`}
                      value={slide.buttonUrl || ""}
                      onChange={(e) => handleInputChange(index, "buttonUrl", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={saveChanges} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </div>
  )
}
