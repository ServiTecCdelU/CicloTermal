"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { BikeIcon } from "@/components/section-title"

function formatSubtitle(fechaEvento?: string) {
  if (!fechaEvento) return "Cicloturismo Termal de Federación"
  const [y, m, d] = fechaEvento.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
}

const staticSlides = [
  {
    id: "default-1",
    imageUrl: "/foto 1.jpg?height=600&width=1200",
    title: "Cicloturismo Termal de Federación",
    subtitle: null, // se reemplaza con fecha dinámica
    buttonText: "Inscripción Cerrada",
    buttonUrl: "",
  },
  {
    id: "default-2",
    imageUrl: "/foto 2.jpg?height=600&width=1200",
    title: "Recorre los paisajes de Entre Ríos",
    subtitle: "50 km de aventura y naturaleza",
    buttonText: "evento",
    buttonUrl: "/#evento",
  },
  {
    id: "default-3",
    imageUrl: "/foto 3.jpg?height=600&width=1200",
    title: "Sponsors",
    subtitle: "Conoce a nuestros sponsors",
    buttonText: "Sponsors",
    buttonUrl: "/#sponsors",
  },
  {
    id: "default-4",
    imageUrl: "/foto 4.jpg?height=600&width=1200",
    title: "¡Tenes alguna duda?",
    subtitle: "Contactate con nosotros",
    buttonText: "Contacto",
    buttonUrl: "/#contacto",
  },
  {
    id: "default-5",
    imageUrl: "/foto 5.jpg?height=600&width=1200",
    title: "Como comenzamos",
    subtitle: "Te contamos nuestra historia",
    buttonText: "Historia",
    buttonUrl: "/#historia",
  },
  {
    id: "default-6",
    imageUrl: "/foto 6.jpg?height=600&width=1200",
    title: "Cicloturismo Termal de Federación",
    subtitle: null, // se reemplaza con fecha dinámica
    buttonText: "Inscripción Cerrada",
    buttonUrl: "",
  },
]

export default function CarouselSection() {
  const { eventSettings } = useFirebaseContext()
  const fechaLabel = formatSubtitle(eventSettings?.fechaEvento)
  const slides = staticSlides.map((s) => ({ ...s, subtitle: s.subtitle ?? fechaLabel }))
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  useEffect(() => {
    if (slides.length <= 1) return

    const interval = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => clearInterval(interval)
  }, [currentSlide])

  return (
    <div className="relative h-screen overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="relative h-full w-full">
            <Image
              src={isMobile ? slide.imageUrl.replace(".jpg", " cel.jpg") : slide.imageUrl.replace(".jpg", " pc.jpg")}
              alt={slide.title || "Carousel image"}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 max-w-3xl">
                {slide.title || "Cicloturismo Termal de Federación"}
              </h1>
              <p className="text-lg md:text-xl mb-8 max-w-2xl">
                {slide.subtitle || "Segunda Edición - 12 de octubre de 2025"}
              </p>
              {slide.buttonText &&
                (slide.buttonUrl ? (
                  <Link href={slide.buttonUrl}>
                    <Button
                      size="lg"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {slide.buttonText}
                    </Button>
                  </Link>
                ) : (
                  <Button size="lg" disabled className="bg-gray-500 cursor-not-allowed opacity-70">
                    {slide.buttonText}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
            aria-label="Previous slide"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
            aria-label="Next slide"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? "bg-white" : "bg-white/50"}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          {/* Bici decorativa bottom-right */}
          <div className="absolute bottom-6 right-6 opacity-25 hidden md:block">
            <BikeIcon size={80} color="white" />
          </div>
        </>
      )}
    </div>
  )
}
