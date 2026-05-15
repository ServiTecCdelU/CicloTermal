"use client"

import { useState, useEffect } from "react"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { SectionTitle, BikeIcon } from "@/components/section-title"

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

// Fallback hardcodeado si no hay fecha en Firebase
const FALLBACK = { dia: 12, mes: 10, anio: 2025, hora: 7, minuto: 30 }

export default function Contador() {
  const { eventSettings } = useFirebaseContext()

  const createTargetDate = (nextYear = false) => {
    const fechaEvento = eventSettings?.fechaEvento
    if (fechaEvento) {
      const [y, m, d] = fechaEvento.split("-").map(Number)
      const year = nextYear ? y + 1 : y
      return new Date(year, m - 1, d, FALLBACK.hora, FALLBACK.minuto, 0)
    }
    const year = nextYear ? new Date().getFullYear() + 1 : FALLBACK.anio
    return new Date(year, FALLBACK.mes - 1, FALLBACK.dia, FALLBACK.hora, FALLBACK.minuto, 0)
  }
  
  const [targetDate, setTargetDate] = useState(() => createTargetDate())
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [loading, setLoading] = useState(true)
  const [isNextYear, setIsNextYear] = useState(false)
  const [eventDay, setEventDay] = useState(false)

  useEffect(() => {
    setTargetDate(createTargetDate())
    setIsNextYear(false)
  }, [eventSettings?.fechaEvento])

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()
      
      // Si el evento ya pasó
      if (difference <= 0) {
        // Calculamos cuánto tiempo ha pasado desde el evento
        const timeSinceEvent = Math.abs(difference)
        
        // Si han pasado menos de 24 horas desde el evento (estamos en el día del evento)
        if (timeSinceEvent < 24 * 60 * 60 * 1000) {
          // Mostramos todos los contadores en cero durante el día del evento
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
          setEventDay(true)
          setLoading(false)
          return
        } else {
          setEventDay(false)
        }
        
        if (!isNextYear) {
          setIsNextYear(true)
          setTargetDate(createTargetDate(true))
          return
        } else {
          setTargetDate(new Date(
            targetDate.getFullYear() + 1,
            targetDate.getMonth(),
            targetDate.getDate(),
            targetDate.getHours(),
            targetDate.getMinutes(),
            targetDate.getSeconds()
          ))
          return
        }
      }

      // Calcular unidades de tiempo
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
      setLoading(false)
    }

    // Calcular inmediatamente y configurar intervalo
    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    // Limpiar intervalo al desmontar el componente
    return () => clearInterval(timer)
  }, [targetDate, isNextYear])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-pulse flex space-x-4">
          <div className="bg-gray-200 h-12 w-32 rounded"></div>
          <div className="bg-gray-200 h-12 w-32 rounded"></div>
          <div className="bg-gray-200 h-12 w-32 rounded"></div>
          <div className="bg-gray-200 h-12 w-32 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full my-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <SectionTitle>Cuenta Regresiva</SectionTitle>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4">
            {eventDay 
              ? "¡Hoy es el día del evento!" 
              : isNextYear 
                ? "¡El evento de este año ya pasó! Tiempo para la próxima edición:" 
                : "Prepárate, el evento comienza en:"}
          </p>
        </div>

        <div className="flex justify-center mb-4">
          <BikeIcon size={52} className="opacity-70" />
        </div>

        <div className="grid grid-cols-4 gap-1 sm:gap-2 md:gap-4 max-w-full mx-auto px-1">
          <CountdownUnit value={timeLeft.days} label="Días" />
          <CountdownUnit value={timeLeft.hours} label="Horas" />
          <CountdownUnit value={timeLeft.minutes} label="Min" />
          <CountdownUnit value={timeLeft.seconds} label="Seg" />
        </div>
        
        <div className="text-center mt-6 text-sm text-gray-500">
          {eventDay 
            ? "¡El evento está en curso!" 
            : `Fecha objetivo: ${targetDate.toLocaleString()}${isNextYear ? " (próxima edición)" : ""}`}
        </div>
      </div>
    </div>
  )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-gray-900 rounded-lg shadow-lg p-0.5 sm:p-1">
      <div className="bg-white rounded-md sm:rounded-lg h-16 sm:h-20 md:h-24 flex flex-col items-center justify-center">
        <div className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900">
          {value.toString().padStart(2, '0')}
        </div>
        <div className="text-gray-600 font-medium text-xs sm:text-sm">
          {label}
        </div>
      </div>
    </div>
  )
}

