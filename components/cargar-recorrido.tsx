"use client"

import type React from "react"

import { useState, useRef } from "react"
import { FileUp, Trash2, Droplets } from "lucide-react"

// Interfaz para los datos de la ruta
export interface RouteData {
  center: [number, number]
  zoom: number
  route: [number, number][]
  hydrationPoints: [number, number][]
  distance?: number
  elevation?: number
  estimatedTime?: string
}

interface CargarRecorridoProps {
  onRouteLoaded: (routeData: RouteData) => void
  currentRouteData?: RouteData
}

export default function CargarRecorrido({ onRouteLoaded, currentRouteData }: CargarRecorridoProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hydrationPoints, setHydrationPoints] = useState<[number, number][]>(currentRouteData?.hydrationPoints || [])
  const [routePoints, setRoutePoints] = useState<[number, number][]>(currentRouteData?.route || [])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Función para parsear archivos GPX
  const parseGPX = (gpxContent: string): [number, number][] => {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(gpxContent, "text/xml")
    const trackPoints = xmlDoc.getElementsByTagName("trkpt")
    const points: [number, number][] = []

    for (let i = 0; i < trackPoints.length; i++) {
      const point = trackPoints[i]
      const lat = Number.parseFloat(point.getAttribute("lat") || "0")
      const lon = Number.parseFloat(point.getAttribute("lon") || "0")
      if (!isNaN(lat) && !isNaN(lon)) {
        points.push([lat, lon])
      }
    }

    return points
  }

  // Función para parsear archivos TCX
  const parseTCX = (tcxContent: string): [number, number][] => {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(tcxContent, "text/xml")
    const trackPoints = xmlDoc.getElementsByTagName("Trackpoint")
    const points: [number, number][] = []

    for (let i = 0; i < trackPoints.length; i++) {
      const point = trackPoints[i]
      const positionElement = point.getElementsByTagName("Position")[0]
      if (positionElement) {
        const latElement = positionElement.getElementsByTagName("LatitudeDegrees")[0]
        const lonElement = positionElement.getElementsByTagName("LongitudeDegrees")[0]
        if (latElement && lonElement) {
          const lat = Number.parseFloat(latElement.textContent || "0")
          const lon = Number.parseFloat(lonElement.textContent || "0")
          if (!isNaN(lat) && !isNaN(lon)) {
            points.push([lat, lon])
          }
        }
      }
    }

    return points
  }

  // Función para parsear archivos KML
  const parseKML = (kmlContent: string): [number, number][] => {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(kmlContent, "text/xml")
    const coordinates = xmlDoc.getElementsByTagName("coordinates")
    const points: [number, number][] = []

    for (let i = 0; i < coordinates.length; i++) {
      const coordText = coordinates[i].textContent || ""
      const coordPairs = coordText.trim().split(/\s+/)

      for (const pair of coordPairs) {
        const [lon, lat, _] = pair.split(",").map(Number.parseFloat)
        if (!isNaN(lat) && !isNaN(lon)) {
          points.push([lat, lon])
        }
      }
    }

    return points
  }

  // Función para parsear archivos CSV
  const parseCSV = (csvContent: string): [number, number][] => {
    const lines = csvContent.split("\n")
    const points: [number, number][] = []

    // Intentar detectar el formato del CSV
    let latIndex = -1
    let lonIndex = -1

    // Buscar encabezados comunes
    const headers = lines[0].toLowerCase().split(",")
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].trim()
      if (header === "lat" || header === "latitude") {
        latIndex = i
      } else if (header === "lon" || header === "lng" || header === "longitude") {
        lonIndex = i
      }
    }

    // Si no se encontraron encabezados, asumir que las primeras dos columnas son lat,lon
    if (latIndex === -1 || lonIndex === -1) {
      latIndex = 0
      lonIndex = 1
    }

    // Procesar las líneas (saltar la primera si tiene encabezados)
    const startLine = headers[0].match(/^[a-z]/i) ? 1 : 0

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line) {
        const values = line.split(",")
        if (values.length > Math.max(latIndex, lonIndex)) {
          const lat = Number.parseFloat(values[latIndex])
          const lon = Number.parseFloat(values[lonIndex])
          if (!isNaN(lat) && !isNaN(lon)) {
            points.push([lat, lon])
          }
        }
      }
    }

    return points
  }

  // Función para calcular puntos de hidratación automáticamente
  const calculateHydrationPoints = (route: [number, number][]): [number, number][] => {
    if (route.length < 4) return []

    // Calcular la distancia total aproximada
    let totalDistance = 0
    for (let i = 0; i < route.length - 1; i++) {
      const [lat1, lon1] = route[i]
      const [lat2, lon2] = route[i + 1]

      // Fórmula de Haversine para calcular distancia entre puntos
      const R = 6371 // Radio de la Tierra en km
      const dLat = ((lat2 - lat1) * Math.PI) / 180
      const dLon = ((lon2 - lon1) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distance = R * c

      totalDistance += distance
    }

    // Colocar puntos de hidratación aproximadamente cada 1/4 y 1/2 de la ruta
    const hydrationPoints: [number, number][] = []

    let currentDistance = 0
    let quarterFound = false
    let halfFound = false

    for (let i = 0; i < route.length - 1; i++) {
      const [lat1, lon1] = route[i]
      const [lat2, lon2] = route[i + 1]

      // Calcular distancia del segmento actual
      const R = 6371
      const dLat = ((lat2 - lat1) * Math.PI) / 180
      const dLon = ((lon2 - lon1) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const segmentDistance = R * c

      currentDistance += segmentDistance

      // Verificar si estamos cerca del 25% de la ruta
      if (!quarterFound && currentDistance >= totalDistance * 0.25) {
        hydrationPoints.push(route[i])
        quarterFound = true
      }

      // Verificar si estamos cerca del 50% de la ruta
      if (!halfFound && currentDistance >= totalDistance * 0.5) {
        hydrationPoints.push(route[i])
        halfFound = true
      }
    }

    return hydrationPoints
  }

  // Función para calcular estadísticas de la ruta
  const calculateRouteStats = (
    route: [number, number][],
  ): { distance: number; elevation: number; estimatedTime: string } => {
    // Calcular distancia total
    let totalDistance = 0
    for (let i = 0; i < route.length - 1; i++) {
      const [lat1, lon1] = route[i]
      const [lat2, lon2] = route[i + 1]

      // Fórmula de Haversine
      const R = 6371 // Radio de la Tierra en km
      const dLat = ((lat2 - lat1) * Math.PI) / 180
      const dLon = ((lon2 - lon1) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distance = R * c

      totalDistance += distance
    }

    // Redondear a 1 decimal
    totalDistance = Math.round(totalDistance * 10) / 10

    // Estimar elevación (en una aplicación real, esto vendría del archivo GPX)
    const elevation = Math.round(totalDistance * 7) // Estimación simple: 7m de elevación por km

    // Estimar tiempo (asumiendo velocidad promedio de 20 km/h)
    const timeInHours = totalDistance / 20
    const hours = Math.floor(timeInHours)
    const minutes = Math.round((timeInHours - hours) * 60)
    const estimatedTime = `${hours}:${minutes < 10 ? "0" + minutes : minutes}`

    return { distance: totalDistance, elevation, estimatedTime }
  }

  // Función para procesar el archivo cargado
  const processRouteFile = async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      const content = await file.text()
      const fileExt = file.name.split(".").pop()?.toLowerCase()

      let points: [number, number][] = []

      // Parsear según el tipo de archivo
      switch (fileExt) {
        case "gpx":
          points = parseGPX(content)
          break
        case "tcx":
          points = parseTCX(content)
          break
        case "kml":
          points = parseKML(content)
          break
        case "csv":
          points = parseCSV(content)
          break
        default:
          throw new Error(`Formato de archivo no soportado: ${fileExt}`)
      }

      if (points.length < 2) {
        throw new Error("No se encontraron suficientes puntos en el archivo")
      }

      // Actualizar los puntos de la ruta
      setRoutePoints(points)

      // Calcular puntos de hidratación automáticamente
      const newHydrationPoints = calculateHydrationPoints(points)
      setHydrationPoints(newHydrationPoints)

      // Calcular estadísticas
      const stats = calculateRouteStats(points)

      // Crear objeto de datos de ruta
      const newRouteData: RouteData = {
        center: points[0], // Centro en el punto de inicio
        zoom: 13,
        route: points,
        hydrationPoints: newHydrationPoints,
        distance: stats.distance,
        elevation: stats.elevation,
        estimatedTime: stats.estimatedTime,
      }

      // Enviar datos al componente padre
      onRouteLoaded(newRouteData)
    } catch (err) {
      console.error("Error al procesar el archivo:", err)
      setError(err instanceof Error ? err.message : "Error al procesar el archivo")
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar la carga de archivos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]
      processRouteFile(file)
    }
  }

  // Manejar clic en el botón de carga
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Agregar punto de hidratación
  const addHydrationPoint = (index: number) => {
    if (routePoints.length < 2) return

    // Obtener punto de la ruta en el índice especificado
    const newPoint = routePoints[index]
    const newHydrationPoints = [...hydrationPoints, newPoint]
    setHydrationPoints(newHydrationPoints)

    // Actualizar datos de la ruta
    if (currentRouteData) {
      const updatedRouteData = {
        ...currentRouteData,
        hydrationPoints: newHydrationPoints,
      }
      onRouteLoaded(updatedRouteData)
    }
  }

  // Eliminar punto de hidratación
  const removeHydrationPoint = (index: number) => {
    const newHydrationPoints = hydrationPoints.filter((_, i) => i !== index)
    setHydrationPoints(newHydrationPoints)

    // Actualizar datos de la ruta
    if (currentRouteData) {
      const updatedRouteData = {
        ...currentRouteData,
        hydrationPoints: newHydrationPoints,
      }
      onRouteLoaded(updatedRouteData)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Cargar Recorrido</h3>
          <p className="text-sm text-gray-600">
            Sube un archivo con tu recorrido en formato GPX, TCX, KML o CSV para visualizarlo en el mapa.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".gpx,.tcx,.kml,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <FileUp className="h-5 w-5" />
            )}
            <span>{isLoading ? "Procesando..." : "Cargar Archivo"}</span>
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-4 text-xs text-gray-500">
        <p>Formatos soportados:</p>
        <ul className="flex flex-wrap gap-x-4 mt-1">
          <li className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span> GPX (GPS Exchange Format)
          </li>
          <li className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span> TCX (Training Center XML)
          </li>
          <li className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-purple-500 rounded-full"></span> KML (Keyhole Markup Language)
          </li>
          <li className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full"></span> CSV (Comma Separated Values)
          </li>
        </ul>
      </div>

      {/* Sección para gestionar puntos de hidratación */}
      {routePoints.length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <h4 className="text-md font-semibold text-gray-800 mb-2">Puntos de Hidratación</h4>
          <p className="text-sm text-gray-600 mb-3">
            Gestiona los puntos de hidratación a lo largo del recorrido. Puedes agregar o eliminar puntos.
          </p>

          <div className="space-y-3">
            {hydrationPoints.map((point, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-sky-400 to-blue-600 flex items-center justify-center shadow-md">
                    <Droplets className="h-4 w-4 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Punto de Hidratación {index + 1}</p>
                    <p className="text-xs text-gray-500">
                      Lat: {point[0].toFixed(4)}, Lon: {point[1].toFixed(4)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeHydrationPoint(index)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Botón para agregar punto de hidratación */}
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Agregar punto de hidratación en la posición:</p>
              <div className="flex flex-wrap gap-2">
                {routePoints.length > 0 && (
                  <>
                    <button
                      onClick={() => addHydrationPoint(Math.floor(routePoints.length * 0.25))}
                      className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      25% del recorrido
                    </button>
                    <button
                      onClick={() => addHydrationPoint(Math.floor(routePoints.length * 0.5))}
                      className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      50% del recorrido
                    </button>
                    <button
                      onClick={() => addHydrationPoint(Math.floor(routePoints.length * 0.75))}
                      className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      75% del recorrido
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
