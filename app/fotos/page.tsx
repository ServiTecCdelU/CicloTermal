"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { db } from "@/lib/firebase/firebase-config"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { ExternalLink, ArrowLeft } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

interface PhotoItem {
  id: string
  imageUrl: string
  description: string
  order: number
  year: number
}

interface PhotographerItem {
  id: string
  name: string
  link: string
  description: string
  order: number
  year: number
}

// Datos predeterminados para cuando Firebase no está disponible
const defaultPhotos = [
  {
    id: "photo-1",
    imageUrl: "/foto 1 pc.jpg?height=300&width=300",
    description: "",
    order: 0,
    year: 2024,
  },
  {
    id: "photo-2",
    imageUrl: "/foto 2 pc.jpg?height=300&width=300",
    description: "",
    order: 1,
    year: 2024,
  },
  {
    id: "photo-3",
    imageUrl: "/foto 3 pc.jpg?height=300&width=300",
    description: "",
    order: 2,
    year: 2024,
  },
  {
    id: "photo-4",
    imageUrl: "/foto 4 pc.jpg?height=300&width=300",
    description: "",
    order: 3,
    year: 2024,
  },
  {
    id: "photo-5",
    imageUrl: "/foto 5 pc.jpg?height=300&width=300",
    description: "",
    order: 4,
    year: 2024,
  },
  {
    id: "photo-6",
    imageUrl: "/foto 6 pc.jpg?height=300&width=300",
    description: "",
    order: 5,
    year: 2024,
  },
]

export default function FotosPage() {
  const searchParams = useSearchParams()
  const { eventSettings, isFirebaseAvailable } = useFirebaseContext()
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [photographers, setPhotographers] = useState<PhotographerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [imageModal, setImageModal] = useState<{ show: boolean; src: string; alt: string }>({
    show: false,
    src: "",
    alt: "",
  })
  const [featuredPhotos, setFeaturedPhotos] = useState<PhotoItem[]>([])

  const openImageModal = (src: string, alt: string) => {
    setImageModal({ show: true, src, alt })
  }

  useEffect(() => {
    const yearParam = searchParams.get("year")
    if (yearParam) {
      setSelectedYear(Number.parseInt(yearParam))
    } else if (eventSettings?.currentYear) {
      setSelectedYear(eventSettings.currentYear)
    }
  }, [searchParams, eventSettings])

  useEffect(() => {
    const fetchGalleryData = async () => {
      setLoading(true)

      if (!isFirebaseAvailable) {
        setFeaturedPhotos(defaultPhotos.filter((p) => p.year === selectedYear))
        setPhotographers([])
        setLoading(false)
        return
      }

      try {
        // Cargar fotos destacadas del año seleccionado
        const featuredQuery = query(
          collection(db, "galeriaFotos"),
          where("year", "==", selectedYear),
          where("type", "==", "featured"),
          orderBy("order", "asc"),
        )
        const featuredSnapshot = await getDocs(featuredQuery)
        const featuredData: PhotoItem[] = featuredSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as PhotoItem,
        )

        setFeaturedPhotos(featuredData)

        // Cargar fotógrafos del año seleccionado
        const photographersQuery = query(
          collection(db, "galeriaFotos"),
          where("year", "==", selectedYear),
          where("type", "==", "photographer"),
          orderBy("order", "asc"),
        )
        const photographersSnapshot = await getDocs(photographersQuery)
        const photographersData: PhotographerItem[] = photographersSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as PhotographerItem,
        )

        setPhotographers(photographersData)
      } catch (error) {
        console.error("Error fetching gallery data:", error)
        setFeaturedPhotos(defaultPhotos.filter((p) => p.year === selectedYear))
        setPhotographers([])
      } finally {
        setLoading(false)
      }
    }

    fetchGalleryData()
  }, [selectedYear, isFirebaseAvailable])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
        <Navbar />
        <div className="container mx-auto px-4 text-center py-12">
          <div className="flex justify-center items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-600">Cargando galería...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-16">
        {/* Header con navegación */}
        <div className="space-y-6">
          <Link
            href="/#fotos"
            className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a inicio
          </Link>

          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
              Galería Completa de Fotos
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mx-auto mb-6"></div>

            {/* Selector de año */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-4">
                <label htmlFor="year-select" className="text-lg text-gray-600 font-medium">
                  Año:
                </label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explora todas las fotos destacadas y galerías de fotógrafos de la edición {selectedYear}
            </p>
          </div>
        </div>

        {/* PRIMERO: Fotógrafos */}
        {photographers.length > 0 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-pink-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
                Galería de Fotógrafos {selectedYear}
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explora las galerías completas de nuestros fotógrafos oficiales
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photographers.map((photographer) => (
                <div
                  key={photographer.id}
                  className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
                >
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">{photographer.name}</h3>
                  {photographer.description && <p className="text-gray-600 mb-4 text-sm">{photographer.description}</p>}
                  <a
                    href={photographer.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver Galería Completa
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEGUNDO: Fotos destacadas */}
        {featuredPhotos.length > 0 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-pink-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
                Fotos Destacadas {selectedYear}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredPhotos.map((photo) => (
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
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-sm">{photo.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay contenido */}
        {featuredPhotos.length === 0 && photographers.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg">
              <p className="text-gray-500 text-lg mb-2">No hay fotos disponibles para {selectedYear}</p>
              <p className="text-gray-400 text-sm">
                {isFirebaseAvailable ? "No se encontraron fotos para mostrar" : "Firebase no está disponible"}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Modal de imagen */}
      {imageModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 px-4">
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
              onClick={() => setImageModal({ show: false, src: "", alt: "" })}
            >
              ✕
            </button>
            <Image
              src={imageModal.src || "/placeholder.svg"}
              alt={imageModal.alt}
              width={1000}
              height={800}
              className="object-contain max-w-full max-h-full rounded-lg"
              priority
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
