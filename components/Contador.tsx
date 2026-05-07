"use client"

import { useState, useEffect } from "react"

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface ContadorProps {
  eventDate?: string // Opcional: fecha específica del evento en formato ISO
}

export default function Contador({ eventDate }: ContadorProps) {
  // CONFIGURACIÓN FÁCIL: Define tu fecha del evento aquí
  const eventConfig = {
    dia: 12,          // Día del evento (1-31)
    mes: 10,           // Mes del evento (1-12)
    anio: 2025,       // Año del evento
    hora: 7,          // Hora del evento (0-23)
    minuto: 30,       // Minuto del evento (0-59)
    segundo: 0        // Segundo del evento (0-59)
  }
  
  // Creamos la fecha objetivo a partir de la configuración
  const createTargetDate = (useNextYear = false) => {
    // Si se proporciona eventDate como prop, lo usamos
    if (eventDate && !useNextYear) {
      return new Date(eventDate)
    }
    
    // Si no, usamos la configuración manual
    // Los meses en JavaScript van de 0-11, por eso restamos 1 al mes
    let year = eventConfig.anio
    
    // Si useNextYear es true, calculamos para el año siguiente
    if (useNextYear) {
      const now = new Date()
      year = now.getFullYear() + 1
    }
    
    return new Date(
      year, 
      eventConfig.mes - 1, 
      eventConfig.dia, 
      eventConfig.hora, 
      eventConfig.minuto, 
      eventConfig.segundo
    )
  }
  
  const [targetDate, setTargetDate] = useState(createTargetDate())
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [loading, setLoading] = useState(true)
  const [isNextYear, setIsNextYear] = useState(false)

  const [eventDay, setEventDay] = useState(false)
  
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
        
        // Si ya pasó el día del evento y aún no estamos calculando para el próximo año
        if (!isNextYear) {
          setIsNextYear(true)
          setTargetDate(createTargetDate(true))
          return // Salimos para que la próxima ejecución calcule con la nueva fecha
        } else {
          // Si ya estamos en modo "próximo año" pero ha pasado de nuevo, actualizamos al siguiente año
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
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
            Cuenta Regresiva
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {eventDay 
              ? "¡Hoy es el día del evento!" 
              : isNextYear 
                ? "¡El evento de este año ya pasó! Tiempo para la próxima edición:" 
                : "Prepárate, el evento comienza en:"}
          </p>
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
    <div className="bg-gradient-to-br from-pink-500 via-violet-500 to-blue-500 rounded-lg shadow-lg p-0.5 sm:p-1">
      <div className="bg-white dark:bg-gray-800 rounded-md sm:rounded-lg backdrop-blur-sm bg-opacity-90 h-16 sm:h-20 md:h-24 flex flex-col items-center justify-center">
        <div className="text-xl sm:text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500">
          {value.toString().padStart(2, '0')}
        </div>
        <div className="text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm">
          {label}
        </div>
      </div>
    </div>
  )
}

/*
INSTRUCCIONES PARA CAMBIAR LA FECHA DEL EVENTO:
--------------------------------------------------
1. Encuentra la sección "CONFIGURACIÓN FÁCIL" al inicio del componente
2. Modifica los valores numéricos según tus necesidades:
   - dia: día del mes (1-31)
   - mes: número del mes (1-12)
   - anio: año del evento (ej: 2025)
   - hora: hora en formato 24h (0-23)
   - minuto: minutos (0-59)
   - segundo: segundos (0-59)
3. Guarda el archivo y el contador se actualizará automáticamente
*/