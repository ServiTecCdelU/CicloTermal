"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { db } from "@/lib/firebase/firebase-config"
import { collection, getDocs, query, where } from "firebase/firestore"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import {
  Users,
  Home,
  HeartPulse,
  Shirt,
  Menu as Venus,
  Mails as Mars,
  PieChartIcon,
  Clock,
  CalendarDays,
  RefreshCw,
  Eye,
  WheatOff,
  UserCheck,
  UserCheck as UserClock,
  UsersIcon,
  ChevronDown,
  X,
  ArrowUp,
  Calendar,
  Activity,
  DollarSign,
  User,
  CreditCard,
} from "lucide-react"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Registration {
  id: string
  nombre?: string
  apellido?: string
  genero?: string
  talleRemera?: string
  fechaInscripcion: Date
  condicionSalud?: any
  year?: number
  estado?: string
  grupoCiclistas?: string
  [key: string]: any
}

interface CondicionSalud {
  tieneAlergias?: boolean
  tomaMedicamentos?: boolean
  tieneProblemasSalud?: boolean
  condicionesSalud?: string
  esCeliaco?: string
  [key: string]: any
}

interface JerseySize {
  xs: number
  s: number
  m: number
  l: number
  xl: number
  xxl: number
  xxxl: number
  [key: string]: number
}

interface JerseySizeByStatus {
  all: JerseySize
  confirmado: JerseySize
  pendiente: JerseySize
}

interface DashboardStats {
  totalRegistrations: number
  validRegistrations: number
  confirmedRegistrations: number
  pendingRegistrations: number
  maleCount: number
  femaleCount: number
  otherCount: number
  withHealthConditions: number
  celiacCount: number
  jerseySize: JerseySize
  jerseySizeByStatus: JerseySizeByStatus
  registrationsByDay: Array<{ date: string; total: number; rejected: number }>
  groupsCount: number
}

interface ChartDataItem {
  name: string
  value: number
}

interface PersonWithCondition {
  nombre: string
  apellido: string
  condicion: string
}

interface PersonCeliac {
  nombre: string
  apellido: string
}

interface GroupInfo {
  nombre: string
  cantidad: number
  participantes: string[]
}

// Paleta de colores moderna
const COLORS = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  accent: "#ec4899",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  background: "#f9fafb",
  cardBg: "#ffffff",
  textPrimary: "#111827",
  textSecondary: "#4b5563",
}

const GENDER_COLORS = ["#6366f1", "#ec4899", "#3b82f6"]
const JERSEY_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"]

const gradientColors = [
  { start: "#6366f1", end: "#8b5cf6" },
  { start: "#ec4899", end: "#f97316" },
  { start: "#10b981", end: "#3b82f6" },
  { start: "#f59e0b", end: "#ef4444" },
]

// Función para extraer información de condiciones de salud
const parseHealthConditions = (condicionSalud: any): CondicionSalud => {
  if (!condicionSalud) return { condicionesSalud: "", esCeliaco: "no" }

  if (typeof condicionSalud === "string" && condicionSalud.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(condicionSalud)
      return {
        condicionesSalud: parsed.condicionesSalud || parsed.condicionSalud || "",
        esCeliaco: parsed.esCeliaco || "no",
      }
    } catch (e) {
      return { condicionesSalud: condicionSalud, esCeliaco: "no" }
    }
  } else if (typeof condicionSalud === "object") {
    return {
      condicionesSalud: condicionSalud.condicionesSalud || condicionSalud.condicionSalud || "",
      esCeliaco: condicionSalud.esCeliaco || "no",
    }
  } else {
    return { condicionesSalud: condicionSalud || "", esCeliaco: "no" }
  }
}

export default function AdminDashboardPage() {
  const { eventSettings } = useFirebaseContext()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalRegistrations: 0,
    validRegistrations: 0,
    confirmedRegistrations: 0,
    pendingRegistrations: 0,
    maleCount: 0,
    femaleCount: 0,
    otherCount: 0,
    withHealthConditions: 0,
    celiacCount: 0,
    jerseySize: {
      xs: 0,
      s: 0,
      m: 0,
      l: 0,
      xl: 0,
      xxl: 0,
      xxxl: 0,
    },
    jerseySizeByStatus: {
      all: { xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0 },
      confirmado: { xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0 },
      pendiente: { xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0 },
    },
    registrationsByDay: [],
    groupsCount: 0,
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [timeFilter, setTimeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [activeStatsFilter, setActiveStatsFilter] = useState<string>("all")

  // Modal states
  const [healthConditionsModal, setHealthConditionsModal] = useState(false)
  const [celiacModal, setCeliacModal] = useState(false)
  const [jerseyModal, setJerseyModal] = useState(false)
  const [groupsModal, setGroupsModal] = useState(false)
  const [peopleWithConditions, setPeopleWithConditions] = useState<PersonWithCondition[]>([])
  const [celiacPeople, setCeliacPeople] = useState<PersonCeliac[]>([])
  const [groupsInfo, setGroupsInfo] = useState<GroupInfo[]>([])

  // Agregar estado para grupos expandidos
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())

  const [expenses, setExpenses] = useState([])
  const [loadingExpenses, setLoadingExpenses] = useState(true)

  const [showFinancialDetails, setShowFinancialDetails] = useState(false)

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const expensesRef = collection(db, "gastos2025")
        const expensesSnapshot = await getDocs(expensesRef)
        const expensesData = expensesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setExpenses(expensesData)
      } catch (error) {
        console.error("Error loading expenses:", error)
      } finally {
        setLoadingExpenses(false)
      }
    }

    loadExpenses()
  }, [])

  const toggleGroup = (index: number) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedGroups(newExpanded)
  }

  const topRef = useRef<HTMLDivElement>(null)

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchRegistrations()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const fetchRegistrations = async () => {
    try {
      const registrationsRef = collection(db, "participantes2025")
      const currentYearRegistrations = query(registrationsRef, where("year", "==", new Date().getFullYear()))
      const snapshot = await getDocs(currentYearRegistrations)

      const registrationsData: Registration[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        let fechaInscripcion: Date

        if (data.fechaInscripcion && typeof data.fechaInscripcion.toDate === "function") {
          fechaInscripcion = data.fechaInscripcion.toDate()
        } else if (data.fechaInscripcion instanceof Date) {
          fechaInscripcion = data.fechaInscripcion
        } else if (data.fechaInscripcion) {
          fechaInscripcion = new Date(data.fechaInscripcion)
        } else {
          fechaInscripcion = new Date()
        }

        return {
          id: doc.id,
          ...data,
          fechaInscripcion,
        }
      })

      setRegistrations(registrationsData)

      // Filtrar según el estado seleccionado
      let filteredForStats = registrationsData
      if (statusFilter === "confirmado") {
        filteredForStats = registrationsData.filter((reg) => reg.estado === "confirmado")
      } else if (statusFilter === "pendiente") {
        filteredForStats = registrationsData.filter((reg) => reg.estado === "pendiente" || !reg.estado)
      } else {
        // "all" - excluir solo rechazados
        filteredForStats = registrationsData.filter((reg) => reg.estado !== "rechazado")
      }

      const confirmedRegistrations = registrationsData.filter((reg) => reg.estado === "confirmado")
      const pendingRegistrations = registrationsData.filter((reg) => reg.estado === "pendiente" || !reg.estado)
      const validRegistrations = [...confirmedRegistrations, ...pendingRegistrations]

      const maleCount = filteredForStats.filter((reg) => reg.genero?.toLowerCase() === "masculino").length
      const femaleCount = filteredForStats.filter((reg) => reg.genero?.toLowerCase() === "femenino").length
      const otherCount = filteredForStats.filter(
        (reg) => reg.genero && reg.genero?.toLowerCase() !== "masculino" && reg.genero?.toLowerCase() !== "femenino",
      ).length

      let withHealthConditions = 0
      let celiacCount = 0
      const conditionsList: PersonWithCondition[] = []
      const celiacList: PersonCeliac[] = []

      filteredForStats.forEach((reg) => {
        try {
          const healthInfo = parseHealthConditions(reg.condicionSalud)

          // Contar celíacos
          if (healthInfo.esCeliaco === "si") {
            celiacCount++
            celiacList.push({
              nombre: reg.nombre || "",
              apellido: reg.apellido || "",
            })
          }

          // Contar condiciones médicas
          if (healthInfo.condicionesSalud && healthInfo.condicionesSalud.trim() !== "") {
            withHealthConditions++
            conditionsList.push({
              nombre: reg.nombre || "",
              apellido: reg.apellido || "",
              condicion: healthInfo.condicionesSalud,
            })
          }
        } catch (error) {
          console.error("Error al procesar condicionSalud:", error, reg.id)
        }
      })

      setPeopleWithConditions(conditionsList)
      setCeliacPeople(celiacList)

      // Calcular talles por estado
      const jerseySizeByStatus: JerseySizeByStatus = {
        all: { xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0 },
        confirmado: { xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0 },
        pendiente: { xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0 },
      }

      // Contar talles para todos (sin rechazados)
      validRegistrations.forEach((reg) => {
        if (reg.talleRemera) {
          const size = reg.talleRemera.toLowerCase() as keyof JerseySize
          if (jerseySizeByStatus.all.hasOwnProperty(size)) {
            jerseySizeByStatus.all[size]++
          }
        }
      })

      // Contar talles para confirmados
      confirmedRegistrations.forEach((reg) => {
        if (reg.talleRemera) {
          const size = reg.talleRemera.toLowerCase() as keyof JerseySize
          if (jerseySizeByStatus.confirmado.hasOwnProperty(size)) {
            jerseySizeByStatus.confirmado[size]++
          }
        }
      })

      // Contar talles para pendientes
      pendingRegistrations.forEach((reg) => {
        if (reg.talleRemera) {
          const size = reg.talleRemera.toLowerCase() as keyof JerseySize
          if (jerseySizeByStatus.pendiente.hasOwnProperty(size)) {
            jerseySizeByStatus.pendiente[size]++
          }
        }
      })

      const jerseySizes: JerseySize = {
        xs: 0,
        s: 0,
        m: 0,
        l: 0,
        xl: 0,
        xxl: 0,
        xxxl: 0,
      }

      filteredForStats.forEach((reg) => {
        if (reg.talleRemera) {
          const size = reg.talleRemera.toLowerCase() as keyof JerseySize
          if (jerseySizes.hasOwnProperty(size)) {
            jerseySizes[size]++
          }
        }
      })

      // Contar grupos únicos y sus participantes
      const groupsMap = new Map<string, string[]>()
      filteredForStats.forEach((reg) => {
        const grupo = reg.grupoCiclistas || reg.grupoBici || reg.grupo_bici || reg.grupobici || reg.grupo
        if (grupo && grupo.trim() !== "") {
          const groupName = grupo.trim()
          const participantName = `${reg.nombre || ""} ${reg.apellido || ""}`.trim()

          if (!groupsMap.has(groupName)) {
            groupsMap.set(groupName, [])
          }
          if (participantName) {
            groupsMap.get(groupName)?.push(participantName)
          }
        }
      })

      const groupsInfoArray: GroupInfo[] = Array.from(groupsMap.entries())
        .map(([nombre, participantes]) => ({
          nombre,
          cantidad: participantes.length,
          participantes: participantes.sort(),
        }))
        .sort((a, b) => b.cantidad - a.cantidad)

      setGroupsInfo(groupsInfoArray)

      const registrationsByDay: Record<string, { total: number; rejected: number }> = {}

      const sortedRegistrations = [...registrationsData].sort(
        (a, b) => a.fechaInscripcion.getTime() - b.fechaInscripcion.getTime(),
      )

      if (sortedRegistrations.length > 0) {
        const firstDate = new Date(sortedRegistrations[0].fechaInscripcion)
        const lastDate = new Date(sortedRegistrations[sortedRegistrations.length - 1].fechaInscripcion)

        const currentDate = new Date(firstDate)
        while (currentDate <= lastDate) {
          const dateStr = currentDate.toLocaleDateString()
          registrationsByDay[dateStr] = { total: 0, rejected: 0 }
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }

      registrationsData.forEach((reg) => {
        try {
          if (reg.fechaInscripcion) {
            const date = reg.fechaInscripcion.toLocaleDateString()
            if (!registrationsByDay[date]) {
              registrationsByDay[date] = { total: 0, rejected: 0 }
            }
            registrationsByDay[date].total++
            if (reg.estado === "rechazado") {
              registrationsByDay[date].rejected++
            }
          }
        } catch (error) {
          console.error("Error al procesar fecha:", error)
        }
      })

      const registrationsByDayArray = Object.entries(registrationsByDay)
        .map(([date, counts]) => ({
          date,
          total: counts.total,
          rejected: counts.rejected,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setStats({
        totalRegistrations: registrationsData.length,
        validRegistrations: validRegistrations.length,
        confirmedRegistrations: confirmedRegistrations.length,
        pendingRegistrations: pendingRegistrations.length,
        maleCount,
        femaleCount,
        otherCount,
        withHealthConditions,
        celiacCount,
        jerseySize: jerseySizes,
        jerseySizeByStatus,
        registrationsByDay: registrationsByDayArray,
        groupsCount: groupsInfoArray.length,
      })
    } catch (error) {
      console.error("Error fetching registrations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistrations()
  }, [statusFilter])

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const hasRegistrations = stats.validRegistrations > 0

  const genderData: ChartDataItem[] = [
    { name: "Masculino", value: stats.maleCount },
    { name: "Femenino", value: stats.femaleCount },
    { name: "Otro", value: stats.otherCount },
  ].filter((item) => item.value > 0)

  const jerseySizeData: ChartDataItem[] = Object.entries(stats.jerseySize)
    .map(([size, count]) => ({
      name: size.toUpperCase(),
      value: count,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => {
      const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]
      return sizeOrder.indexOf(a.name) - sizeOrder.indexOf(b.name)
    })

  // Filtrar datos por tiempo seleccionado
  const getFilteredChartData = () => {
    if (timeFilter === "all" || stats.registrationsByDay.length === 0) {
      return stats.registrationsByDay
    }

    const now = new Date()
    const filterDate = new Date()

    switch (timeFilter) {
      case "week":
        filterDate.setDate(now.getDate() - 7)
        break
      case "month":
        filterDate.setMonth(now.getMonth() - 1)
        break
      case "quarter":
        filterDate.setMonth(now.getMonth() - 3)
        break
      default:
        return stats.registrationsByDay
    }

    return stats.registrationsByDay.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate >= filterDate
    })
  }

  const filteredChartData = getFilteredChartData()

  // Calcular tendencia (porcentaje de cambio)
  const calculateTrend = () => {
    if (filteredChartData.length < 2) return 0

    const firstHalf = filteredChartData.slice(0, Math.floor(filteredChartData.length / 2))
    const secondHalf = filteredChartData.slice(Math.floor(filteredChartData.length / 2))

    const firstHalfTotal = firstHalf.reduce((sum, item) => sum + item.total, 0)
    const secondHalfTotal = secondHalf.reduce((sum, item) => sum + item.total, 0)

    if (firstHalfTotal === 0) return secondHalfTotal > 0 ? 100 : 0

    return ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100
  }

  const trend = calculateTrend()

  // Calcular porcentaje de ocupación
  const occupancyPercentage = Math.round((stats.validRegistrations / (eventSettings?.cupoMaximo || 300)) * 100)

  // Calcular porcentaje de condiciones médicas
  const healthConditionsPercentage =
    stats.validRegistrations > 0 ? Math.round((stats.withHealthConditions / stats.validRegistrations) * 100) : 0

  // Calcular porcentaje de celíacos
  const celiacPercentage =
    stats.validRegistrations > 0 ? Math.round((stats.celiacCount / stats.validRegistrations) * 100) : 0

  // Obtener el talle más solicitado
  const mostRequestedSize =
    Object.entries(stats.jerseySize)
      .reduce((a, b) => (a[1] > b[1] ? a : b), ["", 0])[0]
      ?.toUpperCase() || "N/A"

  // Calcular porcentaje del talle más solicitado
  const mostRequestedSizeCount = Math.max(...Object.values(stats.jerseySize))
  const mostRequestedSizePercentage =
    stats.validRegistrations > 0 ? Math.round((mostRequestedSizeCount / stats.validRegistrations) * 100) : 0

  // Función para obtener stats según filtro activo
  const getActiveStats = () => {
    switch (activeStatsFilter) {
      case "confirmado":
        return stats.confirmedRegistrations
      case "pendiente":
        return stats.pendingRegistrations
      default:
        return stats.validRegistrations
    }
  }

  // Generar ticks exactos para el eje Y del gráfico de remeras
  const generateYAxisTicks = () => {
    const maxValue = Math.max(...jerseySizeData.map((item) => item.value))
    if (maxValue === 0) return [0]

    const ticks = []
    for (let i = 0; i <= maxValue; i++) {
      ticks.push(i)
    }
    return ticks
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div
            ref={topRef}
            className="flex flex-col items-center justify-center mt-4 md:mt-10 mb-4 md:mb-8 px-2 md:px-4"
          >
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Panel de Administración
            </h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-center text-sm md:text-base">
              Cargando estadísticas...
            </p>
          </div>

          <div className="grid gap-2 md:gap-4 grid-cols-2 md:grid-cols-4 mb-4 md:mb-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-1 md:pb-2 px-2 md:px-4 pt-2 md:pt-4">
                  <Skeleton className="h-3 md:h-4 w-16 md:w-24" />
                </CardHeader>
                <CardContent className="px-2 md:px-4 pb-2 md:pb-4">
                  <Skeleton className="h-6 md:h-8 w-12 md:w-16 mb-1 md:mb-2" />
                  <Skeleton className="h-2 md:h-3 w-full" />
                  <Skeleton className="h-1 md:h-2 w-full mt-2 md:mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-3 md:gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader className="px-2 md:px-4 py-2 md:py-4">
                <Skeleton className="h-4 md:h-6 w-32 md:w-48" />
                <Skeleton className="h-3 md:h-4 w-40 md:w-64" />
              </CardHeader>
              <CardContent className="px-2 md:px-4">
                <Skeleton className="h-48 md:h-80 w-full rounded-md" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-2 md:px-4 py-2 md:py-4">
                <Skeleton className="h-4 md:h-6 w-32 md:w-48" />
                <Skeleton className="h-3 md:h-4 w-40 md:w-64" />
              </CardHeader>
              <CardContent className="px-2 md:px-4">
                <Skeleton className="h-48 md:h-80 w-full rounded-md" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          ref={topRef}
          className="flex flex-col items-center justify-center mt-2 md:mt-6 mb-4 md:mb-8 px-2 md:px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-center max-w-xl text-sm md:text-base">
            Estadísticas y análisis {new Date().getFullYear()}
          </p>
        </motion.div>

        {/* Navigation and Actions */}
        <motion.div
          className="flex flex-col gap-2 md:gap-4 mb-4 md:mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 md:gap-2 shadow-sm hover:shadow-md transition-all bg-transparent text-xs md:text-sm px-2 md:px-3 h-8 md:h-9"
              >
                <Home className="h-3 md:h-4 w-3 md:w-4" />
                <span className="hidden sm:inline">Volver al inicio</span>
                <span className="sm:hidden">Inicio</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-1 md:gap-2 shadow-sm hover:shadow-md transition-all text-xs md:text-sm px-2 md:px-3 h-8 md:h-9 ${refreshing ? "opacity-70" : ""}`}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-3 md:h-4 w-3 md:w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{refreshing ? "Actualizando..." : "Actualizar datos"}</span>
              <span className="sm:hidden">Actualizar</span>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] md:w-[180px] bg-white h-8 md:h-9 text-xs md:text-sm">
                <div className="flex items-center gap-1 md:gap-2">
                  <Users className="h-3 md:h-4 w-3 md:w-4" />
                  <SelectValue placeholder="Estado" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos </SelectItem>
                <SelectItem value="confirmado">Solo confirmados</SelectItem>
                <SelectItem value="pendiente">Solo pendientes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-full sm:w-[160px] md:w-[180px] bg-white h-8 md:h-9 text-xs md:text-sm">
                <div className="flex items-center gap-1 md:gap-2">
                  <CalendarDays className="h-3 md:h-4 w-3 md:w-4" />
                  <SelectValue placeholder="Periodo" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el periodo</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="quarter">Último trimestre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Stats Cards - Más compactas para móvil */}
        <div className="grid gap-2 md:gap-4 grid-cols-2 md:grid-cols-3 mb-4 md:mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="overflow-hidden border border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
              <CardHeader className="pb-1 pt-2 md:pt-3 px-2 md:px-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xs md:text-sm font-medium text-indigo-900">Inscripciones</CardTitle>
                    <CardDescription className="text-xs hidden md:block">Confirmadas y pendientes</CardDescription>
                  </div>
                  <div className="p-1 md:p-2 rounded-full bg-indigo-50">
                    <Users className="h-3 md:h-5 w-3 md:w-5 text-indigo-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 md:px-3 pb-2 md:pb-3">
                <div className="flex items-baseline gap-1">
                  <div className="text-xl md:text-3xl font-bold text-indigo-900">{stats.validRegistrations}</div>
                  <span className="text-xs md:text-sm text-indigo-700">/ {eventSettings?.cupoMaximo || 300}</span>
                </div>

                <div className="mt-1 md:mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <UserCheck className="h-2 md:h-3 w-2 md:w-3 text-green-600" />
                      <span className="hidden sm:inline">Confirmadas:</span>
                      <span className="sm:hidden">Conf:</span> {stats.confirmedRegistrations}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <UserClock className="h-2 md:h-3 w-2 md:w-3 text-yellow-600" />
                      <span className="hidden sm:inline">Pendientes:</span>
                      <span className="sm:hidden">Pend:</span> {stats.pendingRegistrations}
                    </span>
                  </div>
                </div>

                <div className="mt-2 md:mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Ocupación</span>
                    <span className="font-medium">{occupancyPercentage}%</span>
                  </div>
                  <Progress
                    value={occupancyPercentage}
                    className="h-1 md:h-2"
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
            <Card className="overflow-hidden border border-pink-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-pink-600"></div>
              <CardHeader className="pb-1 pt-2 md:pt-3 px-2 md:px-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xs md:text-sm font-medium text-pink-900">Condiciones</CardTitle>
                    <CardDescription className="text-xs hidden md:block">Necesidades especiales</CardDescription>
                  </div>
                  <div className="p-1 md:p-2 rounded-full bg-pink-50">
                    <HeartPulse className="h-3 md:h-5 w-3 md:w-5 text-pink-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 md:px-3 pb-2 md:pb-3">
                <div className="flex items-baseline gap-1">
                  <div className="text-xl md:text-3xl font-bold text-pink-900">{stats.withHealthConditions}</div>
                  <span className="text-xs md:text-sm text-pink-700">pers.</span>
                </div>

                <div className="mt-1 flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2">
                  <Badge variant="outline" className="bg-pink-50 text-pink-800 border-pink-200 text-xs px-1 py-0">
                    {healthConditionsPercentage}%
                  </Badge>
                  {stats.withHealthConditions > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHealthConditionsModal(true)}
                      className="text-xs h-5 md:h-6 px-1 md:px-2 text-pink-700 hover:text-pink-800 hover:bg-pink-50"
                    >
                      <Eye className="h-2 md:h-3 w-2 md:w-3 mr-1" />
                      Ver
                    </Button>
                  )}
                </div>

                <div className="mt-2 md:mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Proporción</span>
                    <span className="font-medium">{healthConditionsPercentage}%</span>
                  </div>
                  <Progress
                    value={healthConditionsPercentage}
                    className="h-1 md:h-2"
                    indicatorClassName="bg-gradient-to-r from-pink-500 to-pink-600"
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
              <CardHeader className="pb-1 pt-2 md:pt-3 px-2 md:px-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xs md:text-sm font-medium text-amber-900">Celíacos</CardTitle>
                    <CardDescription className="text-xs hidden md:block">Participantes celíacos</CardDescription>
                  </div>
                  <div className="p-1 md:p-2 rounded-full bg-amber-50">
                    <WheatOff className="h-3 md:h-5 w-3 md:w-5 text-amber-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 md:px-3 pb-2 md:pb-3">
                <div className="flex items-baseline gap-1">
                  <div className="text-xl md:text-3xl font-bold text-amber-900">{stats.celiacCount}</div>
                  <span className="text-xs md:text-sm text-amber-700">pers.</span>
                </div>

                <div className="mt-1 flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs px-1 py-0">
                    {celiacPercentage}%
                  </Badge>
                  {stats.celiacCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCeliacModal(true)}
                      className="text-xs h-5 md:h-6 px-1 md:px-2 text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                    >
                      <Eye className="h-2 md:h-3 w-2 md:w-3 mr-1" />
                      Ver
                    </Button>
                  )}
                </div>

                <div className="mt-2 md:mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Proporción</span>
                    <span className="font-medium">{celiacPercentage}%</span>
                  </div>
                  <Progress
                    value={celiacPercentage}
                    className="h-1 md:h-2"
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
            <Card className="overflow-hidden border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
              <CardHeader className="pb-1 pt-2 md:pt-3 px-2 md:px-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xs md:text-sm font-medium text-purple-900">Remeras</CardTitle>
                    <CardDescription className="text-xs hidden md:block">Distribución de talles</CardDescription>
                  </div>
                  <div className="p-1 md:p-2 rounded-full bg-purple-50">
                    <Shirt className="h-3 md:h-5 w-3 md:w-5 text-purple-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 md:px-3 pb-2 md:pb-3">
                <div className="flex items-baseline gap-1">
                  <div className="text-xl md:text-3xl font-bold text-purple-900">{mostRequestedSize}</div>
                  <span className="text-xs md:text-sm text-purple-700">top</span>
                </div>

                <div className="mt-1 flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2">
                  <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 text-xs px-1 py-0">
                    {mostRequestedSizeCount}
                  </Badge>
                  {stats.validRegistrations > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setJerseyModal(true)}
                      className="text-xs h-5 md:h-6 px-1 md:px-2 text-purple-700 hover:text-purple-800 hover:bg-purple-50"
                    >
                      <Eye className="h-2 md:h-3 w-2 md:w-3 mr-1" />
                      Ver
                    </Button>
                  )}
                </div>

                <div className="mt-2 md:mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Del total</span>
                    <span className="font-medium">{mostRequestedSizePercentage}%</span>
                  </div>
                  <Progress
                    value={mostRequestedSizePercentage}
                    className="h-1 md:h-2"
                    indicatorClassName="bg-gradient-to-r from-purple-500 to-purple-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="overflow-hidden border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
              <CardHeader className="pb-1 pt-2 md:pt-3 px-2 md:px-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xs md:text-sm font-medium text-emerald-900">Grupos</CardTitle>
                    <CardDescription className="text-xs hidden md:block">Grupos únicos</CardDescription>
                  </div>
                  <div className="p-1 md:p-2 rounded-full bg-emerald-50">
                    <UsersIcon className="h-3 md:h-5 w-3 md:w-5 text-emerald-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 md:px-3 pb-2 md:pb-3">
                <div className="flex items-baseline gap-1">
                  <div className="text-xl md:text-3xl font-bold text-emerald-900">{stats.groupsCount}</div>
                  <span className="text-xs md:text-sm text-emerald-700">grps</span>
                </div>

                <div className="mt-1 flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2">
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs px-1 py-0"
                  >
                    {groupsInfo.reduce((sum, group) => sum + group.cantidad, 0)} pers.
                  </Badge>
                  {stats.groupsCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setGroupsModal(true)}
                      className="text-xs h-5 md:h-6 px-1 md:px-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                    >
                      <Eye className="h-2 md:h-3 w-2 md:w-3 mr-1" />
                      Ver
                    </Button>
                  )}
                </div>

                <div className="mt-2 md:mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>En grupos</span>
                    <span className="font-medium">
                      {Math.round(
                        (groupsInfo.reduce((sum, group) => sum + group.cantidad, 0) / stats.validRegistrations) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={Math.round(
                      (groupsInfo.reduce((sum, group) => sum + group.cantidad, 0) / stats.validRegistrations) * 100,
                    )}
                    className="h-1 md:h-2"
                    indicatorClassName="bg-gradient-to-r from-emerald-500 to-emerald-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card className="overflow-hidden border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <CardHeader className="pb-1 pt-2 md:pt-3 px-2 md:px-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xs md:text-sm font-medium text-blue-900">Género</CardTitle>
                    <CardDescription className="text-xs hidden md:block">Masculino vs Femenino</CardDescription>
                  </div>
                  <div className="p-1 md:p-2 rounded-full bg-blue-50">
                    <div className="flex items-center">
                      <Venus className="h-2 md:h-4 w-2 md:w-4 mr-1 text-pink-500" />
                      <Mars className="h-2 md:h-4 w-2 md:w-4 text-blue-500" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 md:px-3 pb-2 md:pb-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs flex items-center gap-1">
                      <Mars className="h-2 md:h-3 w-2 md:w-3 text-blue-500" />
                      <span className="hidden sm:inline">Masculino</span>
                      <span className="sm:hidden">M</span>
                    </span>
                    <span className="font-bold text-blue-900 text-sm md:text-base">{stats.maleCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs flex items-center gap-1">
                      <Venus className="h-2 md:h-3 w-2 md:w-3 text-pink-500" />
                      <span className="hidden sm:inline">Femenino</span>
                      <span className="sm:hidden">F</span>
                    </span>
                    <span className="font-bold text-pink-900 text-sm md:text-base">{stats.femaleCount}</span>
                  </div>
                  {stats.otherCount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Otro</span>
                      <span className="font-bold text-gray-900 text-sm md:text-base">{stats.otherCount}</span>
                    </div>
                  )}
                </div>

                <div className="mt-2 md:mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Masculino</span>
                    <span className="font-medium">
                      {Math.round((stats.maleCount / stats.validRegistrations) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.round((stats.maleCount / stats.validRegistrations) * 100)}
                    className="h-1 md:h-2"
                    indicatorClassName="bg-gradient-to-r from-blue-500 to-blue-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Financial Summary Section */}
        <div className="grid gap-2 md:gap-4 grid-cols-2 md:grid-cols-4 mb-4 md:mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card className="overflow-hidden border border-green-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
              <CardHeader className="pb-1 pt-2 md:pt-3 px-2 md:px-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xs md:text-sm font-medium text-green-900">Total Recaudado</CardTitle>
                    <CardDescription className="text-xs hidden md:block">Suma total de pagos</CardDescription>
                  </div>
                  <div className="p-1 md:p-2 rounded-full bg-green-50">
                    <DollarSign className="h-3 md:h-5 w-3 md:w-5 text-green-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 md:px-3 pb-2 md:pb-3">
                <div className="flex items-baseline gap-1">
                  <div className="text-xl md:text-3xl font-bold text-green-900">
                    $
                    {registrations
                      .reduce((total, reg) => {
                        const precio = reg.precio || "0"
                        const amount = precio.replace(/[$.,]/g, "")
                        return total + (Number.parseInt(amount) || 0)
                      }, 0)
                      .toLocaleString()}
                  </div>
                </div>

                <div className="mt-1 md:mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <User className="h-2 md:h-3 w-2 md:w-3 text-blue-600" />
                      <span className="hidden sm:inline">Gise:</span>
                      <span className="sm:hidden">G:</span>$
                      {registrations
                        .filter((reg) => reg.transferidoA === "Gise")
                        .reduce((total, reg) => {
                          const precio = reg.precio || "0"
                          const amount = precio.replace(/[$.,]/g, "")
                          return total + (Number.parseInt(amount) || 0)
                        }, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <User className="h-2 md:h-3 w-2 md:w-3 text-purple-600" />
                      <span className="hidden sm:inline">Bruni:</span>
                      <span className="sm:hidden">B:</span>$
                      {registrations
                        .filter((reg) => reg.transferidoA === "Bruni")
                        .reduce((total, reg) => {
                          const precio = reg.precio || "0"
                          const amount = precio.replace(/[$.,]/g, "")
                          return total + (Number.parseInt(amount) || 0)
                        }, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-2 md:mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFinancialDetails(true)}
                    className="w-full text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver Detalles
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Card className="overflow-hidden border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <CardHeader className="pb-1 pt-2 md:pt-3 px-2 md:px-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xs md:text-sm font-medium text-blue-900">Plata de Gise</CardTitle>
                    <CardDescription className="text-xs hidden md:block">Transferencias a Gise</CardDescription>
                  </div>
                  <div className="p-1 md:p-2 rounded-full bg-blue-50">
                    <User className="h-3 md:h-5 w-3 md:w-5 text-blue-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 md:px-3 pb-2 md:pb-3">
                <div className="flex items-baseline gap-1">
                  <div className="text-xl md:text-3xl font-bold text-blue-900">
                    $
                    {registrations
                      .filter((reg) => reg.transferidoA === "Gise")
                      .reduce((total, reg) => {
                        const precio = reg.precio || "0"
                        const amount = precio.replace(/[$.,]/g, "")
                        return total + (Number.parseInt(amount) || 0)
                      }, 0)
                      .toLocaleString()}
                  </div>
                </div>

                <div className="mt-1 flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-xs px-1 py-0">
                    {registrations.filter((reg) => reg.transferidoA === "Gise").length} pagos
                  </Badge>
                </div>

                <div className="mt-2 md:mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Del total</span>
                    <span className="font-medium">
                      {Math.round(
                        (registrations
                          .filter((reg) => reg.transferidoA === "Gise")
                          .reduce((total, reg) => {
                            const precio = reg.precio || "0"
                            const amount = precio.replace(/[$.,]/g, "")
                            return total + (Number.parseInt(amount) || 0)
                          }, 0) /
                          registrations.reduce((total, reg) => {
                            const precio = reg.precio || "0"
                            const amount = precio.replace(/[$.,]/g, "")
                            return total + (Number.parseInt(amount) || 0)
                          }, 0)) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={Math.round(
                      (registrations
                        .filter((reg) => reg.transferidoA === "Gise")
                        .reduce((total, reg) => {
                          const precio = reg.precio || "0"
                          const amount = precio.replace(/[$.,]/g, "")
                          return total + (Number.parseInt(amount) || 0)
                        }, 0) /
                        registrations.reduce((total, reg) => {
                          const precio = reg.precio || "0"
                          const amount = precio.replace(/[$.,]/g, "")
                          return total + (Number.parseInt(amount) || 0)
                        }, 0)) *
                        100,
                    )}
                    className="h-1 md:h-2"
                    indicatorClassName="bg-gradient-to-r from-blue-500 to-blue-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <Card className="overflow-hidden border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
              <CardHeader className="pb-1 pt-2 md:pt-3 px-2 md:px-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xs md:text-sm font-medium text-purple-900">Plata de Bruni</CardTitle>
                    <CardDescription className="text-xs hidden md:block">Transferencias a Bruni</CardDescription>
                  </div>
                  <div className="p-1 md:p-2 rounded-full bg-purple-50">
                    <User className="h-3 md:h-5 w-3 md:w-5 text-purple-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 md:px-3 pb-2 md:pb-3">
                <div className="flex items-baseline gap-1">
                  <div className="text-xl md:text-3xl font-bold text-purple-900">
                    $
                    {registrations
                      .filter((reg) => reg.transferidoA === "Bruni")
                      .reduce((total, reg) => {
                        const precio = reg.precio || "0"
                        const amount = precio.replace(/[$.,]/g, "")
                        return total + (Number.parseInt(amount) || 0)
                      }, 0)
                      .toLocaleString()}
                  </div>
                </div>

                <div className="mt-1 flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2">
                  <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 text-xs px-1 py-0">
                    {registrations.filter((reg) => reg.transferidoA === "Bruni").length} pagos
                  </Badge>
                </div>

                <div className="mt-2 md:mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Del total</span>
                    <span className="font-medium">
                      {Math.round(
                        (registrations
                          .filter((reg) => reg.transferidoA === "Bruni")
                          .reduce((total, reg) => {
                            const precio = reg.precio || "0"
                            const amount = precio.replace(/[$.,]/g, "")
                            return total + (Number.parseInt(amount) || 0)
                          }, 0) /
                          registrations.reduce((total, reg) => {
                            const precio = reg.precio || "0"
                            const amount = precio.replace(/[$.,]/g, "")
                            return total + (Number.parseInt(amount) || 0)
                          }, 0)) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={Math.round(
                      (registrations
                        .filter((reg) => reg.transferidoA === "Bruni")
                        .reduce((total, reg) => {
                          const precio = reg.precio || "0"
                          const amount = precio.replace(/[$.,]/g, "")
                          return total + (Number.parseInt(amount) || 0)
                        }, 0) /
                        registrations.reduce((total, reg) => {
                          const precio = reg.precio || "0"
                          const amount = precio.replace(/[$.,]/g, "")
                          return total + (Number.parseInt(amount) || 0)
                        }, 0)) *
                        100,
                    )}
                    className="h-1 md:h-2"
                    indicatorClassName="bg-gradient-to-r from-purple-500 to-purple-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
          >
            <Card className="overflow-hidden border border-red-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
              <CardHeader className="pb-1 pt-2 md:pt-3 px-2 md:px-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xs md:text-sm font-medium text-red-900">Gastos</CardTitle>
                    <CardDescription className="text-xs hidden md:block">Gastos del evento</CardDescription>
                  </div>
                  <div className="p-1 md:p-2 rounded-full bg-red-50">
                    <CreditCard className="h-3 md:h-5 w-3 md:w-5 text-red-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 md:px-3 pb-2 md:pb-3">
                <div className="flex items-baseline gap-1">
                  <div className="text-xl md:text-3xl font-bold text-red-900">
                    ${expenses.reduce((total, expense) => total + (expense.monto || 0), 0).toLocaleString()}
                  </div>
                </div>

                <div className="mt-1 flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2">
                  <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200 text-xs px-1 py-0">
                    {expenses.length} gastos
                  </Badge>
                  <Link href="/admin/gastos">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-5 md:h-6 px-1 md:px-2 text-red-700 hover:text-red-800 hover:bg-red-50"
                    >
                      <Eye className="h-2 md:h-3 w-2 md:w-3 mr-1" />
                      Ver
                    </Button>
                  </Link>
                </div>

                <div className="mt-2 md:mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Utilizado</span>
                    <span className="font-medium">
                      {registrations.length > 0
                        ? Math.round(
                            (expenses.reduce((total, expense) => total + (expense.monto || 0), 0) /
                              registrations.reduce((total, reg) => {
                                const precio = reg.precio || "0"
                                const amount = precio.replace(/[$.,]/g, "")
                                return total + (Number.parseInt(amount) || 0)
                              }, 0)) *
                              100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      registrations.length > 0
                        ? Math.min(
                            100,
                            (expenses.reduce((total, expense) => total + (expense.monto || 0), 0) /
                              registrations.reduce((total, reg) => {
                                const precio = reg.precio || "0"
                                const amount = precio.replace(/[$.,]/g, "")
                                return total + (Number.parseInt(amount) || 0)
                              }, 0)) *
                              100,
                          )
                        : 0
                    }
                    className="h-1 md:h-2"
                    indicatorClassName="bg-gradient-to-r from-red-500 to-red-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        {/* Main Charts - Más compactos para móvil */}
        <div className="grid gap-3 md:gap-6 grid-cols-1 lg:grid-cols-2 mb-4 md:mb-6">
          {/* Jersey Size Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-0 overflow-hidden bg-white">
              <CardHeader className="border-b bg-gray-50/50 pb-2 md:pb-3 px-2 md:px-4 py-2 md:py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 md:gap-2">
                    <Shirt className="h-4 md:h-5 w-4 md:w-5 text-purple-600" />
                    <div>
                      <CardTitle className="text-sm md:text-lg font-semibold">Gráfico de Talles</CardTitle>
                      <CardDescription className="mt-1 text-xs md:text-sm hidden md:block">
                        Distribución visual por talle
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-3 md:pt-6 px-2 md:px-4">
                <div className="h-48 md:h-64">
                  {jerseySizeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={jerseySizeData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                        <defs>
                          {JERSEY_COLORS.map((color, index) => (
                            <linearGradient
                              key={`jersey-gradient-${index}`}
                              id={`jersey-gradient-${index}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                              <stop offset="100%" stopColor={color} stopOpacity={0.5} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={true} vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 10 }}
                          domain={[0, "dataMax"]}
                          ticks={generateYAxisTicks()}
                        />
                        <Tooltip
                          formatter={(value, name) => [`${value} remeras`, "Cantidad"]}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            fontSize: "12px",
                          }}
                        />
                        <Bar
                          dataKey="value"
                          name="Remeras"
                          radius={[4, 4, 0, 0]}
                          animationBegin={0}
                          animationDuration={1500}
                        >
                          {jerseySizeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`url(#jersey-gradient-${index})`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Shirt className="h-8 md:h-12 w-8 md:w-12 text-gray-300 mb-2" />
                      <p className="text-gray-500 text-center text-xs md:text-sm">No hay datos de talles disponibles</p>
                    </div>
                  )}
                </div>

                {/* Resumen de talles - Más compacto */}
                <div className="mt-2 md:mt-4 grid grid-cols-4 md:grid-cols-7 gap-1 md:gap-2 text-xs">
                  {Object.entries(stats.jerseySize).map(([size, count]) => (
                    <div key={size} className="text-center p-1 md:p-2 bg-gray-50 rounded">
                      <div className="font-bold text-purple-600 text-xs md:text-sm">{size.toUpperCase()}</div>
                      <div className="text-gray-600 text-xs">{count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t bg-gray-50/50 py-2 md:py-3 text-xs text-muted-foreground px-2 md:px-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-2 md:h-3 w-2 md:w-3" />
                  Actualizado: {new Date().toLocaleTimeString()}
                </div>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Gender Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-0 overflow-hidden bg-white">
              <CardHeader className="border-b bg-gray-50/50 pb-2 md:pb-3 px-2 md:px-4 py-2 md:py-4">
                <div className="flex items-center gap-1 md:gap-2">
                  <PieChartIcon className="h-4 md:h-5 w-4 md:w-5 text-indigo-600" />
                  <div>
                    <CardTitle className="text-sm md:text-lg font-semibold">Gráfico por Género</CardTitle>
                    <CardDescription className="text-xs md:text-sm hidden md:block">
                      Distribución visual por género
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-48 md:h-64 pt-3 md:pt-6 px-2 md:px-4">
                {genderData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {GENDER_COLORS.map((color, index) => (
                          <linearGradient
                            key={`gender-gradient-${index}`}
                            id={`gender-gradient-${index}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.5} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                        animationBegin={0}
                        animationDuration={1500}
                      >
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#gender-gradient-${index})`} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Users className="h-8 md:h-12 w-8 md:w-12 text-gray-300 mb-2" />
                    <p className="text-gray-500 text-center text-xs md:text-sm">No hay datos de género disponibles</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t bg-gray-50/50 py-2 md:py-3 text-xs text-muted-foreground px-2 md:px-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-2 md:h-3 w-2 md:w-3" />
                  Actualizado: {new Date().toLocaleTimeString()}
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Scroll to top button */}
      <div className="fixed bottom-4 md:bottom-8 right-4 md:right-8 z-50">
        <Button
          onClick={scrollToTop}
          variant="default"
          size="icon"
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-10 md:h-12 w-10 md:w-12"
        >
          <ArrowUp className="h-4 md:h-5 w-4 md:w-5" />
        </Button>
      </div>

      {/* Modal de Condiciones Médicas */}
      <Dialog open={healthConditionsModal} onOpenChange={setHealthConditionsModal}>
        <DialogContent className="max-w-xl md:max-w-2xl max-h-[80vh] overflow-y-auto mx-2 md:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm md:text-base">
              <HeartPulse className="h-4 md:h-5 w-4 md:w-5 text-pink-600" />
              Participantes con Condiciones Médicas
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Lista de participantes que reportaron condiciones médicas especiales
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 md:space-y-3">
            {peopleWithConditions.map((person, index) => (
              <div key={index} className="border rounded-lg p-2 md:p-3 bg-gray-50">
                <div className="font-medium text-xs md:text-sm">
                  {person.nombre} {person.apellido}
                </div>
                <div className="text-xs md:text-sm text-gray-600 mt-1">
                  <strong>Condición:</strong> {person.condicion}
                </div>
              </div>
            ))}
            {peopleWithConditions.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-xs md:text-sm">
                No hay participantes con condiciones médicas reportadas
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setHealthConditionsModal(false)}
              className="text-xs md:text-sm h-8 md:h-9"
            >
              <X className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Celíacos */}
      <Dialog open={celiacModal} onOpenChange={setCeliacModal}>
        <DialogContent className="max-w-xl md:max-w-2xl max-h-[80vh] overflow-y-auto mx-2 md:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm md:text-base">
              <WheatOff className="h-4 md:h-5 w-4 md:w-5 text-amber-600" />
              Participantes Celíacos
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Lista de participantes que reportaron ser celíacos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 md:space-y-3">
            {celiacPeople.map((person, index) => (
              <div key={index} className="border rounded-lg p-2 md:p-3 bg-amber-50">
                <div className="font-medium text-xs md:text-sm">
                  {person.nombre} {person.apellido}
                </div>
                <div className="text-xs md:text-sm text-amber-700 mt-1">
                  <strong>Condición:</strong> Celíaco
                </div>
              </div>
            ))}
            {celiacPeople.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-xs md:text-sm">
                No hay participantes celíacos reportados
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setCeliacModal(false)} className="text-xs md:text-sm h-8 md:h-9">
              <X className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Talles de Remeras - SIN nombres de participantes */}
      <Dialog open={jerseyModal} onOpenChange={setJerseyModal}>
        <DialogContent className="max-w-xl md:max-w-3xl max-h-[80vh] overflow-y-auto mx-2 md:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm md:text-base">
              <Shirt className="h-4 md:h-5 w-4 md:w-5 text-purple-600" />
              Detalle de Talles de Remeras
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Distribución de talles por estado de inscripción
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Todos los inscriptos (sin rechazados) */}
            <div className="border rounded-lg p-3 md:p-4 bg-purple-50">
              <h3 className="font-bold text-sm md:text-lg text-purple-900 mb-3">Todos los inscriptos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {Object.entries(stats.jerseySizeByStatus.all)
                  .sort(([a], [b]) => {
                    const sizeOrder = ["xs", "s", "m", "l", "xl", "xxl", "xxxl"]
                    return sizeOrder.indexOf(a) - sizeOrder.indexOf(b)
                  })
                  .map(([size, count]) => (
                    <div key={size} className="text-center p-2 bg-white rounded border">
                      <div className="font-bold text-purple-900 text-sm md:text-base">{size.toUpperCase()}</div>
                      <div className="text-purple-700 text-xs md:text-sm">{count} remeras</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Inscriptos confirmados */}
            <div className="border rounded-lg p-3 md:p-4 bg-green-50">
              <h3 className="font-bold text-sm md:text-lg text-green-900 mb-3">Inscriptos confirmados</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {Object.entries(stats.jerseySizeByStatus.confirmado)
                  .sort(([a], [b]) => {
                    const sizeOrder = ["xs", "s", "m", "l", "xl", "xxl", "xxxl"]
                    return sizeOrder.indexOf(a) - sizeOrder.indexOf(b)
                  })
                  .map(([size, count]) => (
                    <div key={size} className="text-center p-2 bg-white rounded border">
                      <div className="font-bold text-green-900 text-sm md:text-base">{size.toUpperCase()}</div>
                      <div className="text-green-700 text-xs md:text-sm">{count} remeras</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Inscriptos pendientes */}
            <div className="border rounded-lg p-3 md:p-4 bg-yellow-50">
              <h3 className="font-bold text-sm md:text-lg text-yellow-900 mb-3">Inscriptos pendientes</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {Object.entries(stats.jerseySizeByStatus.pendiente)
                  .sort(([a], [b]) => {
                    const sizeOrder = ["xs", "s", "m", "l", "xl", "xxl", "xxxl"]
                    return sizeOrder.indexOf(a) - sizeOrder.indexOf(b)
                  })
                  .map(([size, count]) => (
                    <div key={size} className="text-center p-2 bg-white rounded border">
                      <div className="font-bold text-yellow-900 text-sm md:text-base">{size.toUpperCase()}</div>
                      <div className="text-yellow-700 text-xs md:text-sm">{count} remeras</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setJerseyModal(false)} className="text-xs md:text-sm h-8 md:h-9">
              <X className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Grupos - Con sistema colapsible */}
      <Dialog
        open={groupsModal}
        onOpenChange={(open) => {
          setGroupsModal(open)
          if (!open) setExpandedGroups(new Set()) // Reset cuando se cierra
        }}
      >
        <DialogContent className="max-w-xl md:max-w-4xl max-h-[80vh] overflow-y-auto mx-2 md:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm md:text-base">
              <UsersIcon className="h-4 md:h-5 w-4 md:w-5 text-emerald-600" />
              Detalle de Grupos de Ciclistas
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Toca la flecha para ver los participantes de cada grupo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 md:space-y-3">
            {groupsInfo.map((group, index) => (
              <div key={index} className="border rounded-lg bg-emerald-50 overflow-hidden">
                <div
                  className="flex items-center justify-between p-3 md:p-4 cursor-pointer hover:bg-emerald-100 transition-colors"
                  onClick={() => toggleGroup(index)}
                >
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-sm md:text-lg text-emerald-900">{group.nombre}</h3>
                    <Badge
                      variant="outline"
                      className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs md:text-sm"
                    >
                      {group.cantidad} participantes
                    </Badge>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-emerald-600 transition-transform ${
                      expandedGroups.has(index) ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {expandedGroups.has(index) && (
                  <div className="px-3 md:px-4 pb-3 md:pb-4 border-t border-emerald-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                      {group.participantes.map((participante, pIndex) => (
                        <div key={pIndex} className="text-xs md:text-sm bg-white p-2 rounded border">
                          {participante}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {groupsInfo.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-xs md:text-sm">No hay grupos registrados</div>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setGroupsModal(false)} className="text-xs md:text-sm h-8 md:h-9">
              <X className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tendencia de Inscripciones - Más compacta */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.0 }}
        className="mb-4 md:mb-6"
      >
        <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-0 overflow-hidden bg-white">
          <CardHeader className="border-b bg-gray-50/50 pb-2 md:pb-3 px-2 md:px-4 py-2 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 md:gap-2">
                <Activity className="h-4 md:h-5 w-4 md:w-5 text-indigo-600" />
                <div>
                  <CardTitle className="text-sm md:text-lg font-semibold">Tendencia de Inscripciones</CardTitle>
                  <CardDescription className="mt-1 text-xs md:text-sm hidden md:block">
                    Evolución diaria de inscripciones
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="flex items-center text-xs text-indigo-600 bg-indigo-50 px-1 md:px-2 py-1 rounded-full">
                  <span className="w-1 md:w-2 h-1 md:h-2 rounded-full bg-indigo-500 mr-1"></span>
                  <span className="hidden sm:inline">Totales</span>
                  <span className="sm:hidden">Tot</span>
                </div>
                <div className="flex items-center text-xs text-pink-600 bg-pink-50 px-1 md:px-2 py-1 rounded-full">
                  <span className="w-1 md:w-2 h-1 md:h-2 rounded-full bg-pink-500 mr-1"></span>
                  <span className="hidden sm:inline">Rechazadas</span>
                  <span className="sm:hidden">Rech</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-3 md:pt-6 px-2 md:px-4">
            <div className="h-48 md:h-80">
              {hasRegistrations && filteredChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredChartData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getDate()}/${date.getMonth() + 1}`
                      }}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        fontSize: "12px",
                      }}
                      formatter={(value, name) => [value, name === "total" ? "Inscripciones" : "Rechazadas"]}
                      labelFormatter={(label) => {
                        const date = new Date(label)
                        return date.toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="Inscripciones"
                      stroke="#6366f1"
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                      strokeWidth={2}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rejected"
                      name="Rechazadas"
                      stroke="#ec4899"
                      fillOpacity={1}
                      fill="url(#colorRejected)"
                      strokeWidth={2}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <Calendar className="h-8 md:h-12 w-8 md:w-12 text-gray-300 mb-2" />
                  <p className="text-gray-500 text-center text-xs md:text-sm">
                    No hay datos de inscripciones para el periodo seleccionado
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 md:mt-4 bg-transparent text-xs md:text-sm h-6 md:h-8"
                    onClick={() => setTimeFilter("all")}
                  >
                    Ver todos los datos
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t bg-gray-50/50 py-2 md:py-3 text-xs text-muted-foreground px-2 md:px-4">
            <div className="flex items-center gap-1">
              <Clock className="h-2 md:h-3 w-2 md:w-3" />
              Actualizado: {new Date().toLocaleTimeString()}
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      {showFinancialDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detalles Financieros Completos</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowFinancialDetails(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-6">
                {/* Total General */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Total Recaudado</h3>
                  <p className="text-3xl font-bold text-green-900">
                    $
                    {registrations
                      .reduce((total, reg) => {
                        const precio = reg.precio || "0"
                        const amount = precio.replace(/[$.,]/g, "")
                        return total + (Number.parseInt(amount) || 0)
                      }, 0)
                      .toLocaleString()}
                  </p>
                </div>

                {/* Transferencias Confirmadas */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Gise */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Transferencias a Gise</h3>
                    <div className="space-y-3">
                      {[
                        { precio: "$25.000", amount: 25000 },
                        { precio: "$33.000", amount: 33000 },
                        { precio: "$35.000", amount: 35000 },
                      ].map(({ precio, amount }) => {
                        const count = registrations.filter(
                          (reg) => reg.transferidoA === "Gise" && reg.precio === precio,
                        ).length
                        const total = count * amount
                        return (
                          <div key={precio} className="flex justify-between items-center">
                            <span>
                              {count} × {precio}
                            </span>
                            <span className="font-semibold">${total.toLocaleString()}</span>
                          </div>
                        )
                      })}
                      {(() => {
                        const otherCount = registrations.filter(
                          (reg) =>
                            reg.transferidoA === "Gise" && !["$25.000", "$33.000", "$35.000"].includes(reg.precio),
                        ).length
                        const otherTotal = registrations
                          .filter(
                            (reg) =>
                              reg.transferidoA === "Gise" && !["$25.000", "$33.000", "$35.000"].includes(reg.precio),
                          )
                          .reduce((total, reg) => {
                            const precio = reg.precio || "0"
                            const amount = precio.replace(/[$.,]/g, "")
                            return total + (Number.parseInt(amount) || 0)
                          }, 0)
                        return otherCount > 0 ? (
                          <div className="flex justify-between items-center">
                            <span>{otherCount} × Otro</span>
                            <span className="font-semibold">${otherTotal.toLocaleString()}</span>
                          </div>
                        ) : null
                      })()}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center font-bold text-blue-900">
                          <span>Total Gise:</span>
                          <span>
                            $
                            {registrations
                              .filter((reg) => reg.transferidoA === "Gise")
                              .reduce((total, reg) => {
                                const precio = reg.precio || "0"
                                const amount = precio.replace(/[$.,]/g, "")
                                return total + (Number.parseInt(amount) || 0)
                              }, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bruni */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4">Transferencias a Bruni</h3>
                    <div className="space-y-3">
                      {[
                        { precio: "$25.000", amount: 25000 },
                        { precio: "$33.000", amount: 33000 },
                        { precio: "$35.000", amount: 35000 },
                      ].map(({ precio, amount }) => {
                        const count = registrations.filter(
                          (reg) => reg.transferidoA === "Bruni" && reg.precio === precio,
                        ).length
                        const total = count * amount
                        return (
                          <div key={precio} className="flex justify-between items-center">
                            <span>
                              {count} × {precio}
                            </span>
                            <span className="font-semibold">${total.toLocaleString()}</span>
                          </div>
                        )
                      })}
                      {(() => {
                        const otherCount = registrations.filter(
                          (reg) =>
                            reg.transferidoA === "Bruni" && !["$25.000", "$33.000", "$35.000"].includes(reg.precio),
                        ).length
                        const otherTotal = registrations
                          .filter(
                            (reg) =>
                              reg.transferidoA === "Bruni" && !["$25.000", "$33.000", "$35.000"].includes(reg.precio),
                          )
                          .reduce((total, reg) => {
                            const precio = reg.precio || "0"
                            const amount = precio.replace(/[$.,]/g, "")
                            return total + (Number.parseInt(amount) || 0)
                          }, 0)
                        return otherCount > 0 ? (
                          <div className="flex justify-between items-center">
                            <span>{otherCount} × Otro</span>
                            <span className="font-semibold">${otherTotal.toLocaleString()}</span>
                          </div>
                        ) : null
                      })()}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center font-bold text-purple-900">
                          <span>Total Bruni:</span>
                          <span>
                            $
                            {registrations
                              .filter((reg) => reg.transferidoA === "Bruni")
                              .reduce((total, reg) => {
                                const precio = reg.precio || "0"
                                const amount = precio.replace(/[$.,]/g, "")
                                return total + (Number.parseInt(amount) || 0)
                              }, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pendientes */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-orange-900 mb-4">Pendientes (Sin Transferir)</h3>
                  <div className="space-y-3">
                    {[
                      { precio: "$25.000", amount: 25000 },
                      { precio: "$33.000", amount: 33000 },
                      { precio: "$35.000", amount: 35000 },
                    ].map(({ precio, amount }) => {
                      const count = registrations.filter(
                        (reg) => (!reg.transferidoA || reg.transferidoA === "sin_especificar") && reg.precio === precio,
                      ).length
                      const total = count * amount
                      return count > 0 ? (
                        <div key={precio} className="flex justify-between items-center">
                          <span>
                            {count} × {precio}
                          </span>
                          <span className="font-semibold">${total.toLocaleString()}</span>
                        </div>
                      ) : null
                    })}
                    {(() => {
                      const otherCount = registrations.filter(
                        (reg) =>
                          (!reg.transferidoA || reg.transferidoA === "sin_especificar") &&
                          !["$25.000", "$33.000", "$35.000"].includes(reg.precio),
                      ).length
                      const otherTotal = registrations
                        .filter(
                          (reg) =>
                            (!reg.transferidoA || reg.transferidoA === "sin_especificar") &&
                            !["$25.000", "$33.000", "$35.000"].includes(reg.precio),
                        )
                        .reduce((total, reg) => {
                          const precio = reg.precio || "0"
                          const amount = precio.replace(/[$.,]/g, "")
                          return total + (Number.parseInt(amount) || 0)
                        }, 0)
                      return otherCount > 0 ? (
                        <div className="flex justify-between items-center">
                          <span>{otherCount} × Otro</span>
                          <span className="font-semibold">${otherTotal.toLocaleString()}</span>
                        </div>
                      ) : null
                    })()}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center font-bold text-orange-900">
                        <span>Total Pendientes:</span>
                        <span>
                          $
                          {registrations
                            .filter((reg) => !reg.transferidoA || reg.transferidoA === "sin_especificar")
                            .reduce((total, reg) => {
                              const precio = reg.precio || "0"
                              const amount = precio.replace(/[$.,]/g, "")
                              return total + (Number.parseInt(amount) || 0)
                            }, 0)
                            .toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Final */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                    <span>Total Confirmados + Pendientes:</span>
                    <span>
                      $
                      {registrations
                        .reduce((total, reg) => {
                          const precio = reg.precio || "0"
                          const amount = precio.replace(/[$.,]/g, "")
                          return total + (Number.parseInt(amount) || 0)
                        }, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
