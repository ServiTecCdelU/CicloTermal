"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { SectionTitle } from "@/components/section-title"
import { supabase } from "@/lib/supabase/client"

interface BikeFriendly {
  id: string
  name: string
  website: string
  image_base64: string
  order: number
}

export default function BikeFriendlySection() {
  const [alojamientos, setAlojamientos] = useState<BikeFriendly[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("bike_friendly")
      .select("*")
      .order("order", { ascending: true })
      .then(({ data }) => {
        setAlojamientos((data || []) as BikeFriendly[])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 text-center py-12">
        <div className="flex justify-center items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Cargando alojamientos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <SectionTitle>Alojamientos BikeFriendly</SectionTitle>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4">
          Alojamientos recomendados para ciclistas en Federación
        </p>
      </div>

      {alojamientos.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
            <p className="text-gray-500 text-lg">No hay alojamientos disponibles</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {alojamientos.map((a) => (
            <Link
              key={a.id}
              href={a.website || "#"}
              target={a.website ? "_blank" : "_self"}
              rel={a.website ? "noopener noreferrer" : undefined}
              className="flex flex-col items-center group transition-all duration-300"
            >
              <div className="relative aspect-square w-full bg-white rounded-lg overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-105 border border-gray-100">
                <img
                  src={a.image_base64 || "/placeholder.svg"}
                  alt={`Logo de ${a.name}`}
                  className="w-full h-full object-contain p-4"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                  }}
                />
              </div>
              <p className="text-sm font-medium text-center mt-3 text-gray-700 group-hover:text-red-600 transition-colors duration-300 line-clamp-2">
                {a.name}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
