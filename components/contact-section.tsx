"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { SectionTitle } from "@/components/section-title"
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { useCachedDoc } from "@/lib/use-cached-firestore"

// Tipos TypeScript
interface ContactLink {
  id: string
  title: string
  url: string
  type: "facebook" | "instagram" | "twitter" | "otro"
}

interface ContactData {
  address: string
  phones: string[]
  email?: string
  links: ContactLink[]
  mapUrl: string
  showMap: boolean
}

// Datos predeterminados para cuando Firebase no está disponible
const defaultContactData: ContactData = {
  address: "Federación, Entre Ríos, Argentina",
  phones: ["+54 9 3456 53-0720"],
  email: "",
  links: [],
  mapUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27326.25265830704!2d-57.94760566738281!3d-30.979729799999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95ae33e020a08b21%3A0x6a86cd05ca4d1ac9!2sFederaci%C3%B3n%2C%20Entre%20R%C3%ADos!5e0!3m2!1ses-419!2sar!4v1652364807261!5m2!1ses-419!2sar",
  showMap: true,
}

export default function ContactSection() {
  const { eventSettings, isFirebaseAvailable } = useFirebaseContext()

  const { data: rawDoc, loading } = useCachedDoc(
    "ct_contacto",
    "contacto",
    "info",
    isFirebaseAvailable,
  )

  const contactData = useMemo<ContactData>(() => {
    if (!rawDoc) return defaultContactData
    return {
      address: rawDoc.address || defaultContactData.address,
      phones: Array.isArray(rawDoc.phones) ? rawDoc.phones : defaultContactData.phones,
      email: rawDoc.email || "",
      links: Array.isArray(rawDoc.links) ? rawDoc.links : [],
      mapUrl: rawDoc.mapUrl || defaultContactData.mapUrl,
      showMap: rawDoc.showMap !== undefined ? rawDoc.showMap : defaultContactData.showMap,
    }
  }, [rawDoc])

  if (loading) {
    return (
      <div className="container mx-auto px-4 text-center py-12">
        <div className="flex justify-center items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Cargando información de contacto...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <SectionTitle>Contacto</SectionTitle>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4">¿Tenés alguna pregunta? Contactanos</p>
      </div>

      <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
        <div className="space-y-6">
          {/* Dirección */}
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium">Dirección</h3>
              <p className="text-gray-600">{contactData.address}</p>
            </div>
          </div>

          {/* Teléfonos */}
          {contactData.phones.length > 0 && (
            <div className="flex items-start space-x-3">
              <Phone className="h-5 w-5 text-gray-900 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Teléfono{contactData.phones.length > 1 ? "s" : ""}</h3>
                <div className="space-y-1">
                  {contactData.phones.map((phone, index) => (
                    <p key={index} className="text-gray-600">
                      <Link
                        href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                        className="hover:text-green-500 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {phone}
                      </Link>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Email */}
          {contactData.email && (
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-gray-900 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-gray-600">
                  <Link href={`mailto:${contactData.email}`} className="hover:text-gray-900 transition-colors">
                    {contactData.email}
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Enlaces adicionales */}
          {contactData.links.length > 0 && (
            <div className="pt-4">
              <h3 className="font-medium mb-3">Enlaces</h3>
              <div className="space-y-2">
                {contactData.links.map((link) => (
                  <Link
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{link.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mapa */}
        {contactData.showMap && (
          <div className="h-80 rounded-lg overflow-hidden shadow-sm">
            <iframe
              src={contactData.mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa de ubicación"
            ></iframe>
          </div>
        )}
      </div>
    </div>
  )
}
