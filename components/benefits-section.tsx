"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  MapPin,
  Clock,
  Route,
  Navigation,
  TrendingUp,
  Users,
  DollarSign,
  Shirt,
  Package,
  Coffee,
  Apple,
  Shield,
  Heart,
  Wrench,
  Truck,
} from "lucide-react"
import { db } from "@/lib/firebase/firebase-config"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import Contador from "@/components/Contador"

// Tipos TypeScript
interface EventItem {
  id: string
  label: string
  value: string
  iconName: string
  order: number
}

interface BenefitItem {
  id: string
  text: string
  iconName: string
  iconType: "lucide" | "image"
  iconUrl?: string
  order: number
}

// Mapeo de iconos de Lucide
const iconMap = {
  Calendar,
  MapPin,
  Clock,
  Route,
  Navigation,
  TrendingUp,
  Users,
  DollarSign,
  Shirt,
  Package,
  Coffee,
  Apple,
  Shield,
  Heart,
  Wrench,
  Truck,
}

// Datos predeterminados
const defaultEventData: EventItem[] = [
  { id: "1", label: "Fecha", value: "12 de Octubre", iconName: "Calendar", order: 0 },
  { id: "2", label: "Distancia", value: "50 KM caminos rurales", iconName: "Route", order: 1 },
  { id: "3", label: "Ubicación", value: "Federación, Entre Ríos, Argentina", iconName: "MapPin", order: 2 },
  { id: "4", label: "Nivel", value: "Intermedio - Avanzado", iconName: "TrendingUp", order: 3 },
  { id: "5", label: "Edad Mínima", value: "18 años", iconName: "Users", order: 4 },
  { id: "6", label: "Precio", value: "$35.000", iconName: "DollarSign", order: 5 },
  { id: "7", label: "Acreditación", value: "7:30 hs", iconName: "Clock", order: 6 },
  { id: "8", label: "Hora de Salida", value: "8:30 hs", iconName: "Clock", order: 7 },
  { id: "9", label: "Lugar de encuentro", value: "Frente a la Terminal de Ómnibus de Federación", iconName: "Navigation", order: 8 },
  { id: "10", label: "Lugar de llegada", value: "Frente a la Terminal de Ómnibus de Federación", iconName: "Navigation", order: 9 },
]

const defaultBenefits: BenefitItem[] = [
  { id: "1", text: "Jersey oficial del evento", iconName: "Shirt", iconType: "lucide", order: 0 },
  { id: "2", text: "Buff y bolsita kit", iconName: "Package", iconType: "lucide", order: 1 },
  { id: "3", text: "Desayuno antes de la partida", iconName: "Coffee", iconType: "lucide", order: 2 },
  { id: "4", text: "Frutas y agua en paradas", iconName: "Apple", iconType: "lucide", order: 3 },
  { id: "5", text: "Seguro de accidentes", iconName: "Shield", iconType: "lucide", order: 4 },
  { id: "6", text: "Asistencia médica", iconName: "Heart", iconType: "lucide", order: 5 },
  { id: "7", text: "Asistencia técnica", iconName: "Wrench", iconType: "lucide", order: 6 },
  { id: "8", text: "Vehículo de apoyo", iconName: "Truck", iconType: "lucide", order: 7 },
]

export default function BenefitsSection() {
  const { eventSettings, isFirebaseAvailable } = useFirebaseContext()
  const [eventData, setEventData] = useState<EventItem[]>(defaultEventData)
  const [benefits, setBenefits] = useState<BenefitItem[]>(defaultBenefits)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!isFirebaseAvailable) {
        setEventData(defaultEventData)
        setBenefits(defaultBenefits)
        setLoading(false)
        return
      }

      try {
        const currentYear = eventSettings?.currentYear || new Date().getFullYear()

        // Fetch event data
        const eventQuery = query(
          collection(db, "benefits"),
          where("type", "==", "event"),
          where("year", "==", currentYear),
          orderBy("order", "asc"),
        )
        const eventSnapshot = await getDocs(eventQuery)

        if (!eventSnapshot.empty) {
          const eventItems = eventSnapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as EventItem,
          )
          setEventData(eventItems)
        }

        // Fetch benefits data
        const benefitsQuery = query(
          collection(db, "benefits"),
          where("type", "==", "benefit"),
          where("year", "==", currentYear),
          orderBy("order", "asc"),
        )
        const benefitsSnapshot = await getDocs(benefitsQuery)

        if (!benefitsSnapshot.empty) {
          const benefitItems = benefitsSnapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as BenefitItem,
          )
          setBenefits(benefitItems)
        }
      } catch (error) {
        console.error("Error fetching benefits data:", error)
        setEventData(defaultEventData)
        setBenefits(defaultBenefits)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [eventSettings, isFirebaseAvailable])

  const getIcon = (iconName: string, iconType: "lucide" | "image" = "lucide", iconUrl?: string) => {
    if (iconType === "image" && iconUrl) {
      return <img src={iconUrl || "/placeholder.svg"} alt="Icon" className="h-4 w-4 md:h-6 md:w-6 object-contain" />
    }

    const IconComponent = iconMap[iconName as keyof typeof iconMap]
    return IconComponent ? <IconComponent className="h-4 w-4 md:h-6 md:w-6 text-white" /> : null
  }

  const getBenefitIcon = (iconName: string, iconType: "lucide" | "image" = "lucide", iconUrl?: string) => {
    if (iconType === "image" && iconUrl) {
      return <img src={iconUrl || "/placeholder.svg"} alt="Icon" className="h-4 w-4 md:h-6 md:w-6 object-contain" />
    }

    const IconComponent = iconMap[iconName as keyof typeof iconMap]
    return IconComponent ? <IconComponent className="h-4 w-4 md:h-6 md:w-6 text-white" /> : null
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 text-center py-12">
        <div className="flex justify-center items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          <p className="text-gray-600">Cargando información del evento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 space-y-16">
      {/* Contador */}
      <Contador />

      {/* Sección Datos del Evento */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
            Evento
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Información importante</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 max-w-6xl mx-auto">
          {eventData.map((item) => (
            <div
              key={item.id}
              className="bg-white p-3 md:p-6 rounded-lg md:rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center space-x-2 md:space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 md:h-12 md:w-12 rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 flex items-center justify-center">
                    {getIcon(item.iconName)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">{item.label}</h3>
                  <p className="text-sm md:text-lg font-semibold text-gray-900 mt-1 leading-tight">{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sección Beneficios de la Inscripción */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
            Beneficios de la Inscripción
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Incluye:</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit) => (
            <div
              key={benefit.id}
              className="bg-white p-3 md:p-6 rounded-lg md:rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center space-x-2 md:space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 md:h-12 md:w-12 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center">
                    {getBenefitIcon(benefit.iconName, benefit.iconType, benefit.iconUrl)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-lg font-semibold text-gray-900 leading-tight">{benefit.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Caja roja con opacidad */}
        <div className="max-w-6xl mx-auto mt-6">
          <div className="bg-red-50 border border-red-300 text-red-800 text-center py-3 px-4 rounded-md font-semibold">
            El cupo de los Jerseys oficiales del evento son de 200. Una vez pasado ese numero ya no se incluye el Jersey en las inscripciones.
          </div>
        </div>
      </div>
    </div>
  )
}
