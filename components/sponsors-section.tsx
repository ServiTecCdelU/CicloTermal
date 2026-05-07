"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { db } from "../lib/firebase/firebase-config"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"

// Tipos TypeScript
interface Sponsor {
  id: string
  name: string
  logoUrl: string
  url: string
  year?: number
  order?: number
}

interface SponsorFirestoreData {
  name?: string
  year?: number
  website?: string
  url?: string
  imageBase64?: string
  image?: string
  logo?: string
  logoUrl?: string
  order?: number
}

interface FirebaseContextType {
  eventSettings?: {
    currentYear?: number
  }
  isFirebaseAvailable: boolean
}

type ImageProcessingResult = string

export default function SponsorsSection(): JSX.Element {
  const { eventSettings, isFirebaseAvailable }: FirebaseContextType = useFirebaseContext()
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState<boolean>(false) // Cambiar de true a false
  const [error, setError] = useState<string | null>(null)

  // Función tipada para convertir base64 a Data URL
  const processImageData = (imageData: unknown, sponsorName: string): ImageProcessingResult => {
    if (!imageData || typeof imageData !== "string") {
      return "/placeholder.svg"
    }

    try {
      // Si ya es una URL completa (http/https), usarla directamente
      if (imageData.startsWith("http://") || imageData.startsWith("https://")) {
        return imageData
      }

      // Si ya es una Data URL completa, usarla directamente
      if (imageData.startsWith("data:image/")) {
        return imageData
      }

      // Si es base64 puro, agregar el prefijo
      if (imageData.length > 0) {
        // Limpiar espacios y saltos de línea
        const cleanBase64: string = imageData.replace(/\s/g, "")

        // Validar que sea base64 válido
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
          return "/placeholder.svg"
        }

        // Detectar tipo de imagen por los primeros caracteres del base64
        let mimeType = "image/jpeg" // Por defecto

        try {
          const binaryString: string = atob(cleanBase64.substring(0, 20))
          const bytes: Uint8Array = new Uint8Array(binaryString.length)

          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }

          // PNG signature: 89 50 4E 47
          if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
            mimeType = "image/png"
          }
          // JPEG signature: FF D8 FF
          else if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
            mimeType = "image/jpeg"
          }
          // GIF signature: 47 49 46 38
          else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
            mimeType = "image/gif"
          }
        } catch (detectionError: unknown) {
          // Error detectando tipo, usar JPEG por defecto
        }

        const dataUrl: string = `data:${mimeType};base64,${cleanBase64}`
        return dataUrl
      }

      return "/placeholder.svg"
    } catch (error: unknown) {
      return "/placeholder.svg"
    }
  }

  useEffect(() => {
    const fetchSponsors = async (): Promise<void> => {
      if (!isFirebaseAvailable) {
        setSponsors([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const currentYear: number = eventSettings?.currentYear || new Date().getFullYear()

        // Optimizar consulta directa
        const sponsorsQuery = query(collection(db, "sponsors"), orderBy("order", "asc"))
        const snapshot = await getDocs(sponsorsQuery)

        if (!snapshot.empty) {
          const sponsorsData: Sponsor[] = []

          snapshot.docs.forEach((doc) => {
            const data: SponsorFirestoreData = doc.data() as SponsorFirestoreData

            // Filtrar por año en el cliente si es necesario
            if (!data.year || data.year === currentYear) {
              const sponsorName: string = data.name || `Sponsor ${doc.id}`
              const imageData: unknown = data.imageBase64 || data.image || data.logo || data.logoUrl
              const logoUrl: string = processImageData(imageData, sponsorName)

              const sponsor: Sponsor = {
                id: doc.id,
                name: sponsorName,
                logoUrl: logoUrl,
                url: data.website || data.url || "#",
                year: data.year,
                order: typeof data.order === "number" ? data.order : 999,
              }

              sponsorsData.push(sponsor)
            }
          })

          // Ordenar por order
          sponsorsData.sort((a: Sponsor, b: Sponsor) => {
            const orderA = typeof a.order === "number" ? a.order : 999
            const orderB = typeof b.order === "number" ? b.order : 999
            return orderA - orderB
          })

          setSponsors(sponsorsData)
        } else {
          setSponsors([])
        }
      } catch (error: unknown) {
        const errorMessage: string = error instanceof Error ? error.message : "Error desconocido"
        setError(`Error al cargar sponsors: ${errorMessage}`)
        setSponsors([])
      } finally {
        setLoading(false)
      }
    }

    fetchSponsors()
  }, [eventSettings, isFirebaseAvailable])

  // Handlers tipados para eventos de imagen
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, sponsorName: string): void => {
    const target = e.target as HTMLImageElement
    target.src = "/placeholder.svg"
  }

  const handleImageLoad = (sponsorName: string): void => {
    // Imagen cargada exitosamente
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 text-center py-12">
        <div className="flex justify-center items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Cargando sponsors...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600 font-medium">Error al cargar sponsors</p>
          <p className="text-red-500 text-sm mt-2">{error}</p>
          <p className="text-gray-500 text-xs mt-2">Revisa la consola del navegador para más detalles</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
          Nuestros Sponsors
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Empresas que hacen posible este evento</p>
      </div>

      {/* Sponsors Grid */}
      {sponsors.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
            <p className="text-gray-500 text-lg mb-2">No hay sponsors disponibles</p>
            <p className="text-gray-400 text-sm">
              {isFirebaseAvailable ? "No se encontraron sponsors para el año actual" : "Firebase no está disponible"}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
            {sponsors.map((sponsor: Sponsor) => (
              <Link
                key={sponsor.id}
                href={sponsor.url === "#" ? "#" : sponsor.url}
                target={sponsor.url === "#" ? "_self" : "_blank"}
                rel={sponsor.url === "#" ? undefined : "noopener noreferrer"}
                className="flex flex-col items-center group transition-all duration-300"
              >
                <div className="relative aspect-square w-full bg-white rounded-lg overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-105 border border-gray-100">
                  <img
                    src={sponsor.logoUrl || "/placeholder.svg"}
                    alt={`Logo de ${sponsor.name}`}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => handleImageError(e, sponsor.name)}
                    onLoad={() => handleImageLoad(sponsor.name)}
                  />
                </div>
                <p className="text-sm font-medium text-center mt-3 text-gray-700 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                  {sponsor.name}
                </p>
              </Link>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <p className="text-lg text-gray-700 font-medium mb-2">¿Querés ser parte de nuestros sponsors?</p>
            <p className="text-base text-gray-600">
              Contactate con nosotros para conocer las oportunidades de patrocinio
            </p>
          </div>
        </>
      )}
    </div>
  )
}
