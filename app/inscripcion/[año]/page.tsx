"use client"
import { DialogFooter } from "@/components/ui/dialog"
import { useState, useRef, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import { format, parse } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Users } from "lucide-react"
import {
  AlertCircle,
  UploadCloud,
  Loader2,
  CheckCircle2,
  Home,
  Info,
  FileText,
  DollarSign,
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  Shirt,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Search,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

// ─── PALETA DEL EVENTO ── cambiar estos valores cada año ────────
const AMARILLO      = "#C8E000"  // Lima brillante (top remera)
const VERDE         = "#3CB83C"  // Verde medio
const CELESTE       = "#20C8B8"  // Turquesa/celeste (hem remera)
const AMARILLO_SOFT = "#F3FAC0"  // Fondo suave amarillo
const VERDE_SOFT    = "#C8EEC8"  // Fondo suave verde
const CELESTE_SOFT  = "#C0EEEA"  // Fondo suave celeste
// ────────────────────────────────────────────────────────────────

const gruposCiclistas = [
  "Team Riders", "Pedal Power", "Grand Team Bike Cdelu", "Ciclo Materos", "Los Despacito",
  "Kamikaze MTB", "Rural Bike concepcion", "En Bici Ando", "Desafiando Caminos", "Los Tiernitos",
  "CicloturismoBasso", "Desacatados Bike", "Bikers Alcorta", "Bici Chicas", "Panteras Bike",
]

const paises = [
  "Argentina", "Uruguay", "Bolivia", "Brasil", "Chile", "Colombia", "Ecuador",
  "Paraguay", "Perú", "Venezuela", "México", "Estados Unidos", "Canadá", "España", "Otro",
]

function DatePicker({ date, setDate, className, placeholder = "Seleccionar fecha", disabled = false }) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [year, setYear] = useState(date ? date.getFullYear() : new Date().getFullYear())
  const [month, setMonth] = useState(date ? date.getMonth() : new Date().getMonth())
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ]

  return (
    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground", className)}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: es }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b flex justify-between items-center gap-2">
          <Select value={month.toString()} onValueChange={(v) => setMonth(Number.parseInt(v))}>
            <SelectTrigger className="w-[130px] h-8"><SelectValue placeholder="Mes" /></SelectTrigger>
            <SelectContent>
              {months.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={year.toString()} onValueChange={(v) => setYear(Number.parseInt(v))}>
            <SelectTrigger className="w-[90px] h-8"><SelectValue placeholder="Año" /></SelectTrigger>
            <SelectContent className="max-h-60">
              {years.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => {
            setDate(newDate)
            if (newDate) { setYear(newDate.getFullYear()); setMonth(newDate.getMonth()) }
            setCalendarOpen(false)
          }}
          initialFocus
          locale={es}
          month={new Date(year, month)}
          onMonthChange={(m) => { setMonth(m.getMonth()); setYear(m.getFullYear()) }}
          className="border-t rounded-none"
        />
      </PopoverContent>
    </Popover>
  )
}

const useToast = () => {
  const [toasts, setToasts] = useState([])
  const toast = ({ title, description = "", variant = "default" }) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, title, description, variant }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }
  return { toast, toasts }
}

const Toast = ({ toast }) => {
  const bg = toast.variant === "destructive" ? "bg-red-500" : toast.variant === "success" ? "bg-green-500" : "bg-blue-500"
  return (
    <div className={`${bg} text-white p-3 rounded-lg shadow-lg mb-2 transition-all animate-in slide-in-from-right-5`}>
      <div className="font-medium">{toast.title}</div>
      {toast.description && <div className="text-sm">{toast.description}</div>}
    </div>
  )
}

const ToastContainer = ({ toasts }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
    {toasts.map((t) => <Toast key={t.id} toast={t} />)}
  </div>
)

const FormSteps = ({ currentStep, totalSteps }) => (
  <div className="mb-6">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-medium">Paso {currentStep} de {totalSteps}</span>
      <span className="text-sm text-muted-foreground">
        {currentStep === 1 ? "Información personal" : currentStep === 2 ? "Condiciones de salud" : "Pago y términos"}
      </span>
    </div>
    <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
  </div>
)

const emptyForm = {
  nombre: "", apellido: "", dni: "", fechaNacimiento: "", localidad: "",
  email: "", telefono: "", paisTelefono: "Argentina",
  telefonoEmergencia: "", paisTelefonoEmergencia: "Argentina",
  grupoSanguineo: "", genero: "", grupoCiclistas: "", talleRemera: "",
  condicionesSalud: "", esCeliaco: "",
  nombreTransferencia: "",
  transferidoA: "",
  aceptaCondiciones: false, comprobantePago: null, comprobantePagoUrl: "",
}

export default function InscripcionAño() {
  const params = useParams()
  const añoParam = Number(params.año)

  const { toast, toasts } = useToast()
  const [cicloStatus, setCicloStatus] = useState<"loading" | "open">("loading")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [currentStep, setCurrentStep] = useState(1)
  const topRef = useRef(null)
  const [birthDate, setBirthDate] = useState(undefined)
  const [grupoCiclistasOpen, setGrupoCiclistasOpen] = useState(false)
  const [gruposFirebase, setGruposFirebase] = useState<string[]>([])
  const [dniLookingUp, setDniLookingUp] = useState(false)
  const [dniFound, setDniFound] = useState(false)
  const [isEdicion, setIsEdicion] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [datosPago1, setDatosPago1] = useState("")
  const [datosPago2, setDatosPago2] = useState("")
  const [confirmacionData, setConfirmacionData] = useState({
    titulo: "¡Inscripción Exitosa!",
    descripcion: `Tu inscripción al Cicloturismo Termal ${añoParam} ha sido registrada exitosamente.`,
    mensaje: "Pronto recibirás un correo de confirmación con todos los detalles.\nRecuerda presentar tu DNI el día del evento para la acreditación.",
    infoExtra: "• Presentate con tu DNI el día del evento.\n• Lugar de acreditación: Frente al predio de la Terminal de Ómnibus de Federación.\n• Horario de acreditación: 7:30 AM\n• Horario de salida: 8:30 AM",
  })

  const totalSteps = 3

  // Cargar settings y abrir inscripción directamente
  useEffect(() => {
    if (!añoParam || isNaN(añoParam)) { setCicloStatus("open"); return }
    const check = async () => {
      try {
        const [settingsRes, confirmRes] = await Promise.all([
          supabase.from("settings").select("data").eq("id", "eventSettings").single(),
          supabase.from("settings").select("data").eq("id", "confirmacion").single(),
        ])
        const d = settingsRes.data?.data ?? {}
        if (d) {
          setDatosPago1(d.datosPago1 ?? "")
          setDatosPago2(d.datosPago2 ?? "")
        }
        const confirmData = confirmRes.data?.data ?? {}
        if (confirmData) {
          setConfirmacionData((prev) => ({
            titulo: confirmData.titulo || prev.titulo,
            descripcion: confirmData.descripcion || prev.descripcion,
            mensaje: confirmData.mensaje || prev.mensaje,
            infoExtra: confirmData.infoExtra || prev.infoExtra,
          }))
        }
      } catch {}
      setCicloStatus("open")
    }
    check()
  }, [añoParam])

  useEffect(() => {
    const loadGrupos = async () => {
      try {
        const { data: row } = await supabase.from("configuracion").select("data").eq("id", "grupos").single()
        if (row?.data?.lista) setGruposFirebase(row.data.lista)
      } catch {}
    }
    loadGrupos()
  }, [])

  const parseFecha = (s: string): Date | null => {
    for (const fmt of ["yyyy-MM-dd", "dd/MM/yyyy", "d/M/yyyy", "MM/dd/yyyy"]) {
      try {
        const p = parse(s, fmt, new Date())
        if (!isNaN(p.getTime())) return p
      } catch {}
    }
    return null
  }

  const normalizeGenero = (v: string) => {
    const map: Record<string, string> = { masculino: "Masculino", femenino: "Femenino", otro: "Otro" }
    return map[v?.toLowerCase()] ?? v
  }

  // Lookup DNI via API route con service role (bypasea RLS)
  const lookupDni = async (dni: string) => {
    if (!dni || dni.length < 7) return
    setDniLookingUp(true)
    try {
      const res = await fetch(`/api/lookup-participant?dni=${encodeURIComponent(dni.trim())}`)
      const json = await res.json()
      if (!res.ok) {
        console.error("[lookupDni] API error:", json.error)
        toast({ title: "Error al buscar DNI", description: json.error || "Error desconocido", variant: "destructive" })
        setDniFound(false)
        return
      }
      if (!json.found || !json.data) { setDniFound(false); setIsEdicion(false); return }
      const existing = json.data
      const grupoSanguineo = existing.grupo_sanguineo ? String(existing.grupo_sanguineo).toUpperCase() : undefined
      const genero = existing.genero ? normalizeGenero(String(existing.genero)) : undefined
      setFormData((prev) => ({
        ...prev,
        nombre: existing.nombre ?? prev.nombre,
        apellido: existing.apellido ?? prev.apellido,
        email: existing.email ?? prev.email,
        telefono: existing.telefono ?? prev.telefono,
        paisTelefono: existing.pais_telefono ?? prev.paisTelefono,
        telefonoEmergencia: existing.telefono_emergencia ?? prev.telefonoEmergencia,
        paisTelefonoEmergencia: existing.pais_telefono_emergencia ?? prev.paisTelefonoEmergencia,
        fechaNacimiento: existing.fecha_nacimiento ?? prev.fechaNacimiento,
        localidad: existing.localidad ?? prev.localidad,
        grupoSanguineo: grupoSanguineo ?? prev.grupoSanguineo,
        genero: genero ?? prev.genero,
        grupoCiclistas: existing.grupo_ciclistas ?? prev.grupoCiclistas,
      }))
      if (existing.fecha_nacimiento) {
        const parsed = parseFecha(String(existing.fecha_nacimiento))
        if (parsed) setBirthDate(parsed)
      }
      const años: number[] = existing.años ?? []
      const esEdicion = años.includes(añoParam)
      setIsEdicion(esEdicion)
      setDniFound(true)
      toast({
        title: esEdicion ? "Edición de inscripción" : "Perfil encontrado",
        description: esEdicion
          ? "Ya estás inscripto este año. Tus datos se cargaron para editar."
          : "Se precargaron tus datos personales.",
        variant: "success",
      })
    } catch {
      // El usuario puede completar los datos manualmente
    } finally {
      setDniLookingUp(false)
    }
  }

  // Dispara el lookup mientras el usuario escribe (debounce 600ms)
  useEffect(() => {
    const dni = formData.dni.trim()
    if (dni.length < 7) return
    const timer = setTimeout(() => lookupDni(dni), 600)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.dni])

  useEffect(() => {
    if (birthDate) setFormData((prev) => ({ ...prev, fechaNacimiento: format(birthDate, "yyyy-MM-dd") }))
  }, [birthDate])

  useEffect(() => {
    if (formData.fechaNacimiento && !birthDate) {
      const p = parseFecha(formData.fechaNacimiento)
      if (p) setBirthDate(p)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.fechaNacimiento])

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false)
    setFormData(emptyForm)
    setBirthDate(undefined)
    setFieldErrors({})
    setCurrentStep(1)
    setDniFound(false)
    setIsEdicion(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const validateName = (v) => /^[A-Za-zÁáÉéÍíÓóÚúÜüÑñ\s]+$/.test(v)
  const validateDNI = (v) => /^\d+$/.test(v)
  const validateEmail = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  const validatePhone = (v) => !v || /^\d+$/.test(v.replace(/\D/g, ""))

  const validateField = (name, value) => {
    switch (name) {
      case "nombre": return validateName(value) ? "" : "Solo debe contener letras"
      case "apellido": return validateName(value) ? "" : "Solo debe contener letras"
      case "dni": return validateDNI(value) ? "" : "Solo números, 7-8 dígitos"
      case "email": return validateEmail(value) ? "" : "Formato de email inválido"
      case "telefono": return validatePhone(value) ? "" : "Solo números"
      case "nombreTransferencia": return validateName(value) ? "" : "Solo debe contener letras"
      default: return ""
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    const newValue = type === "checkbox" ? e.target.checked : value
    setFormData((prev) => ({ ...prev, [name]: newValue }))
    if (["nombre", "apellido", "dni", "email", "telefono", "nombreTransferencia"].includes(name)) {
      setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, newValue) }))
    }
  }

  const handleCheckboxChange = (name, checked) => setFormData((prev) => ({ ...prev, [name]: checked }))
  const handleSelectChange = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }))

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Archivo demasiado grande", description: "Debe ser menor a 5MB.", variant: "destructive" })
      e.target.value = ""; return
    }
    if (!["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(file.type)) {
      toast({ title: "Tipo de archivo no válido", description: "Solo JPG, PNG o PDF.", variant: "destructive" })
      e.target.value = ""; return
    }
    setFormData((prev) => ({ ...prev, comprobantePago: file }))
    toast({ title: "Archivo cargado", description: "Comprobante cargado correctamente.", variant: "success" })
  }

  const convertToBase64 = (file): Promise<string> =>
    new Promise((resolve, reject) => {
      if (file.size > 5 * 1024 * 1024) { reject(new Error("Archivo demasiado grande")); return }
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        if (result.length > 7000000) { reject(new Error("Archivo comprimido sigue siendo demasiado grande")); return }
        resolve(result)
      }
      reader.onerror = () => reject(new Error("Error al procesar el archivo"))
    })

  const validateStep = (step) => {
    const errors: any = {}
    if (step === 1) {
      if (!formData.nombre) errors.nombre = "Obligatorio"
      else if (!validateName(formData.nombre)) errors.nombre = "Solo letras"
      if (!formData.apellido) errors.apellido = "Obligatorio"
      else if (!validateName(formData.apellido)) errors.apellido = "Solo letras"
      if (!formData.dni) errors.dni = "Obligatorio"
      else if (!validateDNI(formData.dni)) errors.dni = "Solo números"
      if (!formData.fechaNacimiento) errors.fechaNacimiento = "Obligatoria"
      if (!formData.localidad) errors.localidad = "Obligatoria"
      if (!formData.email) errors.email = "Obligatorio"
      else if (!validateEmail(formData.email)) errors.email = "Formato inválido"
      if (!formData.telefono) errors.telefono = "Obligatorio"
      if (!formData.telefonoEmergencia) errors.telefonoEmergencia = "Obligatorio"
      if (!formData.grupoSanguineo) errors.grupoSanguineo = "Obligatorio"
      if (!formData.genero) errors.genero = "Obligatorio"
      if (!formData.grupoCiclistas) errors.grupoCiclistas = "Obligatorio"
    } else if (step === 2) {
      if (!formData.esCeliaco) errors.esCeliaco = "Debe indicar si es celíaco"
    } else if (step === 3) {
      if (!formData.aceptaCondiciones) errors.aceptaCondiciones = "Debe aceptar los términos"
      if (!formData.nombreTransferencia) errors.nombreTransferencia = "Obligatorio"
      else if (!validateName(formData.nombreTransferencia)) errors.nombreTransferencia = "Solo letras"
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      toast({ title: "Revisá los datos", description: Object.values(errors)[0] as string, variant: "destructive" })
      return false
    }
    return true
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
    topRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return
    setIsSubmitting(true)
    try {
      let imagenBase64 = ""
      if (formData.comprobantePago) {
        try {
          imagenBase64 = await convertToBase64(formData.comprobantePago)
        } catch {
          toast({ title: "No se pudo procesar el comprobante", description: "Intentá subir otra imagen", variant: "destructive" })
          setIsSubmitting(false)
          return
        }
      }

      const condicionSalud = JSON.stringify({
        condicionesSalud: formData.condicionesSalud || "",
        esCeliaco: formData.esCeliaco || "no",
      })

      const perfilPersonal = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email || "",
        telefono: formData.telefono || "",
        paisTelefono: formData.paisTelefono || "Argentina",
        telefonoEmergencia: formData.telefonoEmergencia || "",
        paisTelefonoEmergencia: formData.paisTelefonoEmergencia || "Argentina",
        fechaNacimiento: formData.fechaNacimiento || "",
        genero: formData.genero || "",
        grupoSanguineo: formData.grupoSanguineo || "",
        condicionSalud,
        localidad: formData.localidad || "",
        grupoCiclistas: formData.grupoCiclistas || "",
        imagenBase64,
      }

      const datosCiclo = {
        talleRemera: formData.talleRemera || "",
        aceptaTerminos: formData.aceptaCondiciones,
        nombreTransferencia: formData.nombreTransferencia || "",
        transferidoA: formData.transferidoA || "",
      }

      const grupoIngresado = formData.grupoCiclistas.trim()
      const todosActuales = [...new Set([...gruposCiclistas, ...gruposFirebase])]
      const gruposExistentes = todosActuales

      const res = await fetch("/api/inscripcion/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dni: formData.dni,
          añoParam,
          perfilPersonal,
          datosCiclo,
          grupoIngresado,
          gruposExistentes,
          nombreArchivo: formData.comprobantePago?.name ?? null,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        toast({ title: "No se pudo completar la inscripción", description: json.error || "Revisá tu conexión e intentá de nuevo", variant: "destructive" })
        return
      }

      if (grupoIngresado && grupoIngresado !== "No pertenezco a ninguno" && !gruposExistentes.some((g) => g.toLowerCase() === grupoIngresado.toLowerCase())) {
        setGruposFirebase((prev) => [...prev, grupoIngresado])
      }

      setSubmitted(true)
      setShowSuccessDialog(true)
    } catch (error) {
      toast({ title: "No se pudo completar la inscripción", description: "Revisá tu conexión e intentá de nuevo", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => { window.scrollTo(0, 0) }, [])

  // ── Páginas de estado ────────────────────────────────────
  if (cicloStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  // ── Renderizado de pasos ─────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border shadow-sm">
              <h3 className="font-medium text-lg mb-4 text-gray-800 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Información Personal
              </h3>

              {dniFound && !isEdicion && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-800">Perfil encontrado</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Se precargaron tus datos personales. Revisalos y actualizalos si es necesario.
                  </AlertDescription>
                </Alert>
              )}
              {dniFound && isEdicion && (
                <Alert className="mb-4 bg-amber-50 border-amber-300">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800 font-bold">ES EDICIÓN</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Ya tenés una inscripción para {añoParam}. Al completar el formulario, se actualizarán tus datos.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="dni" className="flex justify-between">
                    <span>DNI *</span>
                    {fieldErrors.dni && <span className="text-red-500 text-xs">{fieldErrors.dni}</span>}
                  </Label>
                  <div className="relative max-w-xs">
                    <Input
                      id="dni" name="dni" value={formData.dni}
                      onChange={handleInputChange}
                      className={fieldErrors.dni ? "border-red-500 pr-8" : "pr-8"}
                      placeholder="Ej: 32456789"
                    />
                    {dniLookingUp && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-gray-400" />}
                    {!dniLookingUp && dniFound && <CheckCircle2 className="absolute right-2 top-2.5 h-4 w-4 text-green-500" />}
                  </div>
                  <p className="text-xs text-gray-500">Si ya participaste antes, tus datos se cargarán automáticamente.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="flex justify-between">
                    <span>Nombre *</span>
                    {fieldErrors.nombre && <span className="text-red-500 text-xs">{fieldErrors.nombre}</span>}
                  </Label>
                  <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} className={fieldErrors.nombre ? "border-red-500" : ""} placeholder="Ej: Juan Carlos" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido" className="flex justify-between">
                    <span>Apellido *</span>
                    {fieldErrors.apellido && <span className="text-red-500 text-xs">{fieldErrors.apellido}</span>}
                  </Label>
                  <Input id="apellido" name="apellido" value={formData.apellido} onChange={handleInputChange} className={fieldErrors.apellido ? "border-red-500" : ""} placeholder="Ej: Gómez" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaNacimiento" className="flex justify-between">
                    <span>Fecha de nacimiento *</span>
                    {fieldErrors.fechaNacimiento && <span className="text-red-500 text-xs">{fieldErrors.fechaNacimiento}</span>}
                  </Label>
                  <DatePicker date={birthDate} setDate={setBirthDate} placeholder="Seleccionar fecha" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localidad" className="flex justify-between">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-gray-500" />Localidad *</span>
                    {fieldErrors.localidad && <span className="text-red-500 text-xs">{fieldErrors.localidad}</span>}
                  </Label>
                  <Input id="localidad" name="localidad" value={formData.localidad} onChange={handleInputChange} placeholder="Ej: Buenos Aires" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex justify-between items-center">
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-gray-500" />Email *</span>
                    {fieldErrors.email && <span className="text-red-500 text-xs">{fieldErrors.email}</span>}
                  </Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} className={fieldErrors.email ? "border-red-500" : ""} placeholder="Ej: ejemplo@correo.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono" className="flex justify-between items-center">
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-gray-500" />Teléfono *</span>
                    {fieldErrors.telefono && <span className="text-red-500 text-xs">{fieldErrors.telefono}</span>}
                  </Label>
                  <div className="flex gap-2">
                    <Select name="paisTelefono" value={formData.paisTelefono || "Argentina"} onValueChange={(v) => handleSelectChange("paisTelefono", v)}>
                      <SelectTrigger className="w-[140px]"><SelectValue placeholder="País" /></SelectTrigger>
                      <SelectContent>{paises.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input id="telefono" name="telefono" value={formData.telefono} onChange={handleInputChange} className={fieldErrors.telefono ? "border-red-500" : ""} placeholder="Ej: 11 5555 5555" />
                  </div>
                  <p className="text-xs text-gray-500">Solo números, sin espacios ni guiones.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefonoEmergencia" className="flex justify-between items-center">
                    <span className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" />Teléfono de emergencia *</span>
                    {fieldErrors.telefonoEmergencia && <span className="text-red-500 text-xs">{fieldErrors.telefonoEmergencia}</span>}
                  </Label>
                  <div className="flex gap-2">
                    <Select name="paisTelefonoEmergencia" value={formData.paisTelefonoEmergencia || "Argentina"} onValueChange={(v) => handleSelectChange("paisTelefonoEmergencia", v)}>
                      <SelectTrigger className="w-[140px]"><SelectValue placeholder="País" /></SelectTrigger>
                      <SelectContent>{paises.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input id="telefonoEmergencia" name="telefonoEmergencia" value={formData.telefonoEmergencia} onChange={handleInputChange} className={fieldErrors.telefonoEmergencia ? "border-red-500" : ""} placeholder="Ej: 11 4444 4444" />
                  </div>
                  <p className="text-xs text-gray-500">Solo números, sin espacios ni guiones.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grupoSanguineo" className="flex justify-between">
                    <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-red-500" />Grupo sanguíneo *</span>
                    {fieldErrors.grupoSanguineo && <span className="text-red-500 text-xs">{fieldErrors.grupoSanguineo}</span>}
                  </Label>
                  <Select name="grupoSanguineo" value={formData.grupoSanguineo} onValueChange={(v) => handleSelectChange("grupoSanguineo", v)}>
                    <SelectTrigger className={fieldErrors.grupoSanguineo ? "border-red-500" : ""}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex justify-between">
                    <span>Género *</span>
                    {fieldErrors.genero && <span className="text-red-500 text-xs">{fieldErrors.genero}</span>}
                  </Label>
                  <RadioGroup value={formData.genero} onValueChange={(v) => handleSelectChange("genero", v)} className="flex flex-col space-y-1 mt-2">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Masculino" id="genero-m" /><Label htmlFor="genero-m" className="font-normal">Masculino</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Femenino" id="genero-f" /><Label htmlFor="genero-f" className="font-normal">Femenino</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Otro" id="genero-o" /><Label htmlFor="genero-o" className="font-normal">Prefiero no especificar</Label></div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grupoCiclistas" className="flex justify-between">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-indigo-500" />Grupo de ciclistas *</span>
                    {fieldErrors.grupoCiclistas && <span className="text-red-500 text-xs">{fieldErrors.grupoCiclistas}</span>}
                  </Label>
                  {(() => {
                    const todosLosGrupos = [...new Set([...gruposCiclistas, ...gruposFirebase])]
                    const q = formData.grupoCiclistas.toLowerCase().trim()
                    const opcionesFiltradas = q
                      ? todosLosGrupos.filter((g) => g.toLowerCase().includes(q))
                      : todosLosGrupos
                    const noPertenece = "No pertenezco a ninguno"
                    const mostrarNoPertenece = !q || noPertenece.toLowerCase().includes(q)
                    const exactMatch = todosLosGrupos.some((g) => g.toLowerCase() === q) || q === noPertenece.toLowerCase()
                    const sugerido = !exactMatch && q.length >= 3
                      ? todosLosGrupos.find((g) => g.toLowerCase().includes(q))
                      : null
                    return (
                      <div className="relative">
                        <Input
                          id="grupoCiclistas" name="grupoCiclistas" value={formData.grupoCiclistas}
                          onChange={(e) => { setFormData({ ...formData, grupoCiclistas: e.target.value }); setGrupoCiclistasOpen(true) }}
                          onFocus={() => setGrupoCiclistasOpen(true)}
                          onBlur={() => setTimeout(() => setGrupoCiclistasOpen(false), 150)}
                          placeholder="Escriba o seleccione su grupo"
                          className={fieldErrors.grupoCiclistas ? "border-red-500" : ""}
                          autoComplete="off"
                        />
                        {grupoCiclistasOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[220px] overflow-y-auto p-1">
                            {sugerido && (
                              <div className="border-b mb-1 pb-1">
                                <p className="text-xs text-gray-400 px-2 pt-1">¿Quisiste decir?</p>
                                <button type="button"
                                  className="w-full text-left px-2 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 rounded"
                                  onMouseDown={(e) => { e.preventDefault(); handleSelectChange("grupoCiclistas", sugerido); setGrupoCiclistasOpen(false) }}>
                                  → {sugerido}
                                </button>
                              </div>
                            )}
                            {mostrarNoPertenece && (
                              <button type="button" className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded"
                                onMouseDown={(e) => { e.preventDefault(); handleSelectChange("grupoCiclistas", noPertenece); setGrupoCiclistasOpen(false) }}>
                                {noPertenece}
                              </button>
                            )}
                            {opcionesFiltradas.map((g) => (
                              <button key={g} type="button" className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded"
                                onMouseDown={(e) => { e.preventDefault(); handleSelectChange("grupoCiclistas", g); setGrupoCiclistasOpen(false) }}>
                                {g}
                              </button>
                            ))}
                            {q && opcionesFiltradas.length === 0 && !mostrarNoPertenece && (
                              <p className="text-xs text-gray-400 px-2 py-2">No se encontraron grupos. Se guardará &quot;{formData.grupoCiclistas}&quot; al inscribirse.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                  <p className="text-xs text-gray-500">Escriba el nombre de su grupo o seleccione uno de la lista. Si no existe, se guardará automáticamente.</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border shadow-sm">
              <h3 className="font-medium text-lg mb-4 text-gray-800 flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Condiciones de salud y medicamentos
              </h3>
              <div className="space-y-2">
                <Label htmlFor="condicionesSalud">Indique condiciones de salud, alergias o medicamentos:</Label>
                <Textarea id="condicionesSalud" name="condicionesSalud" value={formData.condicionesSalud} onChange={handleInputChange}
                  placeholder="Describa alergias, medicamentos o condiciones relevantes para actividad física." className="min-h-32" />
                <p className="text-xs text-gray-500">Si no tiene condiciones especiales, puede dejar en blanco.</p>
              </div>
              <div className="space-y-2 mt-4 border-t pt-4">
                <Label htmlFor="esCeliaco" className="flex justify-between">
                  <span className="flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5 text-amber-500" />¿Es usted celíaco? *</span>
                  {fieldErrors.esCeliaco && <span className="text-red-500 text-xs">{fieldErrors.esCeliaco}</span>}
                </Label>
                <RadioGroup value={formData.esCeliaco} onValueChange={(v) => handleSelectChange("esCeliaco", v)} className="flex flex-col space-y-1 mt-2">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="si" id="celiaco-si" /><Label htmlFor="celiaco-si" className="font-normal">Sí</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="celiaco-no" /><Label htmlFor="celiaco-no" className="font-normal">No</Label></div>
                </RadioGroup>
                <p className="text-xs text-gray-500">*Necesario para preparar el desayuno incluido en el evento.</p>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
              <h3 className="font-medium text-lg mb-4 text-blue-800 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Información de pago
              </h3>
              {(datosPago1 || datosPago2) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  {datosPago1 && (
                    <Alert className="bg-white border-blue-200">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      <AlertTitle className="text-blue-800">Dato de pago 1 - Argentina</AlertTitle>
                      <AlertDescription className="text-blue-700 whitespace-pre-line mt-2 text-sm">
                        {datosPago1}
                      </AlertDescription>
                    </Alert>
                  )}
                  {datosPago2 && (
                    <Alert className="bg-white border-green-200">
                      <AlertCircle className="h-4 w-4 text-green-500" />
                      <AlertTitle className="text-green-800">Dato de pago 2 - Uruguay</AlertTitle>
                      <AlertDescription className="text-green-700 whitespace-pre-line mt-2 text-sm">
                        {datosPago2}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="space-y-4 mt-4 border-t pt-4">
                <h4 className="font-medium text-gray-800 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Detalles de la transferencia
                </h4>
                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="nombreTransferencia" className="flex justify-between">
                    <span>Nombre de quien transfiere *</span>
                    {fieldErrors.nombreTransferencia && <span className="text-red-500 text-xs">{fieldErrors.nombreTransferencia}</span>}
                  </Label>
                  <Input id="nombreTransferencia" name="nombreTransferencia" value={formData.nombreTransferencia} onChange={handleInputChange}
                    className={fieldErrors.nombreTransferencia ? "border-red-500" : ""} placeholder="Nombre completo" />
                </div>
                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="transferidoA">Transfirió a *</Label>
                  <Select name="transferidoA" value={formData.transferidoA} onValueChange={(v) => setFormData((prev) => ({ ...prev, transferidoA: v }))}>
                    <SelectTrigger className={fieldErrors.transferidoA ? "border-red-500" : ""}><SelectValue placeholder="Seleccionar destinatario" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gisela Orbes">Gisela Orbes</SelectItem>
                      <SelectItem value="Brunilda Schubert">Brunilda Schubert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 mt-6 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="comprobantePago" className="flex justify-between">
                    <span className="flex items-center gap-1"><FileText className="h-4 w-4" />Comprobante de pago</span>
                  </Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center transition-colors border-gray-300 hover:border-blue-400">
                    {formData.comprobantePago ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                        <p className="text-sm font-medium">{formData.comprobantePago.name}</p>
                        <p className="text-xs text-gray-500">{(formData.comprobantePago.size / 1024).toFixed(1)} KB</p>
                        <Button variant="outline" size="sm" onClick={() => setFormData((prev) => ({ ...prev, comprobantePago: null }))}>
                          Cambiar archivo
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <UploadCloud className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-600">Haga clic para subir o arrastre el archivo aquí</span>
                        <span className="text-xs text-gray-400">JPG, PNG o PDF (máx. 5MB)</span>
                        <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFileChange} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border shadow-sm">
              <Accordion type="single" collapsible>
                <AccordionItem value="terms">
                  <AccordionTrigger className="text-sm font-medium">Términos y condiciones del evento</AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600 space-y-2">
                    <p>Al inscribirse, acepta participar bajo los términos del Cicloturismo Termal de Federación.</p>
                    <p>Los participantes deben presentarse con su DNI el día del evento para la acreditación.</p>
                    <p>La organización no se responsabiliza por accidentes o lesiones durante el recorrido.</p>
                    <p>La inscripción no es reembolsable una vez confirmada.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <div className="mt-4 flex items-center gap-3 rounded-lg border-2 border-red-500 bg-red-50 p-4 text-red-800 shadow-sm">
                <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
                <p className="text-sm font-bold uppercase tracking-wide sm:text-base">
                  No se devuelve el dinero de la inscripción una vez realizada
                </p>
              </div>
              <div className="flex items-start space-x-2 mt-4">
                <Checkbox
                  id="aceptaCondiciones" name="aceptaCondiciones"
                  checked={formData.aceptaCondiciones}
                  onCheckedChange={(c) => handleCheckboxChange("aceptaCondiciones", c)}
                  className={fieldErrors.aceptaCondiciones ? "border-red-500" : ""}
                />
                <div className="space-y-1">
                  <Label htmlFor="aceptaCondiciones" className="text-sm font-medium leading-none">
                    Acepto los términos y condiciones *
                  </Label>
                  {fieldErrors.aceptaCondiciones && <p className="text-red-500 text-xs">{fieldErrors.aceptaCondiciones}</p>}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <ToastContainer toasts={toasts} />
      <main className="container mx-auto px-4 py-8">
        <div ref={topRef}></div>
        <div className="max-w-4xl mx-auto mb-6">
          <Button onClick={() => (window.location.href = "/")} variant="outline" className="flex items-center gap-2 bg-white hover:bg-gray-100 shadow-sm">
            <Home className="h-4 w-4" />
            Volver a la página principal
          </Button>
        </div>

        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="bg-white max-w-md overflow-hidden p-0" onOpenAutoFocus={(e) => { e.preventDefault(); document.getElementById("understood-button")?.focus() }}>
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-6">
              <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <DialogTitle className="text-2xl font-bold text-white text-center">{confirmacionData.titulo}</DialogTitle>
            </div>
            <div className="p-6">
              <DialogDescription className="text-gray-700 text-base mb-4">
                {confirmacionData.descripcion.split("\n").map((line, i) => (
                  <div key={i} className="mb-3">{line}</div>
                ))}
                {confirmacionData.mensaje.split("\n").map((line, i) => (
                  <div key={`m${i}`} className="mb-3">{line}</div>
                ))}
              </DialogDescription>
              {confirmacionData.infoExtra && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4">
                  <h4 className="text-green-800 font-medium flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4" />
                    Información importante
                  </h4>
                  <ul className="text-green-700 text-sm space-y-1">
                    {confirmacionData.infoExtra.split("\n").map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter className="bg-gray-50 p-4 flex flex-col gap-2">
              <Button id="understood-button" onClick={handleCloseSuccessDialog} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                Entendido
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/")} className="w-full bg-transparent">
                Volver a la página principal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="max-w-4xl mx-auto shadow-lg border-0">
          <CardHeader className="rounded-t-lg" style={{ background: `linear-gradient(90deg, ${AMARILLO}, ${VERDE}, ${CELESTE})` }}>
            <CardTitle className="text-3xl font-bold text-center text-gray-900 drop-shadow-sm">
              Inscripción Cicloturismo Termal {añoParam}
            </CardTitle>
            <CardDescription className="text-center text-gray-800 font-medium">
              Complete el formulario para registrarse en el evento
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <FormSteps currentStep={currentStep} totalSteps={totalSteps} />
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {renderStep()}
            </form>
          </CardContent>
          <CardFooter className="bg-gray-50 rounded-b-lg flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-3 w-full sm:w-auto">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep} className="flex items-center gap-1 bg-transparent">
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
              )}
              {currentStep < totalSteps ? (
                <Button type="button" onClick={nextStep} className="flex items-center gap-1 text-gray-900 font-semibold border-0" style={{ background: `linear-gradient(90deg, ${VERDE}, ${CELESTE})` }}>
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" className="flex-1 text-gray-900 font-semibold border-0" style={{ background: `linear-gradient(90deg, ${VERDE}, ${CELESTE})` }} disabled={isSubmitting} onClick={handleSubmit}>
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando inscripción...</>
                  ) : (
                    <><CheckCircle2 className="mr-2 h-4 w-4" />Completar inscripción</>
                  )}
                </Button>
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" className="text-gray-500 hover:text-gray-700"
                    onClick={() => { setFormData(emptyForm); setBirthDate(undefined); setFieldErrors({}); setDniFound(false); setIsEdicion(false) }}>
                    Limpiar formulario
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Borrar todos los datos ingresados</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardFooter>
        </Card>

        <div className="text-center mt-8 text-sm text-gray-500 space-y-4">
          <a
            href="https://linktr.ee/serviteccdelu"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-col items-center gap-2 group"
          >
            <span className="text-sm font-black text-gray-600 group-hover:text-gray-900 transition-colors">
              Página web desarrollada por
            </span>
            <img src="/ServiTec.png" alt="ServiTec" className="h-28 object-contain group-hover:scale-105 transition-transform" />
          </a>
          <p>© {añoParam} Cicloturismo Termal - Todos los derechos reservados</p>
        </div>
      </main>
    </div>
  )
}
