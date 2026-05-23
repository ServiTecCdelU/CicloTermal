"use client"

import { useState, useEffect, useMemo } from "react"
import { SectionTitle } from "@/components/section-title"
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
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import Contador from "@/components/Contador"
import { useCachedCollection, useCachedDoc } from "@/lib/use-cached-firestore"
import { Moon, Sunrise, MapPin as MapPinIcon, Clock as ClockIcon, Route as RouteIcon } from "lucide-react"

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

function formatFechaDia(fechaEvento?: string) {
  if (!fechaEvento) return "11 de octubre"
  const [y, m, d] = fechaEvento.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "numeric", month: "long" })
}

// Datos predeterminados
const defaultEventData: EventItem[] = [
  { id: "1", label: "Fecha", value: "11 de octubre", iconName: "Calendar", order: 0 },
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

interface ItineraryDay {
  day: string
  title: string
  time: string
  subtitle: string
  content: string
  year: number
}

export default function BenefitsSection() {
  const { eventSettings, isFirebaseAvailable } = useFirebaseContext()
  const currentYear = eventSettings?.currentYear || new Date().getFullYear()

  const { data: rawEventData, loading: loadingEvent } = useCachedCollection(
    `ct_benefits_event_${currentYear}`,
    "benefits",
    (q) => q.eq("type", "event").eq("year", currentYear).order("order", { ascending: true }),
    isFirebaseAvailable,
  )

  const { data: rawBenefits, loading: loadingBenefits } = useCachedCollection(
    `ct_benefits_benefit_${currentYear}`,
    "benefits",
    (q) => q.eq("type", "benefit").eq("year", currentYear).order("order", { ascending: true }),
    isFirebaseAvailable,
  )

  const { data: sabadoData } = useCachedDoc(
    `ct_itinerario_sabado_${currentYear}`,
    "itinerario",
    `${currentYear}_sabado`,
    isFirebaseAvailable,
  )

  const { data: domingoData } = useCachedDoc(
    `ct_itinerario_domingo_${currentYear}`,
    "itinerario",
    `${currentYear}_domingo`,
    isFirebaseAvailable,
  )

  const sabado = sabadoData as ItineraryDay | null
  const domingo = domingoData as ItineraryDay | null
  const hasItinerary = !!(sabado?.content || domingo?.content)

  const loading = loadingEvent || loadingBenefits

  const eventData = useMemo<EventItem[]>(() =>
    rawEventData.length > 0
      ? rawEventData as EventItem[]
      : defaultEventData.map((i) =>
          i.label === "Fecha" ? { ...i, value: formatFechaDia(eventSettings?.fechaEvento) } : i
        ),
  [rawEventData, eventSettings?.fechaEvento])

  const benefits = useMemo<BenefitItem[]>(() =>
    rawBenefits.length > 0 ? rawBenefits as BenefitItem[] : defaultBenefits,
  [rawBenefits])

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Cargando información del evento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 space-y-16">
      {/* Contador */}
      <Contador />

      {/* Sección Itinerario */}
      {hasItinerary && (
        <div>
          <div className="text-center mb-12">
            <SectionTitle>Itinerario</SectionTitle>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4">Programa de actividades</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {[sabado, domingo].filter(Boolean).map((day) => {
              if (!day?.content) return null
              const isSabado = day.day === "sabado"
              const lines = day.content.split("\n").map((l) => l.trim()).filter((l) => l.length > 0)
              return (
                <div
                  key={day.day}
                  className="rounded-2xl shadow-xl overflow-hidden border border-gray-100"
                >
                  {/* Day header */}
                  <div className={`px-6 py-5 ${isSabado ? "bg-gradient-to-br from-indigo-900 via-violet-800 to-purple-700" : "bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400"}`}>
                    <div className="flex items-center gap-4 text-white">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isSabado ? "bg-white/15" : "bg-white/20"}`}>
                        {isSabado ? <Moon className="h-6 w-6" /> : <Sunrise className="h-6 w-6" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl leading-tight">
                          {day.title}{day.time ? ` | ${day.time}` : ""}
                        </h3>
                        {day.subtitle && (
                          <p className="text-sm opacity-90 font-semibold mt-0.5">{day.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Content items */}
                  <div className="bg-white p-3 md:p-4">
                    <div className="space-y-1.5">
                      {lines.map((line, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                            isSabado
                              ? "bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-100/60"
                              : "bg-amber-50/60 hover:bg-amber-50 border border-amber-100/60"
                          }`}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                            isSabado ? "bg-indigo-400" : "bg-amber-400"
                          }`} />
                          <span className="text-gray-700 leading-snug">{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sección Datos del Evento */}
      <div>
        <div className="text-center mb-12">
          <SectionTitle>Evento</SectionTitle>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4">Información importante</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 max-w-6xl mx-auto">
          {eventData.map((item) => (
            <div
              key={item.id}
              className="bg-white p-3 md:p-6 rounded-lg md:rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center space-x-2 md:space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 md:h-12 md:w-12 rounded-full bg-gray-900 flex items-center justify-center">
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
          <SectionTitle>Beneficios de la Inscripción</SectionTitle>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4">Incluye:</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit) => (
            <div
              key={benefit.id}
              className="bg-white p-3 md:p-6 rounded-lg md:rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center space-x-2 md:space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 md:h-12 md:w-12 rounded-full bg-gray-900 flex items-center justify-center">
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
      </div>
    </div>
  )
}
