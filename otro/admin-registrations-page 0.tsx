"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { db } from "@/lib/firebase/firebase-config"
import { collection, getDocs, orderBy, query, doc, updateDoc } from "firebase/firestore"
import {
  Search,
  Filter,
  Eye,
  FileText,
  Home,
  ArrowUp,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  CalendarDays,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FilterX,
  ChevronDown,
  ChevronUp,
  Mail,
  User,
  Phone,
  MapPin,
  Calendar,
  WheatOff,
  Stethoscope,
  ClipboardList,
  NotebookPen,
  Edit,
  ArrowRightLeft,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"

// Importa EmailJS
import emailjs from "@emailjs/browser"

// Inicializa EmailJS
if (typeof window !== "undefined") {
  emailjs.init("qZ1uWOlXB-rlAsutR")
}

// Función para formatear fechas
const formatDate = (dateString) => {
  if (!dateString) return null

  // If it's already in day/month/year format, keep it
  if (dateString.includes("/")) return dateString

  // If it's in ISO format (YYYY-MM-DD)
  if (dateString.includes("-")) {
    const [year, month, day] = dateString.split("-")
    return `${day}/${month}/${year}`
  }

  return dateString
}

// Función para extraer información de condiciones de salud
const parseHealthConditions = (condicionSalud) => {
  if (!condicionSalud) return { condicionesSalud: "", esCeliaco: "no" }

  if (typeof condicionSalud === "string" && condicionSalud.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(condicionSalud)
      return {
        condicionesSalud: parsed.condicionesSalud || "",
        esCeliaco: parsed.esCeliaco || "no",
      }
    } catch (e) {
      return { condicionesSalud: condicionSalud, esCeliaco: "no" }
    }
  } else if (typeof condicionSalud === "object") {
    return {
      condicionesSalud: condicionSalud.condicionesSalud || "",
      esCeliaco: condicionSalud.esCeliaco || "no",
    }
  } else {
    return { condicionesSalud: condicionSalud || "", esCeliaco: "no" }
  }
}

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState([])
  const [filteredRegistrations, setFilteredRegistrations] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [healthFilter, setHealthFilter] = useState("all")
  const [celiacFilter, setCeliacFilter] = useState("all")
  const [noteFilter, setNoteFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [availableYears, setAvailableYears] = useState([])
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [statusNote, setStatusNote] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [comprobanteUrl, setComprobanteUrl] = useState("")
  const [loadingComprobante, setLoadingComprobante] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [zoomedImage, setZoomedImage] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [showFilters, setShowFilters] = useState(false)
  const topRef = useRef(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [newComprobanteFile, setNewComprobanteFile] = useState(null)
  const { toast } = useToast()

  const [transferFilter, setTransferFilter] = useState("all")
  const [editFormData, setEditFormData] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    telefono: "",
    localidad: "",
    numeroInscripcion: "",
    fechaNacimiento: "",
    genero: "",
    telefonoEmergencia: "",
    talleRemera: "",
    grupoSanguineo: "",
    grupoCiclistas: "",
    condicionSalud: "",
    transferidoA: "",
    precio: "",
  })

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchRegistrations()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const fetchRegistrations = async () => {
    setLoading(true)
    try {
      const registrationsRef = collection(db, "participantes2025")
      const allRegistrationsQuery = query(registrationsRef, orderBy("fechaInscripcion", "desc"))
      const snapshot = await getDocs(allRegistrationsQuery)

      const registrationsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        fechaInscripcion: doc.data().fechaInscripcion?.toDate?.() || null,
        fechaNacimiento: formatDate(doc.data().fechaNacimiento) || "-",
      }))

      // Aplicar el ordenamiento inicial: primero pendientes, luego por número de inscripción descendente
      registrationsData.sort((a, b) => {
        const aStatus = a.estado || "pendiente"
        const bStatus = b.estado || "pendiente"

        if (aStatus === "pendiente" && bStatus !== "pendiente") return -1
        if (aStatus !== "pendiente" && bStatus === "pendiente") return 1

        const aNum = a.numeroInscripcion || 0
        const bNum = b.numeroInscripcion || 0
        return bNum - aNum
      })

      const years = [...new Set(registrationsData.map((reg) => reg.fechaInscripcion?.getFullYear()).filter(Boolean))]
      setAvailableYears(years.sort((a, b) => b - a))

      setRegistrations(registrationsData)
      setFilteredRegistrations(registrationsData) // filteredRegistrations ya estará ordenado inicialmente
    } catch (error) {
      console.error("Error fetching registrations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistrations()
  }, [])

  useEffect(() => {
    let filtered = registrations

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (reg) =>
          reg.nombre?.toLowerCase().includes(term) ||
          reg.apellido?.toLowerCase().includes(term) ||
          reg.dni?.includes(term) ||
          reg.email?.toLowerCase().includes(term) ||
          reg.telefono?.includes(term) ||
          reg.localidad?.toLowerCase().includes(term),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((reg) => reg.estado === statusFilter)
    }

    if (yearFilter !== "all") {
      filtered = filtered.filter((reg) => reg.fechaInscripcion?.getFullYear() === Number.parseInt(yearFilter))
    }

    if (healthFilter !== "all") {
      filtered = filtered.filter((reg) => {
        const healthInfo = parseHealthConditions(reg.condicionSalud)
        if (healthFilter === "with_conditions") {
          return healthInfo.condicionesSalud && healthInfo.condicionesSalud.trim() !== ""
        } else if (healthFilter === "without_conditions") {
          return !healthInfo.condicionesSalud || healthInfo.condicionesSalud.trim() === ""
        }
        return true
      })
    }

    if (celiacFilter !== "all") {
      filtered = filtered.filter((reg) => {
        const healthInfo = parseHealthConditions(reg.condicionSalud)
        return healthInfo.esCeliaco === celiacFilter
      })
    }

    if (noteFilter !== "all") {
      filtered = filtered.filter((reg) => {
        if (noteFilter === "with_notes") {
          return reg.nota && reg.nota.trim() !== ""
        } else if (noteFilter === "without_notes") {
          return !reg.nota || reg.nota.trim() === ""
        }
        return true
      })
    }

    // Ordenar: primero pendientes, luego por número de inscripción descendente (más reciente primero)
    // Esta lógica ya se aplica en fetchRegistrations para la carga inicial,
    // pero se mantiene aquí para re-ordenar si los filtros cambian y afectan el orden.
    filtered.sort((a, b) => {
      // Prioridad 1: Estado pendiente va primero
      const aStatus = a.estado || "pendiente"
      const bStatus = b.estado || "pendiente"

      if (aStatus === "pendiente" && bStatus !== "pendiente") return -1
      if (aStatus !== "pendiente" && bStatus === "pendiente") return 1

      // Prioridad 2: Por número de inscripción descendente (más alto primero)
      const aNum = a.numeroInscripcion || 0
      const bNum = b.numeroInscripcion || 0
      return bNum - aNum
    })

    setFilteredRegistrations(filtered)
    setCurrentPage(1)
  }, [searchTerm, statusFilter, yearFilter, healthFilter, celiacFilter, noteFilter, registrations])

  const loadComprobante = async (registration) => {
    setLoadingComprobante(true)
    try {
      let url = ""

      if (registration.comprobantePagoUrl) {
        url = registration.comprobantePagoUrl
      } else if (registration.imagenBase64) {
        url = registration.imagenBase64
      }

      setComprobanteUrl(url)
      return url
    } catch (error) {
      console.error("Error cargando comprobante:", error)
      setComprobanteUrl("")
      return ""
    } finally {
      setLoadingComprobante(false)
    }
  }

  const isPDF = (url) => {
    if (!url) return false
    // Check if it's a base64 PDF
    if (url.startsWith("data:application/pdf")) return true
    // Check if it's a URL ending in .pdf
    if (url.toLowerCase().includes(".pdf")) return true
    // Check if base64 string contains PDF header
    if (url.includes("JVBERi0")) return true // PDF magic number in base64
    return false
  }

  const handleMouseDown = (e) => {
    if (zoomedImage) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - zoomPosition.x,
        y: e.clientY - zoomPosition.y,
      })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && zoomedImage) {
      setZoomPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const openDetailsModal = async (registration) => {
    setSelectedRegistration(registration)
    setNewStatus(registration.estado || "pendiente")
    setStatusNote(registration.nota || "")
    setIsDetailsModalOpen(true)
    await loadComprobante(registration)
  }

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedRegistration(null)
    setNewStatus("")
    setStatusNote("")
    setComprobanteUrl("")
  }

  const openImageModal = () => {
    setIsImageModalOpen(true)
  }

  const closeImageModal = () => {
    setIsImageModalOpen(false)
    // Don't automatically close details modal - let user decide
  }

  const sendConfirmationEmail = async (participant) => {
    if (!participant || !participant.email) {
      console.error("No se puede enviar email: información del participante incompleta")
      return false
    }

    setSendingEmail(true)
    try {
      const templateParams = {
        nombre: participant.nombre || "",
        apellido: participant.apellido || "",
        dni: participant.dni || "",
        email: participant.email,
        telefono: participant.telefono || "",
        localidad: participant.localidad || "",
        genero: participant.genero || "",
        talleRemera: (participant.talleRemera || "").toUpperCase(), // Convertir a mayúsculas
        fechaInscripcion: participant.fechaInscripcion?.toLocaleDateString("es-ES") || "",
      }

      const response = await emailjs.send("default_service", "template_2fg4bhx", templateParams)

      console.log("Email enviado con éxito:", response)
      return true
    } catch (error) {
      console.error("Error al enviar el correo de confirmación:", error)
      return false
    } finally {
      setSendingEmail(false)
    }
  }

  const updateRegistrationStatus = async () => {
    if (!selectedRegistration) return

    setUpdatingStatus(true)
    try {
      const registrationRef = doc(db, "participantes2025", selectedRegistration.id)
      const updateData = {
        estado: newStatus,
        nota: statusNote,
        fechaActualizacion: new Date(),
      }

      await updateDoc(registrationRef, updateData)

      if (newStatus === "confirmado" && selectedRegistration.estado !== "confirmado") {
        const emailSent = await sendConfirmationEmail(selectedRegistration)
        if (emailSent) {
          await updateDoc(registrationRef, {
            emailEnviado: true,
            fechaEmailEnviado: new Date(),
          })
        }
      }

      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.id === selectedRegistration.id
            ? {
                ...reg,
                ...updateData,
                fechaActualizacion: new Date(),
                emailEnviado: newStatus === "confirmado" ? true : reg.emailEnviado,
              }
            : reg,
        ),
      )

      alert(
        "Estado actualizado correctamente" +
          (newStatus === "confirmado" && selectedRegistration.estado !== "confirmado"
            ? " y correo de confirmación enviado"
            : ""),
      )
      closeDetailsModal()
    } catch (error) {
      console.error("Error updating registration:", error)
      alert("Error al actualizar el estado")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const exportApprovedToPDF = () => {
    const approvedRegistrations = registrations
      .filter((reg) => reg.estado === "confirmado")
      .sort((a, b) => {
        // Ordenar por número de inscripción ascendente para el PDF
        const aNum = a.numeroInscripcion || 0
        const bNum = b.numeroInscripcion || 0
        return aNum - bNum
      })

    const gruposBici = {}
    const celiacos = { si: 0, no: 0 }

    approvedRegistrations.forEach((reg) => {
      const grupoBici = (
        reg.grupoCiclistas ||
        reg.grupoBici ||
        reg.grupo_bici ||
        reg.grupobici ||
        reg.grupo ||
        "Sin especificar"
      ).trim()

      gruposBici[grupoBici] = (gruposBici[grupoBici] || 0) + 1

      const healthInfo = parseHealthConditions(reg.condicionSalud)
      celiacos[healthInfo.esCeliaco] = (celiacos[healthInfo.esCeliaco] || 0) + 1
    })

    const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Lista de Participantes Confirmados</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 20px;
        font-size: 12px;
        color: #333;
        background-color: #f9fafb;
      }
      h1, h2, h3 {
        color: #4f46e5;
        text-align: center;
        margin-bottom: 0.5em;
      }
      .header {
        text-align: center;
        margin-bottom: 20px;
        padding: 20px;
        background: linear-gradient(to right, #6366f1, #8b5cf6);
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }
      .header h2 {
        color: white;
        font-size: 24px;
        margin: 0;
      }
      .header p {
        margin: 5px 0 0;
        opacity: 0.9;
      }
      .summary {
        margin-bottom: 20px;
        border: 1px solid #e5e7eb;
        padding: 15px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      }
      .summary h3 {
        color: #4f46e5;
        text-align: left;
        margin-top: 0;
        font-size: 16px;
      }
      .summary p {
        margin: 8px 0;
      }
      .summary strong {
        color: #4f46e5;
      }
      .celiac-info {
        background-color: #fef3c7;
        border: 1px solid #f59e0b;
        padding: 10px;
        border-radius: 6px;
        margin: 10px 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        font-size: 11px;
        background-color: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      }
      th, td {
        border: 1px solid #e5e7eb;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f3f4f6;
        font-weight: bold;
        color: #4b5563;
      }
      th:first-child, td:first-child {
        text-align: center;
        width: 40px;
      }
      tr:nth-child(even) {
        background-color: #f9fafb;
      }
      tr:hover {
        background-color: #eff6ff;
      }
      .celiac-yes {
        background-color: #fef3c7 !important;
        font-weight: bold;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        font-size: 10px;
        color: #6b7280;
      }
      @media print {
        body { background-color: white; }
        .no-break { page-break-inside: avoid; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        .header, .summary, table {
          box-shadow: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h2>Lista de Participantes</h2>
      <p>Fecha de generación: ${new Date().toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}</p>
    </div>

    <div class="summary">
      <h3>Resumen</h3>
      <p>Total de participantes confirmados: <strong>${approvedRegistrations.length}</strong></p>

      <div class="celiac-info">
        <p><strong>Información sobre celíacos:</strong></p>
        <p>• Celíacos: <strong>${celiacos.si || 0}</strong> participantes</p>
      </div>

      ${
        Object.keys(gruposBici).length > 0
          ? `<p>Distribución por grupo de ciclistas:</p>
             <ul>${Object.entries(gruposBici)
               .map(
                 ([grupo, cantidad]) =>
                   `<li><strong>${grupo}</strong>: ${cantidad} participante${cantidad !== 1 ? "s" : ""}</li>`,
               )
               .join("")}</ul>`
          : "<p>No hay información de grupos de ciclistas disponible</p>"
      }
    </div>

    <table>
      <thead>
        <tr>
          <th>N°</th>
          <th>Apellido y Nombre</th>
          <th>DNI</th>
          <th>Teléfono</th>
          <th>Tel. Emergencia</th>
          <th>Grupo Sanguíneo</th>
          <th>Grupo Bici</th>
          <th>Localidad</th>
          <th>Talle</th>
          <th>Celíaco</th>
          <th>Condiciones de Salud</th>
        </tr>
      </thead>
      <tbody>
        ${approvedRegistrations
          .map((reg) => {
            const grupoBici = reg.grupoCiclistas || reg.grupoBici || reg.grupo_bici || reg.grupobici || reg.grupo || ""
            const healthInfo = parseHealthConditions(reg.condicionSalud)
            const telefonoEmergencia =
              reg.telefonoEmergencia || reg.telefono_emergencia || reg.telEmergencia || reg.telefonoContacto || ""
            const grupoSanguineo = reg.grupoSanguineo || reg.grupo_sanguineo || reg.gruposanguineo || reg.sangre || ""

            return `
          <tr ${healthInfo.esCeliaco === "si" ? 'class="celiac-yes"' : ""}>
            <td>${reg.numeroInscripcion || "-"}</td>
            <td><strong>${reg.apellido || ""}, ${reg.nombre || ""}</strong></td>
            <td>${reg.dni || ""}</td>
            <td>${reg.telefono || ""}</td>
            <td>${telefonoEmergencia}</td>
            <td>${grupoSanguineo}</td>
            <td>${grupoBici}</td>
            <td>${reg.localidad || ""}</td>
            <td style="text-transform: uppercase;">${reg.talleRemera || ""}</td>
            <td style="font-weight: bold; color: ${healthInfo.esCeliaco === "si" ? "#d97706" : "#059669"};">
              ${healthInfo.esCeliaco === "si" ? "SÍ" : "NO"}
            </td>
            <td>${healthInfo.condicionesSalud || "-"}</td>
          </tr>
        `
          })
          .join("")}
      </tbody>
    </table>

    <div class="footer">
      <p>Este documento es confidencial y contiene información personal de los participantes.</p>
      <p>Generado automáticamente desde el sistema de administración de inscripciones.</p>
    </div>
  </body>
  </html>
  `

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `participantes_confirmados_${new Date().toISOString().split("T")[0]}.html`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const formatCapitalization = (text) => {
    if (!text) return text
    return text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const enterEditMode = () => {
    if (selectedRegistration) {
      setEditFormData({
        nombre: selectedRegistration.nombre || "",
        apellido: selectedRegistration.apellido || "",
        dni: selectedRegistration.dni || "",
        email: selectedRegistration.email || "",
        telefono: selectedRegistration.telefono || "",
        localidad: selectedRegistration.localidad || "",
        numeroInscripcion: selectedRegistration.numeroInscripcion || "",
        fechaNacimiento: selectedRegistration.fechaNacimiento || "",
        genero: selectedRegistration.genero || "",
        telefonoEmergencia: selectedRegistration.telefonoEmergencia || "",
        talleRemera: selectedRegistration.talleRemera || "",
        grupoSanguineo: selectedRegistration.grupoSanguineo || "",
        grupoCiclistas: selectedRegistration.grupoCiclistas || "",
        condicionSalud: selectedRegistration.condicionSalud || "",
        transferidoA: selectedRegistration.transferidoA || "",
        precio: selectedRegistration.precio || "",
      })
      setIsEditMode(true)
    }
  }

  const cancelEdit = () => {
    setIsEditMode(false)
    setEditFormData({})
    setNewComprobanteFile(null)
  }

  const saveEdit = async () => {
    try {
      const formattedData = {
        ...editFormData,
        nombre: formatCapitalization(editFormData.nombre),
        apellido: formatCapitalization(editFormData.apellido),
        localidad: formatCapitalization(editFormData.localidad),
        email: editFormData.email.toLowerCase(),
        grupoCiclistas: formatCapitalization(editFormData.grupoCiclistas),
      }

      const registrationRef = doc(db, "participantes2025", selectedRegistration.id)

      // Handle comprobante upload if new file selected
      const updateData = { ...formattedData }
      if (newComprobanteFile) {
        // Convert file to base64 for storage
        const reader = new FileReader()
        const base64Promise = new Promise((resolve) => {
          reader.onload = () => resolve(reader.result)
          reader.readAsDataURL(newComprobanteFile)
        })

        const base64Data = await base64Promise
        updateData.imagenBase64 = base64Data
        updateData.comprobantePagoUrl = base64Data
      }

      await updateDoc(registrationRef, {
        ...updateData,
        fechaActualizacion: new Date(),
      })

      // Update local state
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.id === selectedRegistration.id ? { ...reg, ...updateData, fechaActualizacion: new Date() } : reg,
        ),
      )

      setSelectedRegistration({ ...selectedRegistration, ...updateData })
      setIsEditMode(false)
      setEditFormData({})
      setNewComprobanteFile(null)

      toast({
        title: "Éxito",
        description: "Los datos han sido actualizados correctamente",
      })
    } catch (error) {
      console.error("Error updating registration:", error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmado":
        return (
          <Badge className="bg-green-600 hover:bg-green-700 text-white border-0 text-xs px-2 py-1">
            <CheckCircle className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Confirmado</span>
          </Badge>
        )
      case "pendiente":
        return (
          <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white border-0 text-xs px-2 py-1">
            <Clock className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Pendiente</span>
          </Badge>
        )
      case "rechazado":
        return (
          <Badge className="bg-red-600 hover:bg-red-700 text-white border-0 text-xs px-2 py-1">
            <XCircle className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Rechazado</span>
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-600 hover:bg-gray-700 text-white border-0 text-xs px-2 py-1">
            <Clock className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Pendiente</span>
          </Badge>
        )
    }
  }

  const getStatistics = () => {
    const total = registrations.length
    const confirmados = registrations.filter((reg) => reg.estado === "confirmado").length
    const pendientes = registrations.filter((reg) => reg.estado === "pendiente" || !reg.estado).length
    const rechazados = registrations.filter((reg) => reg.estado === "rechazado").length

    return { total, confirmados, pendientes, rechazados }
  }

  const clearAllFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setYearFilter("all")
    setHealthFilter("all")
    setCeliacFilter("all")
    setNoteFilter("all")
    setTransferFilter("all")
  }

  const stats = getStatistics()

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredRegistrations.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage)

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div ref={topRef} className="flex flex-col items-center justify-center mt-6 mb-6 px-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Inscripciones
            </h1>
            <p className="text-muted-foreground mt-2 text-center text-sm">
              Cargando todos los datos de inscripciones...
            </p>
          </div>

          <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2 px-3 pt-3">
                  <Skeleton className="h-3 w-16" />
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <Skeleton className="h-6 w-12 mb-2" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="px-3 py-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </CardHeader>
            <CardContent className="px-3">
              <div className="flex flex-col gap-3 mb-4">
                <Skeleton className="h-9 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
              <Skeleton className="h-[300px] w-full rounded-md" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-2 md:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          ref={topRef}
          className="flex flex-col items-center justify-center mt-4 mb-6 px-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Inscripciones
          </h1>
          <p className="text-muted-foreground mt-2 text-center max-w-xl text-sm md:text-base">
            Gestión de participantes {new Date().getFullYear()}
          </p>
        </motion.div>

        {/* Navigation and Actions */}
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 shadow-sm hover:shadow-md transition-all text-xs bg-transparent"
              >
                <Home className="h-3 w-3" />
                <span className="hidden sm:inline">Volver al inicio</span>
                <span className="sm:hidden">Inicio</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 shadow-sm hover:shadow-md transition-all text-xs ${
                refreshing ? "opacity-70" : ""
              }`}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{refreshing ? "Actualizando..." : "Actualizar"}</span>
              <span className="sm:hidden">{refreshing ? "..." : "Actualizar"}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full sm:w-32 bg-white text-xs h-8">
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  <SelectValue placeholder="Año" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 shadow-sm hover:shadow-md transition-all text-xs h-8 bg-transparent"
              onClick={exportApprovedToPDF}
              disabled={registrations.filter((r) => r.estado === "confirmado").length === 0}
            >
              <FileText className="h-3 w-3" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards - Compact Mobile Version */}
        <div className="grid gap-2 grid-cols-2 md:grid-cols-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="overflow-hidden border border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
              <CardHeader className="pb-1 px-2 pt-2 md:px-3 md:pt-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xs font-medium text-indigo-900">Total</CardTitle>
                    <CardDescription className="text-xs">Inscripciones</CardDescription>
                  </div>
                  <div className="p-1 rounded-full bg-indigo-50">
                    <Users className="h-3 w-3 text-indigo-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-2 md:px-3 md:pb-3">
                <div className="flex items-baseline gap-1">
                  <div className="text-lg md:text-xl font-bold text-indigo-900">{stats.total}</div>
                </div>
                <div className="mt-2">
                  <Progress
                    value={100}
                    className="h-1"
                    indicatorClassName="bg-gradient-to-r from-indigo-500 to-indigo-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="overflow-hidden border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
              <CardHeader className="pb-1 px-2 pt-2 md:px-3 md:pt-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xs font-medium text-emerald-900">Confirmados</CardTitle>
                    <CardDescription className="text-xs">Aprobados</CardDescription>
                  </div>
                  <div className="p-1 rounded-full bg-emerald-50">
                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-2 md:px-3 md:pb-3">
                <div className="flex items-baseline gap-1">
                  <div className="text-lg md:text-xl font-bold text-emerald-900">{stats.confirmados}</div>
                  <div className="text-xs text-emerald-600">
                    {stats.total > 0 ? Math.round((stats.confirmados / stats.total) * 100) : 0}%
                  </div>
                </div>
                <div className="mt-2">
                  <Progress
                    value={stats.total > 0 ? (stats.confirmados / stats.total) * 100 : 0}
                    className="h-1"
                    indicatorClassName="bg-gradient-to-r from-emerald-500 to-emerald-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="overflow-hidden border border-amber-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
              <CardHeader className="pb-1 px-2 pt-2 md:px-3 md:pt-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xs font-medium text-amber-900">Pendientes</CardTitle>
                    <CardDescription className="text-xs">En revisión</CardDescription>
                  </div>
                  <div className="p-1 rounded-full bg-amber-50">
                    <Clock className="h-3 w-3 text-amber-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-2 md:px-3 md:pb-3">
                <div className="flex items-baseline gap-1">
                  <div className="text-lg md:text-xl font-bold text-amber-900">{stats.pendientes}</div>
                  <div className="text-xs text-amber-600">
                    {stats.total > 0 ? Math.round((stats.pendientes / stats.total) * 100) : 0}%
                  </div>
                </div>
                <div className="mt-2">
                  <Progress
                    value={stats.total > 0 ? (stats.pendientes / stats.total) * 100 : 0}
                    className="h-1"
                    indicatorClassName="bg-gradient-to-r from-amber-500 to-amber-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="overflow-hidden border border-rose-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-rose-600"></div>
              <CardHeader className="pb-1 px-2 pt-2 md:px-3 md:pt-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xs font-medium text-rose-900">Rechazados</CardTitle>
                    <CardDescription className="text-xs">No aprobados</CardDescription>
                  </div>
                  <div className="p-1 rounded-full bg-rose-50">
                    <XCircle className="h-3 w-3 text-rose-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-2 md:px-3 md:pb-3">
                <div className="flex items-baseline gap-1">
                  <div className="text-lg md:text-xl font-bold text-rose-900">{stats.rechazados}</div>
                  <div className="text-xs text-rose-600">
                    {stats.total > 0 ? Math.round((stats.rechazados / stats.total) * 100) : 0}%
                  </div>
                </div>
                <div className="mt-2">
                  <Progress
                    value={stats.total > 0 ? (stats.rechazados / stats.total) * 100 : 0}
                    className="h-1"
                    indicatorClassName="bg-gradient-to-r from-rose-500 to-rose-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 overflow-hidden bg-white">
            <CardHeader className="border-b bg-gray-50/50 pb-3 px-3 pt-3">
              <div className="flex flex-col gap-3">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    Lista de Inscripciones
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredRegistrations.length)} de{" "}
                    {filteredRegistrations.length} inscripciones
                    {filteredRegistrations.length !== registrations.length
                      ? ` (filtrado de ${registrations.length} total)`
                      : ""}
                  </CardDescription>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, apellido, DNI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 bg-white text-xs h-8"
                  />
                </div>

                {/* Mobile Filters Toggle */}
                <div className="md:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full flex items-center justify-between text-xs h-8"
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="h-3 w-3" />
                      Filtros
                    </div>
                    {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </div>

                {/* Filters - Hidden on mobile unless toggled */}
                <div className={`${showFilters ? "block" : "hidden"} md:block`}>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-white text-xs h-8">
                        <ClipboardList className="h-4 w-4 mr-1" />
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Estado</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="confirmado">Confirmado</SelectItem>
                        <SelectItem value="rechazado">Rechazado</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={healthFilter} onValueChange={setHealthFilter}>
                      <SelectTrigger className="bg-white text-xs h-8">
                        <Stethoscope className="h-4 w-4 mr-1" />
                        <SelectValue placeholder="Cond. médicas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Salud</SelectItem>
                        <SelectItem value="with_conditions">Con cod. medicas</SelectItem>
                        <SelectItem value="without_conditions">Sin cod. medicas</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={celiacFilter} onValueChange={setCeliacFilter}>
                      <SelectTrigger className="bg-white text-xs h-8">
                        <WheatOff className="h-4 w-4 mr-1" />
                        <SelectValue placeholder="Celíacos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Celiacos</SelectItem>
                        <SelectItem value="si">Celiacos</SelectItem>
                        <SelectItem value="no">No celiacos</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={noteFilter} onValueChange={setNoteFilter}>
                      <SelectTrigger className="bg-white text-xs h-8">
                        <NotebookPen className="h-4 w-4 mr-1" />
                        <SelectValue placeholder="Notas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Notas</SelectItem>
                        <SelectItem value="with_notes">Con Notas</SelectItem>
                        <SelectItem value="without_notes">Sin Notas</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={transferFilter} onValueChange={setTransferFilter}>
                      <SelectTrigger className="bg-white text-xs h-8">
                        <ArrowRightLeft className="h-4 w-4 mr-1" />
                        <SelectValue placeholder="Transfirió a" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Transfirió a</SelectItem>
                        <SelectItem value="Gise">Gise</SelectItem>
                        <SelectItem value="Bruni">Bruni</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="col-span-2 md:col-span-2 lg:col-span-2">
                      {(searchTerm ||
                        statusFilter !== "all" ||
                        yearFilter !== "all" ||
                        healthFilter !== "all" ||
                        celiacFilter !== "all" ||
                        noteFilter !== "all" ||
                        transferFilter !== "all") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearAllFilters}
                          className="w-full flex items-center gap-1 text-xs h-8 bg-transparent"
                        >
                          <FilterX className="h-3 w-3" />
                          Limpiar filtros
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {filteredRegistrations.length > 0 ? (
                <div className="rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 hover:bg-gray-50">
                        <TableHead className="font-semibold w-12 text-center text-xs">
                          <div className="flex items-center justify-center">#</div>
                        </TableHead>
                        <TableHead className="font-semibold text-xs">Nombre</TableHead>
                        <TableHead className="font-semibold text-xs hidden md:table-cell">Apellido</TableHead>
                        <TableHead className="font-semibold text-xs hidden md:table-cell">DNI</TableHead>
                        <TableHead className="font-semibold text-xs hidden md:table-cell">Email</TableHead>
                        <TableHead className="font-semibold text-xs hidden md:table-cell">Teléfono</TableHead>
                        <TableHead className="font-semibold text-xs hidden md:table-cell">Localidad</TableHead>
                        <TableHead className="font-semibold text-xs">Estado</TableHead>
                        <TableHead className="text-right font-semibold text-xs">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.map((registration, index) => {
                        return (
                          <TableRow key={registration.id} className="hover:bg-gray-50/80 transition-colors border-b">
                            <TableCell className="font-medium text-center text-gray-500 text-xs">
                              {registration.numeroInscripcion || indexOfFirstItem + index + 1}
                            </TableCell>
                            <TableCell className="font-medium text-xs">
                              <div className="md:hidden">
                                <div className="font-medium">{registration.nombre || "-"}</div>
                                <div className="text-xs text-gray-500">{registration.apellido || "-"}</div>
                              </div>
                              <div className="hidden md:block">{registration.nombre || "-"}</div>
                            </TableCell>
                            <TableCell className="text-xs hidden md:table-cell">
                              {registration.apellido || "-"}
                            </TableCell>
                            <TableCell className="text-xs hidden md:table-cell">{registration.dni || "-"}</TableCell>
                            <TableCell className="text-xs hidden md:table-cell">{registration.email || "-"}</TableCell>
                            <TableCell className="text-xs hidden md:table-cell">
                              {registration.telefono || "-"}
                            </TableCell>
                            <TableCell className="text-xs hidden md:table-cell">
                              {registration.localidad || "-"}
                            </TableCell>
                            <TableCell>{getStatusBadge(registration.estado)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDetailsModal(registration)}
                                className="hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-xs h-7 px-2"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <Users className="h-8 w-8 text-gray-300 mb-3" />
                  <p className="text-muted-foreground text-center mb-2 text-sm">
                    {searchTerm ||
                    statusFilter !== "all" ||
                    yearFilter !== "all" ||
                    healthFilter !== "all" ||
                    celiacFilter !== "all" ||
                    noteFilter !== "all"
                      ? "No se encontraron inscripciones con los filtros aplicados"
                      : "No hay inscripciones registradas"}
                  </p>
                  {(searchTerm ||
                    statusFilter !== "all" ||
                    yearFilter !== "all" ||
                    healthFilter !== "all" ||
                    celiacFilter !== "all" ||
                    noteFilter !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                      className="mt-2 text-xs bg-transparent"
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
            {filteredRegistrations.length > itemsPerPage && (
              <CardFooter className="border-t bg-gray-50/50 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-xs text-muted-foreground order-2 sm:order-1">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex items-center gap-1 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 3) {
                        pageNum = i + 1
                      } else if (currentPage <= 2) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 1) {
                        pageNum = totalPages - 2 + i
                      } else {
                        pageNum = currentPage - 1 + i
                      }

                      return (
                        <Button
                          key={i}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => paginate(pageNum)}
                          className={`h-7 w-7 p-0 text-xs ${
                            currentPage === pageNum
                              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                              : "hover:bg-indigo-50 hover:text-indigo-600"
                          }`}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
                <div className="order-3 sm:order-3 w-full sm:w-auto">
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[100px] h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="150">150</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardFooter>
            )}
          </Card>
        </motion.div>

        {/* Scroll to top button */}
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={scrollToTop}
            variant="default"
            size="icon"
            className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-10 w-10"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Details Modal - Mobile Optimized with ALL DATA */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                {isEditMode ? "Editar Inscripción" : "Detalles Completos de Inscripción"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {isEditMode ? "Modifica la información del participante" : "Información completa del participante"}
              </DialogDescription>
            </DialogHeader>

            {selectedRegistration && (
              <div className="space-y-4">
                {/* Información Personal */}
                <Card className="border border-indigo-200 shadow-sm">
                  <CardHeader className="pb-2 bg-indigo-50/50 px-3 py-2">
                    <CardTitle className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                      <User className="h-3 w-3" />
                      Información Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 px-3 pb-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Nombre</Label>
                        {isEditMode ? (
                          <Input
                            value={editFormData.nombre}
                            onChange={(e) => setEditFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                            className="text-sm mt-1"
                          />
                        ) : (
                          <p className="text-sm font-medium">{selectedRegistration.nombre}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Apellido</Label>
                        {isEditMode ? (
                          <Input
                            value={editFormData.apellido}
                            onChange={(e) => setEditFormData((prev) => ({ ...prev, apellido: e.target.value }))}
                            className="text-sm mt-1"
                          />
                        ) : (
                          <p className="text-sm font-medium">{selectedRegistration.apellido}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">DNI</Label>
                        {isEditMode ? (
                          <Input
                            value={editFormData.dni}
                            onChange={(e) => setEditFormData((prev) => ({ ...prev, dni: e.target.value }))}
                            className="text-sm mt-1"
                          />
                        ) : (
                          <p className="text-sm">{selectedRegistration.dni || "-"}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Fecha de Nacimiento
                        </Label>
                        {isEditMode ? (
                          <Input
                            type="date"
                            value={editFormData.fechaNacimiento}
                            onChange={(e) => setEditFormData((prev) => ({ ...prev, fechaNacimiento: e.target.value }))}
                            className="text-sm mt-1"
                          />
                        ) : (
                          <p className="text-sm">{selectedRegistration.fechaNacimiento || "-"}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Género</Label>
                        {isEditMode ? (
                          <Select
                            value={editFormData.genero}
                            onValueChange={(value) => setEditFormData((prev) => ({ ...prev, genero: value }))}
                          >
                            <SelectTrigger className="text-sm mt-1">
                              <SelectValue placeholder="Seleccionar género" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="masculino">Masculino</SelectItem>
                              <SelectItem value="femenino">Femenino</SelectItem>
                              <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm capitalize">{selectedRegistration.genero || "-"}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Número de Inscripción</Label>
                        {isEditMode ? (
                          <Input
                            value={editFormData.numeroInscripcion}
                            onChange={(e) =>
                              setEditFormData((prev) => ({ ...prev, numeroInscripcion: e.target.value }))
                            }
                            className="text-sm mt-1"
                          />
                        ) : (
                          <p className="text-sm font-bold text-indigo-600">
                            #{selectedRegistration.numeroInscripcion || "-"}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Información de Contacto */}
                <Card className="border border-indigo-200 shadow-sm">
                  <CardHeader className="pb-2 bg-indigo-50/50 px-3 py-2">
                    <CardTitle className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      Información de Contacto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 px-3 pb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Email</Label>
                        {isEditMode ? (
                          <Input
                            type="email"
                            value={editFormData.email}
                            onChange={(e) => setEditFormData((prev) => ({ ...prev, email: e.target.value }))}
                            className="text-sm mt-1"
                          />
                        ) : (
                          <p className="text-sm break-words">{selectedRegistration.email || "-"}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Localidad
                        </Label>
                        {isEditMode ? (
                          <Input
                            value={editFormData.localidad}
                            onChange={(e) => setEditFormData((prev) => ({ ...prev, localidad: e.target.value }))}
                            className="text-sm mt-1"
                          />
                        ) : (
                          <p className="text-sm">{selectedRegistration.localidad || "-"}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Teléfono
                        </Label>
                        {isEditMode ? (
                          <Input
                            value={editFormData.telefono}
                            onChange={(e) => setEditFormData((prev) => ({ ...prev, telefono: e.target.value }))}
                            className="text-sm mt-1"
                          />
                        ) : (
                          <p className="text-sm">
                            {selectedRegistration.telefono || "-"}
                            {selectedRegistration.paisTelefono && selectedRegistration.paisTelefono !== "Argentina" && (
                              <span className="text-xs text-gray-400 ml-1">({selectedRegistration.paisTelefono})</span>
                            )}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Teléfono de Emergencia
                        </Label>
                        {isEditMode ? (
                          <Input
                            value={editFormData.telefonoEmergencia}
                            onChange={(e) =>
                              setEditFormData((prev) => ({ ...prev, telefonoEmergencia: e.target.value }))
                            }
                            className="text-sm mt-1"
                          />
                        ) : (
                          <p className="text-sm">
                            {selectedRegistration.telefonoEmergencia || "-"}
                            {selectedRegistration.paisTelefonoEmergencia &&
                              selectedRegistration.paisTelefonoEmergencia !== "Argentina" && (
                                <span className="text-xs text-gray-400 ml-1">
                                  ({selectedRegistration.paisTelefonoEmergencia})
                                </span>
                              )}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Otros Datos */}
                <Card className="border border-indigo-200 shadow-sm">
                  <CardHeader className="pb-2 bg-indigo-50/50 px-3 py-2">
                    <CardTitle className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                      <ClipboardList className="h-3 w-3" />
                      Otros Datos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 px-3 pb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Talle de Remera</Label>
                        {isEditMode ? (
                          <Select
                            value={editFormData.talleRemera}
                            onValueChange={(value) => setEditFormData((prev) => ({ ...prev, talleRemera: value }))}
                          >
                            <SelectTrigger className="text-sm mt-1">
                              <SelectValue placeholder="Seleccionar talle" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="xs">XS</SelectItem>
                              <SelectItem value="s">S</SelectItem>
                              <SelectItem value="m">M</SelectItem>
                              <SelectItem value="l">L</SelectItem>
                              <SelectItem value="xl">XL</SelectItem>
                              <SelectItem value="xxl">XXL</SelectItem>
                              <SelectItem value="xxxl">XXXL</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm uppercase">{selectedRegistration.talleRemera || "-"}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Grupo Sanguíneo</Label>
                        {isEditMode ? (
                          <Input
                            value={editFormData.grupoSanguineo}
                            onChange={(e) => setEditFormData((prev) => ({ ...prev, grupoSanguineo: e.target.value }))}
                            className="text-sm mt-1"
                          />
                        ) : (
                          <p className="text-sm">{selectedRegistration.grupoSanguineo || "-"}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-3 mt-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Grupo de Ciclistas</Label>
                        {isEditMode ? (
                          <Input
                            value={editFormData.grupoCiclistas}
                            onChange={(e) => setEditFormData((prev) => ({ ...prev, grupoCiclistas: e.target.value }))}
                            className="text-sm mt-1"
                          />
                        ) : (
                          <p className="text-sm">{selectedRegistration.grupoCiclistas || "-"}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Información de Salud */}
                <Card className="border border-indigo-200 shadow-sm">
                  <CardHeader className="pb-2 bg-indigo-50/50 px-3 py-2">
                    <CardTitle className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                      <Stethoscope className="h-3 w-3" />
                      Información de Salud
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 px-3 pb-3">
                    {(() => {
                      // En modo edición, parseamos desde editFormData, sino desde selectedRegistration
                      const healthInfo = isEditMode 
                        ? parseHealthConditions(editFormData.condicionSalud)
                        : parseHealthConditions(selectedRegistration.condicionSalud)
                      return (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs font-medium text-gray-500">¿Es celíaco?</Label>
                            {isEditMode ? (
                              <select
                                value={healthInfo.esCeliaco || "no"}
                                onChange={(e) => {
                                  const updatedHealthInfo = {
                                    ...healthInfo,
                                    esCeliaco: e.target.value
                                  }
                                  setEditFormData((prev) => ({ 
                                    ...prev, 
                                    condicionSalud: JSON.stringify(updatedHealthInfo)
                                  }))
                                }}
                                className="text-sm mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="no">No</option>
                                <option value="si">Sí</option>
                              </select>
                            ) : (
                              <p
                                className={`text-sm font-medium ${
                                  healthInfo.esCeliaco === "si" ? "text-amber-600" : "text-green-600"
                                }`}
                              >
                                {healthInfo.esCeliaco === "si" ? "Sí" : "No"}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-500">
                              Condiciones de salud y medicamentos
                            </Label>
                            {isEditMode ? (
                              <textarea
                                value={healthInfo.condicionesSalud || ""}
                                onChange={(e) => {
                                  const updatedHealthInfo = {
                                    ...healthInfo,
                                    condicionesSalud: e.target.value
                                  }
                                  setEditFormData((prev) => ({ 
                                    ...prev, 
                                    condicionSalud: JSON.stringify(updatedHealthInfo)
                                  }))
                                }}
                                className="text-sm mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 min-h-[60px] resize-vertical"
                                placeholder="Sin condiciones especiales reportadas"
                              />
                            ) : (
                              <p className="text-sm bg-gray-50 p-2 rounded border min-h-[40px]">
                                {healthInfo.condicionesSalud || "Sin condiciones especiales reportadas"}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>

                {/* Comprobante de Pago */}
                <Card className="border border-indigo-200 shadow-sm">
                  <CardHeader className="pb-2 bg-indigo-50/50 px-3 py-2">
                    <CardTitle className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Comprobante de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 px-3 pb-3">
                    {isEditMode ? (
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Subir nuevo comprobante</Label>
                        <Input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => setNewComprobanteFile(e.target.files[0])}
                          className="text-sm mt-1"
                        />
                        {newComprobanteFile && (
                          <p className="text-xs text-gray-500 mt-2">Archivo seleccionado: {newComprobanteFile.name}</p>
                        )}
                      </div>
                    ) : (
                      <>
                        {loadingComprobante ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                            <span className="ml-2 text-sm text-gray-500">Cargando comprobante...</span>
                          </div>
                        ) : comprobanteUrl ? (
                          <div className="flex flex-col items-center justify-center">
                            {isPDF(comprobanteUrl) ? (
                              <a
                                href={comprobanteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 text-sm"
                              >
                                Ver comprobante (PDF)
                              </a>
                            ) : (
                              <>
                                <img
                                  src={comprobanteUrl || "/placeholder.svg"}
                                  alt="Comprobante de Pago"
                                  className="max-h-64 max-w-full rounded-md shadow-md cursor-zoom-in"
                                  onClick={openImageModal}
                                />
                                <Button variant="link" size="sm" onClick={openImageModal} className="text-xs mt-2">
                                  Ampliar imagen
                                </Button>
                              </>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No hay comprobante disponible</p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-indigo-200 shadow-sm">
                  <CardHeader className="pb-2 bg-indigo-50/50 px-3 py-2">
                    <CardTitle className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                      <ArrowRightLeft className="h-3 w-3" />
                      Información de Transferencia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 px-3 pb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Transfirió a</Label>
                        {isEditMode ? (
                          <Select
                            value={editFormData.transferidoA}
                            onValueChange={(value) => setEditFormData((prev) => ({ ...prev, transferidoA: value }))}
                          >
                            <SelectTrigger className="text-sm mt-1">
                              <SelectValue placeholder="Seleccionar destinatario" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sin_especificar">Sin especificar</SelectItem>
                              <SelectItem value="Gise">Gise</SelectItem>
                              <SelectItem value="Bruni">Bruni</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm">{selectedRegistration.transferidoA || "-"}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Precio</Label>
                        {isEditMode ? (
                          <div className="space-y-2">
                            <Select
                              value={
                                editFormData.precio === "$25.000" || editFormData.precio === "$35.000"
                                  ? editFormData.precio
                                  : "manual"
                              }
                              onValueChange={(value) => {
                                if (value === "manual") {
                                  setEditFormData((prev) => ({ ...prev, precio: "" }))
                                } else {
                                  setEditFormData((prev) => ({ ...prev, precio: value }))
                                }
                              }}
                            >
                              <SelectTrigger className="text-sm mt-1">
                                <SelectValue placeholder="Seleccionar precio" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="$25.000">$25.000</SelectItem>
                                <SelectItem value="$35.000">$35.000</SelectItem>
                                <SelectItem value="manual">Agregar manual</SelectItem>
                              </SelectContent>
                            </Select>
                            {editFormData.precio !== "$25.000" && editFormData.precio !== "$35.000" && (
                              <Input
                                value={editFormData.precio}
                                onChange={(e) => setEditFormData((prev) => ({ ...prev, precio: e.target.value }))}
                                placeholder="Ingrese precio manual"
                                className="text-sm"
                              />
                            )}
                          </div>
                        ) : (
                          <p className="text-sm">{selectedRegistration.precio || "-"}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Estado y Notas */}
                <Card className="border border-indigo-200 shadow-sm">
                  <CardHeader className="pb-2 bg-indigo-50/50 px-3 py-2">
                    <CardTitle className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                      <Edit className="h-3 w-3" />
                      Estado y Notas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 px-3 pb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Estado</Label>
                        <Select value={newStatus} onValueChange={setNewStatus} disabled={isEditMode}>
                          <SelectTrigger className="text-sm mt-1">
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="confirmado">Confirmado</SelectItem>
                            <SelectItem value="rechazado">Rechazado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Nota</Label>
                        <Input
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          className="text-sm mt-1"
                          disabled={isEditMode}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <DialogFooter>
              {isEditMode ? (
                <div className="flex justify-between w-full">
                  <Button type="button" variant="ghost" onClick={cancelEdit}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={saveEdit}>
                    Guardar Cambios
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between w-full">
                  <Button type="button" variant="secondary" onClick={closeDetailsModal}>
                    Cerrar
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={enterEditMode}>
                      Editar
                    </Button>
                    <Button type="button" onClick={updateRegistrationStatus} disabled={updatingStatus || sendingEmail}>
                      {updatingStatus ? (
                        <>
                          Actualizando...
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        "Actualizar Estado"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Modal */}
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Comprobante de Pago</DialogTitle>
              <DialogDescription>
                {zoomedImage ? "Arrastra para mover, rueda para zoom" : "Hacé click para ampliar"}
              </DialogDescription>
            </DialogHeader>
            <div
              className="relative overflow-hidden rounded-md"
              style={{ height: "500px", backgroundColor: "#f0f0f0" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {comprobanteUrl && !isPDF(comprobanteUrl) ? (
                <motion.img
                  src={comprobanteUrl}
                  alt="Comprobante de Pago Ampliado"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "auto",
                    cursor: zoomedImage ? "grab" : "zoom-in",
                    x: zoomPosition.x,
                    y: zoomPosition.y,
                    scale: zoomedImage ? 2 : 1,
                    originX: 0,
                    originY: 0,
                  }}
                  onClick={() => setZoomedImage(!zoomedImage)}
                  transition={{ duration: 0.2 }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  {isPDF(comprobanteUrl) ? (
                    <a
                      href={comprobanteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      Ver comprobante (PDF)
                    </a>
                  ) : (
                    <p className="text-gray-500">No hay imagen disponible</p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  closeImageModal()
                  //closeDetailsModal()
                }}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
