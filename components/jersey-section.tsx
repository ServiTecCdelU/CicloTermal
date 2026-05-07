"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { db } from "@/lib/firebase/firebase-config"
import { doc, getDoc } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"

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
  callToActionTitle: string
  callToActionDescription: string
  features: JerseyFeature[]
}

const defaultJerseyData: JerseyData = {
  title: "Remera Oficial del Evento",
  description:
    "Diseño exclusivo para la Segunda Edición del Cicloturismo Termal de Federación. Confeccionada con materiales de alta calidad, perfecta para ciclistas que buscan comodidad y estilo.",
  imageUrl: "/placeholder.svg?height=600&width=600",
  showSection: true,
  callToActionTitle: "¡Incluida en tu inscripción!",
  callToActionDescription: "Cada participante recibe su remera oficial como parte de los beneficios del evento.",
  features: [
    { id: "1", title: "Material Premium", description: "Tela transpirable y cómoda" },
    { id: "2", title: "Diseño Exclusivo", description: "Solo para participantes" },
    { id: "3", title: "Todos los Talles", description: "S, M, L, XL, XXL" },
    { id: "4", title: "Recuerdo Único", description: "Lleva el evento contigo" },
  ],
}

export default function JerseySection() {
  const { eventSettings, isFirebaseAvailable } = useFirebaseContext()
  const [jerseyData, setJerseyData] = useState(defaultJerseyData)
  const [loading, setLoading] = useState(false) // Cambiar de true a false

  useEffect(() => {
    const fetchJerseyData = async () => {
      // Solo cargar si Firebase está disponible y la sección debe mostrarse
      if (!isFirebaseAvailable) {
        setJerseyData(defaultJerseyData)
        return
      }

      setLoading(true)
      try {
        const currentYear = eventSettings?.currentYear || new Date().getFullYear()
        const jerseyDoc = doc(db, "jersey", "info")
        const docSnap = await getDoc(jerseyDoc)

        if (docSnap.exists()) {
          const data = docSnap.data()
          if (data.year === currentYear) {
            const newData = {
              title: data.title || defaultJerseyData.title,
              description: data.description || defaultJerseyData.description,
              imageUrl: data.imageUrl || defaultJerseyData.imageUrl,
              showSection: data.showSection !== undefined ? data.showSection : defaultJerseyData.showSection,
              callToActionTitle: data.callToActionTitle || defaultJerseyData.callToActionTitle,
              callToActionDescription: data.callToActionDescription || defaultJerseyData.callToActionDescription,
              features: data.features || defaultJerseyData.features,
            }
            setJerseyData(newData)
          }
        }
      } catch (error) {
        console.error("Error fetching jersey data:", error)
        setJerseyData(defaultJerseyData)
      } finally {
        setLoading(false)
      }
    }

    fetchJerseyData()
  }, [eventSettings, isFirebaseAvailable])

  if (!jerseyData.showSection) {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 text-center py-12">
        <div className="flex justify-center items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
          {jerseyData.title}
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Llevá el espíritu del evento contigo</p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Imagen de la remera */}
          <div className="relative w-[240px] h-[240px] md:w-[400px] md:h-[400px] flex-shrink-0 mx-auto md:mx-0">
            <div className="relative bg-white rounded-2xl shadow-xl p-6 md:p-8 transform hover:scale-105 transition-transform duration-300 w-full h-full">
              <div className="relative w-full h-full overflow-hidden rounded-xl">
                <Image
                  src={jerseyData.imageUrl || "/placeholder.svg?height=600&width=600"}
                  alt={jerseyData.title}
                  fill
                  className="object-contain hover:scale-110 transition-transform duration-500"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Contenido descriptivo */}
          <div className="flex-1 space-y-6 md:space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 md:px-4 md:py-2 bg-gradient-to-r from-pink-500/10 via-violet-500/10 to-blue-500/10 rounded-full border border-pink-200">
                <span className="text-xs md:text-sm font-medium bg-gradient-to-r from-pink-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
                  ✨ Edición Limitada
                </span>
              </div>

              <div className="prose max-w-none">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed text-justify">
                  {jerseyData.description}
                </p>
              </div>
            </div>

            {/* Características destacadas - estilo benefits */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {jerseyData.features.map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-start space-x-2 bg-gradient-to-r from-pink-500/5 via-violet-500/5 to-blue-500/5 p-2 md:p-3 rounded-lg shadow-sm border border-pink-200/50"
                >
                  <div className="flex-shrink-0 mx-1">
                    <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">✓</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900 text-xs md:text-sm leading-tight">{feature.title}</h4>
                    <p className="text-xs md:text-sm text-gray-600 leading-tight">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Call to action - sin botón */}
            <div className="p-4 md:p-6 bg-gradient-to-r from-pink-500/5 via-violet-500/5 to-blue-500/5 rounded-2xl border border-pink-200/50">
              <div className="text-center">
                <h3 className="text-lg md:text-xl font-bold mb-2 bg-gradient-to-r from-pink-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
                  {jerseyData.callToActionTitle}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 text-justify">{jerseyData.callToActionDescription}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
