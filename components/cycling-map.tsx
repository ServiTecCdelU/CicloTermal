{/*"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { MapPin, Droplets, Flag, Bike, FileUp } from "lucide-react"

import { renderToString } from "react-dom/server"

// Estilos para animaciones y efectos que no se pueden lograr fácilmente con Tailwind
const animationStyles = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  @keyframes bounce {
    0% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(-5px);
    }
  }
  .pulse-animation {
    animation: pulse 2s infinite;
  }
  .bounce-animation {
    animation: bounce 1s infinite alternate;
  }
`

// Coordenadas predeterminadas para Federación, Entre Ríos, Argentina
const DEFAULT_COORDS = {
  center: [-30.9795, -57.9282], // Centro de Federación
  zoom: 13,
  // Puntos del recorrido (aproximados para un circuito de 50km)
  route: [
    [-30.9795, -57.9282], // Punto de inicio
    [-30.965, -57.915], // Punto intermedio 1
    [-30.95, -57.93], // Punto intermedio 2
    [-30.94, -57.95], // Hidratación 1
    [-30.93, -57.97], // Punto intermedio 3
    [-30.92, -57.99], // Punto intermedio 4
    [-30.91, -58.01], // Punto intermedio 5
    [-30.9, -58.03], // Hidratación 2
    [-30.91, -58.05], // Punto intermedio 6
    [-30.93, -58.04], // Punto intermedio 7
    [-30.95, -58.03], // Punto intermedio 8
    [-30.97, -58.01], // Punto intermedio 9
    [-30.98, -57.99], // Punto intermedio 10
    [-30.99, -57.97], // Punto intermedio 11
    [-30.985, -57.95], // Punto intermedio 12
    [-30.9795, -57.9282], // Punto de llegada (mismo que inicio)
  ],
  // Puntos de hidratación
  hydrationPoints: [
    [-30.94, -57.95], // Hidratación 1 (a 12.5km aproximadamente)
    [-30.9, -58.03], // Hidratación 2 (a 25km aproximadamente)
  ],
}

// Componentes SVG para los iconos
const StartIconSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-7 h-7"
  >
    <path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4" />
    <rect x="2" y="10" width="20" height="8" rx="2" />
    <path d="M7 15h0M11 15h0M16 15h0" />
  </svg>
)

const FinishIconSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-7 h-7"
  >
    <path d="M18 2v6M22 8l-4-4-4 4" />
    <rect x="2" y="12" width="16" height="8" rx="2" />
    <path d="M6 16h.01M10 16h.01M14 16h.01" />
  </svg>
)

const HydrationIconSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-6 h-6"
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const CyclistIconSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <circle cx="5" cy="17" r="3" />
    <circle cx="19" cy="17" r="3" />
    <path d="M9 9 5 17" />
    <path d="M9 9h6l3 8" />
    <circle cx="9" cy="6" r="2" />
  </svg>
)

// Interfaz para los datos de la ruta
interface RouteData {
  center: [number, number]
  zoom: number
  route: [number, number][]
  hydrationPoints: [number, number][]
  distance?: number
  elevation?: number
  estimatedTime?: string
}

export default function CyclingMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const cyclistMarkersRef = useRef<L.Marker[]>([])
  const routePolylineRef = useRef<L.Polyline | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [routeData, setRouteData] = useState<RouteData>(DEFAULT_COORDS)
  const [routeStats, setRouteStats] = useState({
    distance: 50,
    elevation: 350,
    estimatedTime: "2:30",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

      let routePoints: [number, number][] = []

      // Parsear según el tipo de archivo
      switch (fileExt) {
        case "gpx":
          routePoints = parseGPX(content)
          break
        case "tcx":
          routePoints = parseTCX(content)
          break
        case "kml":
          routePoints = parseKML(content)
          break
        case "csv":
          routePoints = parseCSV(content)
          break
        default:
          throw new Error(`Formato de archivo no soportado: ${fileExt}`)
      }

      if (routePoints.length < 2) {
        throw new Error("No se encontraron suficientes puntos en el archivo")
      }

      // Calcular puntos de hidratación
      const hydrationPoints = calculateHydrationPoints(routePoints)

      // Calcular estadísticas
      const stats = calculateRouteStats(routePoints)
      setRouteStats(stats)

      // Actualizar datos de la ruta
      const newRouteData: RouteData = {
        center: routePoints[0], // Centro en el punto de inicio
        zoom: 13,
        route: routePoints,
        hydrationPoints,
      }

      setRouteData(newRouteData)

      // Actualizar el mapa si ya está cargado
      if (leafletMapRef.current) {
        updateMapWithNewRoute(newRouteData)
      }
    } catch (err) {
      console.error("Error al procesar el archivo:", err)
      setError(err instanceof Error ? err.message : "Error al procesar el archivo")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para actualizar el mapa con la nueva ruta
  const updateMapWithNewRoute = (newRouteData: RouteData) => {
    const map = leafletMapRef.current
    if (!map) return

    // Limpiar marcadores de ciclistas existentes
    cyclistMarkersRef.current.forEach((marker) => marker.remove())
    cyclistMarkersRef.current = []

    // Eliminar la ruta existente
    if (routePolylineRef.current) {
      routePolylineRef.current.remove()
    }

    // Crear la nueva ruta
    const routePolyline = L.polyline(newRouteData.route, {
      color: "#8b5cf6",
      weight: 5,
      opacity: 0.7,
    }).addTo(map)

    routePolylineRef.current = routePolyline

    // Ajustar el mapa para mostrar toda la ruta
    map.fitBounds(routePolyline.getBounds())

    // Limpiar marcadores existentes
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        layer.remove()
      }
    })

    // Crear marcador de inicio personalizado
    const startIcon = L.divIcon({
      html: `
        <div class="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg border-2 border-white pulse-animation" style="z-index: 1000;">
          ${renderToString(<StartIconSVG />)}
        </div>
      `,
      className: "bg-transparent border-none",
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    })

    // Crear marcador de llegada personalizado
    const finishIcon = L.divIcon({
      html: `
        <div class="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg border-2 border-white" style="z-index: 1000;">
          ${renderToString(<FinishIconSVG />)}
        </div>
      `,
      className: "bg-transparent border-none",
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    })

    // Crear marcador de hidratación personalizado
    const hydrationIcon = L.divIcon({
      html: `
        <div class="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-lg border-2 border-white pulse-animation" style="z-index: 1000;">
          ${renderToString(<HydrationIconSVG />)}
        </div>
      `,
      className: "bg-transparent border-none",
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    })

    // Agregar marcador de inicio
    L.marker(newRouteData.route[0], { icon: startIcon })
      .addTo(map)
      .bindPopup(
        `<div class="p-2">
          <h3 class="font-bold text-green-600">Punto de Salida</h3>
          <p class="text-gray-700">Inicio del recorrido</p>
        </div>`,
      )

    // Agregar marcador de llegada
    L.marker(newRouteData.route[newRouteData.route.length - 1], { icon: finishIcon })
      .addTo(map)
      .bindPopup(
        `<div class="p-2">
          <h3 class="font-bold text-red-600">Punto de Llegada</h3>
          <p class="text-gray-700">Fin del recorrido</p>
        </div>`,
      )

    // Agregar marcadores de hidratación
    newRouteData.hydrationPoints.forEach((point, index) => {
      L.marker(point, { icon: hydrationIcon })
        .addTo(map)
        .bindPopup(
          `<div class="p-2">
            <h3 class="font-bold text-blue-600">Puesto de Hidratación ${index + 1}</h3>
            <p class="text-gray-700">Agua, isotónicos y frutas disponibles</p>
          </div>`,
        )
    })

    // Iniciar animación de ciclistas
    startCyclistAnimation(newRouteData.route)
  }

  // Función para iniciar la animación de ciclistas
  const startCyclistAnimation = (route: [number, number][]) => {
    // Crear puntos de ruta interpolados para movimiento más suave
    const interpolatedRoute: [number, number][] = []
    for (let i = 0; i < route.length - 1; i++) {
      const start = route[i]
      const end = route[i + 1]

      // Agregar 20 puntos intermedios entre cada par de puntos de ruta para un movimiento más suave
      for (let j = 0; j <= 20; j++) {
        const t = j / 20
        interpolatedRoute.push([start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t])
      }
    }

    // Posiciones a evitar (puntos importantes)
    const avoidPositions = [
      ...routeData.hydrationPoints,
      route[0], // Punto de salida
      route[route.length - 1], // Punto de llegada
    ]

    // Función para verificar si una posición está cerca de un punto a evitar
    const isNearAvoidPoint = (pos: [number, number]) => {
      return avoidPositions.some((avoidPos) => {
        const distance = Math.sqrt(Math.pow(pos[0] - avoidPos[0], 2) + Math.pow(pos[1] - avoidPos[1], 2))
        return distance < 0.005 // Umbral de distancia para evitar
      })
    }

    // Iniciar animación con diferentes posiciones iniciales para cada ciclista
    const numCyclists = 5
    const cyclistSpeeds = [0.15, 0.16, 0.14, 0.155, 0.145] // Velocidades lentas
    const cyclistPositions = Array(numCyclists).fill(0)

    // Limpiar ciclistas existentes
    cyclistMarkersRef.current.forEach((marker) => marker.remove())
    cyclistMarkersRef.current = []

    // Crear marcadores de ciclistas
    const map = leafletMapRef.current
    if (!map) return

    // Colores para los ciclistas
    const cyclistColors = [
      "from-pink-500 to-rose-600",
      "from-violet-500 to-purple-600",
      "from-blue-500 to-indigo-600",
      "from-emerald-500 to-green-600",
      "from-amber-500 to-orange-600",
    ]

    // Distribuir ciclistas a lo largo de la ruta
    for (let i = 0; i < numCyclists; i++) {
      cyclistPositions[i] = Math.floor(i * (interpolatedRoute.length / numCyclists))

      const cyclistIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r ${cyclistColors[i]} text-white shadow-md border border-white bounce-animation" style="z-index: 900;">
            ${renderToString(<CyclistIconSVG />)}
          </div>
        `,
        className: "bg-transparent border-none",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = L.marker(interpolatedRoute[cyclistPositions[i]], { icon: cyclistIcon })
        .addTo(map)
        .bindPopup(`<div class="p-2"><b>Ciclista ${i + 1}</b><br>En movimiento</div>`)

      cyclistMarkersRef.current.push(marker)
    }

    // Función de animación
    const animate = () => {
      cyclistMarkersRef.current.forEach((marker, i) => {
        // Avanzar posición según velocidad
        cyclistPositions[i] = (cyclistPositions[i] + cyclistSpeeds[i]) % interpolatedRoute.length

        // Obtener siguiente posición
        let nextPos = Math.floor(cyclistPositions[i])

        // Verificar si la posición está cerca de un punto a evitar
        if (isNearAvoidPoint(interpolatedRoute[nextPos])) {
          // Saltar este punto y avanzar más rápido
          cyclistPositions[i] = (cyclistPositions[i] + 5) % interpolatedRoute.length
          nextPos = Math.floor(cyclistPositions[i])
        }

        // Actualizar posición del marcador
        marker.setLatLng(interpolatedRoute[nextPos])

        // Rotar el icono según la dirección del movimiento
        if (nextPos < interpolatedRoute.length - 1) {
          const currentPos = interpolatedRoute[nextPos]
          const nextPosition = interpolatedRoute[(nextPos + 1) % interpolatedRoute.length]

          // Calcular ángulo de rotación
          const angle = (Math.atan2(nextPosition[1] - currentPos[1], nextPosition[0] - currentPos[0]) * 180) / Math.PI

          // Aplicar rotación al icono
          const iconElement = marker.getElement()
          if (iconElement) {
            const svgElement = iconElement.querySelector("svg")
            if (svgElement) {
              svgElement.style.transform = `rotate(${angle + 90}deg)`
            }
          }
        }
      })

      requestAnimationFrame(animate)
    }

    animate()
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

  // Inicializar el mapa
  useEffect(() => {
    // Agregar estilos de animación
    const styleElement = document.createElement("style")
    styleElement.innerHTML = animationStyles
    document.head.appendChild(styleElement)

    // Inicializar el mapa solo si el elemento existe y el mapa no ha sido inicializado
    if (mapRef.current && !leafletMapRef.current) {
      // Crear el mapa
      const map = L.map(mapRef.current).setView(routeData.center, routeData.zoom)
      leafletMapRef.current = map

      // Agregar capa de mapa base
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      // Crear la ruta
      const routePolyline = L.polyline(routeData.route, {
        color: "#8b5cf6",
        weight: 5,
        opacity: 0.7,
      }).addTo(map)

      routePolylineRef.current = routePolyline

      // Ajustar el mapa para mostrar toda la ruta
      map.fitBounds(routePolyline.getBounds())

      // Crear marcador de inicio personalizado
      const startIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg border-2 border-white pulse-animation" style="z-index: 1000;">
            ${renderToString(<StartIconSVG />)}
          </div>
        `,
        className: "bg-transparent border-none",
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      })

      // Crear marcador de llegada personalizado
      const finishIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg border-2 border-white" style="z-index: 1000;">
            ${renderToString(<FinishIconSVG />)}
          </div>
        `,
        className: "bg-transparent border-none",
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      })

      // Crear marcador de hidratación personalizado
      const hydrationIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-lg border-2 border-white pulse-animation" style="z-index: 1000;">
            ${renderToString(<HydrationIconSVG />)}
          </div>
        `,
        className: "bg-transparent border-none",
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      })

      // Agregar marcador de inicio
      L.marker(routeData.route[0], { icon: startIcon })
        .addTo(map)
        .bindPopup(
          `<div class="p-2">
            <h3 class="font-bold text-green-600">Punto de Salida</h3>
            <p class="text-gray-700">Inicio del recorrido</p>
          </div>`,
        )

      // Agregar marcador de llegada
      L.marker(routeData.route[routeData.route.length - 1], { icon: finishIcon })
        .addTo(map)
        .bindPopup(
          `<div class="p-2">
            <h3 class="font-bold text-red-600">Punto de Llegada</h3>
            <p class="text-gray-700">Fin del recorrido</p>
          </div>`,
        )

      // Agregar marcadores de hidratación
      routeData.hydrationPoints.forEach((point, index) => {
        L.marker(point, { icon: hydrationIcon })
          .addTo(map)
          .bindPopup(
            `<div class="p-2">
              <h3 class="font-bold text-blue-600">Puesto de Hidratación ${index + 1}</h3>
              <p class="text-gray-700">Agua, isotónicos y frutas disponibles</p>
              <p class="text-sm text-gray-500 mt-1">Km ${index === 0 ? "12.5" : "25"} aproximadamente</p>
            </div>`,
          )
      })

      // Iniciar animación de ciclistas
      startCyclistAnimation(routeData.route)

      setIsMapLoaded(true)
    }

    return () => {
      // Limpiar el mapa cuando el componente se desmonte
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [])

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
          Recorrido 50 KM
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Federación, Entre Ríos - Circuito Rural</p>
      </div>

      //Sección de carga de archivos 
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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
      </div>

      //Mapa 
      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
        <div ref={mapRef} className="w-full h-[500px] relative">
          {!isMapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
            </div>
          )}
        </div>
      </div>

      // Leyenda 
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
            <MapPin className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm md:text-base text-gray-700 font-medium">Punto de Salida</p>
            <p className="text-xs text-gray-500">Km 0</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-rose-500 to-red-600 flex items-center justify-center shadow-md">
            <Flag className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm md:text-base text-gray-700 font-medium">Punto de Llegada</p>
            <p className="text-xs text-gray-500">Km {routeStats.distance}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-sky-400 to-blue-600 flex items-center justify-center shadow-md">
            <Droplets className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm md:text-base text-gray-700 font-medium">Puestos de Hidratación</p>
            <p className="text-xs text-gray-500">{routeData.hydrationPoints.length} puntos en la ruta</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 flex items-center justify-center shadow-md">
            <Bike className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm md:text-base text-gray-700 font-medium">Ciclistas en Ruta</p>
            <p className="text-xs text-gray-500">Seguimiento en vivo</p>
          </div>
        </div>
      </div>

      //Estadísticas 
      <div className="bg-white rounded-xl shadow-md p-6 max-w-5xl mx-auto">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Información del Recorrido</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Distancia Total</span>
            <span className="text-2xl font-bold text-gray-800">{routeStats.distance} km</span>
            <span className="text-xs text-gray-500 mt-1">Circuito rural</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Desnivel Acumulado</span>
            <span className="text-2xl font-bold text-gray-800">{routeStats.elevation} m</span>
            <span className="text-xs text-gray-500 mt-1">Dificultad media</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Tiempo Estimado</span>
            <span className="text-2xl font-bold text-gray-800">{routeStats.estimatedTime} h</span>
            <span className="text-xs text-gray-500 mt-1">Ritmo moderado</span>
          </div>
        </div>
      </div>
    </div>
  )
}
*/}