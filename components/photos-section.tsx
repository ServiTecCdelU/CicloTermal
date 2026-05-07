"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { db } from "../lib/firebase/firebase-config"
import { collection, getDocs, query, where } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PhotoItem {
  id: string
  imageUrl: string
  description: string
  order: number
  year: number
}

export default function PhotosSection() {
  const { isFirebaseAvailable } = useFirebaseContext()
  const [allFeaturedPhotos, setAllFeaturedPhotos] = useState<PhotoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [imageModal, setImageModal] = useState<{ show: boolean; src: string; alt: string }>({
    show: false,
    src: "",
    alt: "",
  })

  const photosPerPage = 4 // Cambié a 4 fotos por página
  const totalPages = Math.ceil(allFeaturedPhotos.length / photosPerPage)
  const currentPhotos = allFeaturedPhotos.slice(currentPage * photosPerPage, (currentPage + 1) * photosPerPage)

  const openImageModal = (src: string, alt: string) => {
    setImageModal({ show: true, src, alt })
  }

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  useEffect(() => {
    const fetchFeaturedPhotos = async () => {
      setLoading(true)

      if (!isFirebaseAvailable) {
        console.log("Firebase no disponible")
        setAllFeaturedPhotos([])
        setLoading(false)
        return
      }

      try {
        // Cargar TODAS las fotos destacadas sin filtro de año
        const featuredQuery = query(collection(db, "galeriaFotos"), where("type", "==", "featured"))
        const featuredSnapshot = await getDocs(featuredQuery)
        const featuredData: PhotoItem[] = featuredSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as PhotoItem,
        )

        // Ordenar por año descendente y luego por orden
        const sortedPhotos = featuredData.sort((a, b) => {
          if (a.year !== b.year) {
            return b.year - a.year // Año descendente (más reciente primero)
          }
          return a.order - b.order // Orden ascendente dentro del mismo año
        })

        console.log("Fotos destacadas de todos los años encontradas:", sortedPhotos.length, sortedPhotos)
        setAllFeaturedPhotos(sortedPhotos)
      } catch (error) {
        console.error("Error fetching featured photos:", error)
        setAllFeaturedPhotos([])
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedPhotos()
  }, [isFirebaseAvailable])

  if (loading) {
    return (
      <div className="container mx-auto px-4 text-center py-12">
        <div className="flex justify-center items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Cargando galería...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 space-y-16">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
          Fotos Destacadas
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mx-auto mb-8"></div>
      </div>

      {/* Fotos destacadas con paginación */}
      {allFeaturedPhotos.length > 0 ? (
        <div className="space-y-8">
          {/* Grid responsive: 4 columnas en desktop, 2 columnas en móvil */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {currentPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative group overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity bg-white shadow-lg"
                onClick={() => openImageModal(photo.imageUrl, photo.description || "Foto del evento")}
              >
                <div className="aspect-square relative">
                  <Image
                    src={photo.imageUrl || "/placeholder.svg"}
                    alt={photo.description || "Foto del evento"}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                {photo.description && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-sm">{photo.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Controles de paginación - Solo si hay más de 4 fotos */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={currentPage === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i)}
                    className="w-8 h-8 p-0"
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={currentPage === totalPages - 1}
                className="flex items-center gap-2"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Mensaje cuando no hay contenido */
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
            <p className="text-gray-500 text-lg mb-2">No hay fotos destacadas disponibles</p>
            <p className="text-gray-400 text-sm">
              {isFirebaseAvailable
                ? "Agrega fotos destacadas desde el panel de administración"
                : "Firebase no está disponible"}
            </p>
          </div>
        </div>
      )}

      {/* Enlace a página completa de fotos */}
      <div className="text-center">
        <Link href="/fotos">
          <Button variant="outline" className="border-pink-500 text-pink-700 hover:bg-pink-50">
            Ver todas las fotos
          </Button>
        </Link>
      </div>

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
            <Image
              src={imageModal.src || "/placeholder.svg"}
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
