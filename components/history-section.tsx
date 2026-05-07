"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { db } from "../lib/firebase/firebase-config"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"

interface HistoryItem {
  id: string
  title: string
  description: string
  imageUrl: string
  logoUrl: string
  contactLink: string
  order: number
  year: number
}

function SectionHeader({ logoUrl, title }: { logoUrl: string; title: string }) {
  return (
    <div className="flex flex-col items-center text-center mb-8">
      <div className="relative w-[60px] h-[60px] mb-2">
        <Image src={logoUrl || "/placeholder.svg"} alt={`Logo ${title}`} fill className="object-contain" priority />
      </div>
      <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
        {title}
      </h2>
      <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mt-2" />
    </div>
  )
}

function CollapsibleText({ html, imageUrl, contactLink }: { html: string; imageUrl: string; contactLink?: string }) {
  const [showModal, setShowModal] = useState(false)
  const [shouldTruncate, setShouldTruncate] = useState(false)
  const [processedContent, setProcessedContent] = useState({
    previewHtml: html,
    fullHtml: html,
    hasMore: false,
  })

  const calculateMaxChars = (width: number) => {
    if (width > 1100) return 1300
    if (width > 990) return 900
    if (width > 800) return 600
    if (width > 700) return 500
    return 250
  }

  const processHtml = (htmlContent: string, maxChars: number) => {
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = htmlContent
    const plainText = tempDiv.textContent || tempDiv.innerText || ""

    if (plainText.length > maxChars) {
      let truncatedText = plainText.substring(0, maxChars)
      const lastSpace = truncatedText.lastIndexOf(" ")
      if (lastSpace > 0) truncatedText = truncatedText.substring(0, lastSpace)
      truncatedText += "..."
      return {
        previewHtml: `<p style="text-align: justify;">${truncatedText}</p>`,
        hasMore: true,
      }
    }
    return {
      previewHtml: htmlContent,
      hasMore: false,
    }
  }

  useEffect(() => {
    const handleResize = () => {
      const maxChars = calculateMaxChars(window.innerWidth)
      const { previewHtml, hasMore } = processHtml(html, maxChars)

      // Agregar enlace de contacto si existe
      let finalHtml = previewHtml
      if (contactLink && !hasMore) {
        finalHtml =
          html +
          `<p><strong>Quiero ser parte:</strong> <a href="${contactLink}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">Contacto</a></p>`
      }

      setProcessedContent({
        previewHtml: finalHtml,
        fullHtml:
          html +
          (contactLink
            ? `<p><strong>Quiero ser parte:</strong> <a href="${contactLink}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">Contacto</a></p>`
            : ""),
        hasMore,
      })
      setShouldTruncate(hasMore)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [html, contactLink])

  return (
    <div className="prose max-w-none flex-1 relative text-sm sm:text-base">
      <div>
        {shouldTruncate ? (
          <>
            <div style={{ textAlign: "justify" }} dangerouslySetInnerHTML={{ __html: processedContent.previewHtml }} />
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 text-blue-600 font-medium hover:underline focus:outline-none"
            >
              Leer más
            </button>
          </>
        ) : (
          <div style={{ textAlign: "justify" }} dangerouslySetInnerHTML={{ __html: processedContent.previewHtml }} />
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4">
          <div className="bg-gradient-to-r from-pink-100 via-violet-100 to-blue-100 mt-2 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>
            <div className="p-4 sm:p-6 text-justify max-w-prose mx-auto text-sm sm:text-base">
              <div dangerouslySetInnerHTML={{ __html: processedContent.fullHtml }} />
              <button onClick={() => setShowModal(false)} className="mt-4 text-blue-600 font-medium hover:underline">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HistorySection() {
  const { eventSettings, isFirebaseAvailable } = useFirebaseContext()
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [imageModal, setImageModal] = useState<{ show: boolean; src: string; alt: string }>({
    show: false,
    src: "",
    alt: "",
  })

  const openImageModal = (src: string, alt: string) => {
    setImageModal({ show: true, src, alt })
  }

  useEffect(() => {
    const fetchHistoryData = async () => {
      if (!isFirebaseAvailable) {
        setHistoryItems([])
        return
      }

      setLoading(true)
      try {
        const currentYear = eventSettings?.currentYear || new Date().getFullYear()
        // Optimizar consulta
        const historyQuery = query(collection(db, "historia"), orderBy("order", "asc"))
        const querySnapshot = await getDocs(historyQuery)

        const historyData: HistoryItem[] = []
        querySnapshot.docs.forEach((doc) => {
          const data = doc.data()
          if (!data.year || data.year === currentYear) {
            historyData.push({
              id: doc.id,
              ...data,
            } as HistoryItem)
          }
        })

        setHistoryItems(historyData)
      } catch (error) {
        console.error("Error fetching history data:", error)
        setHistoryItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchHistoryData()
  }, [eventSettings, isFirebaseAvailable])

  if (loading) {
    return (
      <div className="container mx-auto px-4 text-center py-12">
        <div className="flex justify-center items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Cargando historia...</p>
        </div>
      </div>
    )
  }

  if (historyItems.length === 0) {
    return (
      <div className="container mx-auto px-4 text-center py-12">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
          <p className="text-gray-500 text-lg mb-2">No hay historias disponibles</p>
          <p className="text-gray-400 text-sm">
            {isFirebaseAvailable ? "No se encontraron historias para mostrar" : "Firebase no está disponible"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 space-y-24">
      {historyItems.map((item) => (
        <div key={item.id}>
          <SectionHeader logoUrl={item.logoUrl} title={item.title} />
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div
              className="relative w-[280px] h-[280px] flex-shrink-0 mx-auto md:mx-0 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => openImageModal(item.imageUrl, item.title)}
            >
              <Image
                src={item.imageUrl || "/placeholder.svg"}
                alt={item.title}
                fill
                className="object-cover rounded-3xl shadow-2xl"
                priority
              />
            </div>
            <CollapsibleText html={item.description} imageUrl={item.imageUrl} contactLink={item.contactLink} />
          </div>
        </div>
      ))}

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
