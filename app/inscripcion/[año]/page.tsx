"use client"
import { DialogFooter } from "@/components/ui/dialog"
import { useState, useRef, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { collection, getDocs, query, orderBy, setDoc, doc, getDoc, where, arrayUnion } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-config"
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
  Clock,
  Search,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import emailjs from "@emailjs/browser"

if (typeof window !== "undefined") {
  emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_KEY_INSCRIPCION!)
}

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
  condicionesSalud: "", esCeliaco: "", recorrido: "",
  transferidoA: "", nombreTransferencia: "", horarioTransferencia: "",
  aceptaCondiciones: false, comprobantePago: null, comprobantePagoUrl: "",
}

export default function InscripcionAño() {
  const params = useParams()
  const añoParam = Number(params.año)

  const { toast, toasts } = useToast()
  const [cicloStatus, setCicloStatus] = useState<"loading" | "not_found" | "disabled" | "closed" | "open">("loading")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [currentStep, setCurrentStep] = useState(1)
  const topRef = useRef(null)
  const [birthDate, setBirthDate] = useState(undefined)
  const [grupoCiclistasOpen, setGrupoCiclistasOpen] = useState(false)
  const [dniLookingUp, setDniLookingUp] = useState(false)
  const [dniFound, setDniFound] = useState(false)
  const [formData, setFormData] = useState(emptyForm)

  const totalSteps = 3

  // Verificar estado del ciclo
  useEffect(() => {
    if (!añoParam || isNaN(añoParam)) { setCicloStatus("not_found"); return }
    const check = async () => {
      try {
        const snap = await getDoc(doc(db, "configuracion", "inscripciones"))
        if (!snap.exists()) { setCicloStatus("not_found"); return }
        const ciclos: any[] = snap.data().ciclos || []
        const ciclo = ciclos.find((c) => c.año === añoParam)
        if (!ciclo) { setCicloStatus("not_found"); return }
        if (!ciclo.habilitado) { setCicloStatus("disabled"); return }
        const today = new Date().toISOString().slice(0, 10)
        if (ciclo.fechaDesde && today < ciclo.fechaDesde) { setCicloStatus("closed"); return }
        if (ciclo.fechaHasta && today > ciclo.fechaHasta) { setCicloStatus("closed"); return }
        setCicloStatus("open")
      } catch {
        setCicloStatus("not_found")
      }
    }
    check()
  }, [añoParam])

  // Lookup DNI en participantesCicloTermal
  const lookupDni = async (dni: string) => {
    if (!dni || dni.length < 7) return
    setDniLookingUp(true)
    try {
      const snap = await getDoc(doc(db, "participantesCicloTermal", dni))
      if (snap.exists()) {
        const data = snap.data()
        setFormData((prev) => ({
          ...prev,
          nombre: data.nombre || prev.nombre,
          apellido: data.apellido || prev.apellido,
          email: data.email || prev.email,
          telefono: data.telefono || prev.telefono,
          paisTelefono: data.paisTelefono || prev.paisTelefono,
          telefonoEmergencia: data.telefonoEmergencia || prev.telefonoEmergencia,
          paisTelefonoEmergencia: data.paisTelefonoEmergencia || prev.paisTelefonoEmergencia,
          fechaNacimiento: data.fechaNacimiento || prev.fechaNacimiento,
          localidad: data.localidad || prev.localidad,
          grupoSanguineo: data.grupoSanguineo || prev.grupoSanguineo,
          genero: data.genero || prev.genero,
          grupoCiclistas: data.grupoCiclistas || prev.grupoCiclistas,
        }))
        if (data.fechaNacimiento) {
          try {
            const parsed = parse(data.fechaNacimiento, "yyyy-MM-dd", new Date())
            if (!isNaN(parsed.getTime())) setBirthDate(parsed)
          } catch { /* ignorar */ }
        }
        setDniFound(true)
        toast({ title: "Perfil encontrado", description: "Se precargaron tus datos personales.", variant: "success" })
      } else {
        setDniFound(false)
      }
    } catch { /* ignorar */ } finally {
      setDniLookingUp(false)
    }
  }

  useEffect(() => {
    if (birthDate) setFormData((prev) => ({ ...prev, fechaNacimiento: format(birthDate, "yyyy-MM-dd") }))
  }, [birthDate])

  useEffect(() => {
    if (formData.fechaNacimiento && !birthDate) {
      try {
        const p = parse(formData.fechaNacimiento, "yyyy-MM-dd", new Date())
        if (!isNaN(p.getTime())) setBirthDate(p)
      } catch { /* ignorar */ }
    }
  }, [formData.fechaNacimiento])

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false)
    setFormData(emptyForm)
    setBirthDate(undefined)
    setFieldErrors({})
    setCurrentStep(1)
    setDniFound(false)
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
    setFormData({ ...formData, [name]: newValue })
    if (["nombre", "apellido", "dni", "email", "telefono", "nombreTransferencia"].includes(name)) {
      setFieldErrors({ ...fieldErrors, [name]: validateField(name, newValue) })
    }
  }

  const handleDniBlur = () => {
    if (formData.dni && formData.dni.length >= 7) lookupDni(formData.dni)
  }

  const handleCheckboxChange = (name, checked) => setFormData({ ...formData, [name]: checked })
  const handleSelectChange = (name, value) => setFormData({ ...formData, [name]: value })

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
    setFormData({ ...formData, comprobantePago: file })
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
      if (!formData.recorrido) errors.recorrido = "Obligatorio"
    } else if (step === 2) {
      if (!formData.esCeliaco) errors.esCeliaco = "Debe indicar si es celíaco"
    } else if (step === 3) {
      if (!formData.aceptaCondiciones) errors.aceptaCondiciones = "Debe aceptar los términos"
      if (!formData.nombreTransferencia) errors.nombreTransferencia = "Obligatorio"
      else if (!validateName(formData.nombreTransferencia)) errors.nombreTransferencia = "Solo letras"
      if (!formData.horarioTransferencia) errors.horarioTransferencia = "Obligatorio"
      if (!formData.transferidoA) errors.transferidoA = "Obligatorio"
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      toast({ title: "Error en el formulario", description: Object.values(errors)[0] as string, variant: "destructive" })
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

  const getNextRegistrationNumber = async () => {
    try {
      const snap = await getDocs(query(
        collection(db, "participantesCicloTermal"),
        where("años", "array-contains", añoParam)
      ))
      return snap.size + 1
    } catch {
      return Date.now()
    }
  }

  const sendAdminNotificationEmail = async (participantData) => {
    try {
      await emailjs.send(process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!, process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_INSCRIPCION!, {
        nombre: participantData.nombre,
        apellido: participantData.apellido,
        comprobanteUrl: participantData.nombreArchivo || "comprobante",
        emailIara: "iara37699@gmail.com",
      })
      return true
    } catch (error) {
      toast({ title: "Error al enviar email", description: "No se pudo notificar al administrador.", variant: "destructive" })
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return

    setIsSubmitting(true)
    try {
      const numeroInscripcion = await getNextRegistrationNumber()
      let imagenBase64 = ""
      if (formData.comprobantePago) {
        try {
          imagenBase64 = await convertToBase64(formData.comprobantePago)
        } catch (error) {
          toast({ title: "Error al procesar el archivo", description: (error as Error).message, variant: "destructive" })
          setIsSubmitting(false)
          return
        }
      }

      const condicionSalud = JSON.stringify({
        condicionesSalud: formData.condicionesSalud || "",
        esCeliaco: formData.esCeliaco || "no",
      })

      // Perfil personal (se actualiza siempre)
      const perfilPersonal = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email || "",
        telefono: formData.telefono || "",
        paisTelefono: formData.paisTelefono || "Argentina",
        telefonoEmergencia: formData.telefonoEmergencia || "",
        paisTelefonoEmergencia: formData.paisTelefonoEmergencia || "Argentina",
        dni: formData.dni,
        fechaNacimiento: formData.fechaNacimiento || "",
        genero: formData.genero || "",
        grupoSanguineo: formData.grupoSanguineo || "",
        condicionSalud,
        localidad: formData.localidad || "",
        grupoCiclistas: formData.grupoCiclistas || "",
        imagenBase64,
        nombreArchivo: formData.comprobantePago?.name || "comprobante.jpg",
      }

      // Datos del ciclo vigente (se pisan)
      const datosCiclo = {
        talleRemera: formData.talleRemera || "",
        precio: "",
        estado: "pendiente",
        comprobantePagoUrl: "",
        transferidoA: "",
        numeroInscripcion,
        aceptaTerminos: formData.aceptaCondiciones,
        fechaInscripcion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        // Campos de transferencia del ciclo actual
        nombreTransferencia: formData.nombreTransferencia || "",
        horarioTransferencia: formData.horarioTransferencia || "",
      }

      const docRef = doc(db, "participantesCicloTermal", formData.dni)
      await setDoc(docRef, {
        ...perfilPersonal,
        ...datosCiclo,
        años: arrayUnion(añoParam),
      }, { merge: true })

      await sendAdminNotificationEmail({ ...perfilPersonal, ...datosCiclo })

      setSubmitted(true)
      setShowSuccessDialog(true)
    } catch (error) {
      console.error("Error al enviar formulario:", error)
      toast({ title: "Error", description: (error as Error).message || "Error al procesar la inscripción", variant: "destructive" })
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

  if (cicloStatus === "not_found" || cicloStatus === "disabled") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-t-lg">
            <CardTitle className="text-2xl font-bold text-center text-gray-700">Inscripción no disponible</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              La inscripción para el año <strong>{añoParam || "indicado"}</strong> no está disponible.
            </p>
            <p className="text-gray-500 text-sm">Consultá las fechas del próximo ciclo en nuestra página principal.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => (window.location.href = "/")} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (cicloStatus === "closed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-t-lg">
            <CardTitle className="text-2xl font-bold text-center text-amber-700">Inscripción cerrada</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 text-center">
            <Clock className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              El período de inscripción para el ciclo <strong>{añoParam}</strong> está cerrado.
            </p>
            <p className="text-gray-500 text-sm">Las inscripciones pueden estar pendientes de apertura o ya finalizadas.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => (window.location.href = "/")} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // ── Renderizado de pasos ─────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-800">Información importante</AlertTitle>
              <AlertDescription className="text-amber-700">
                <strong>Su inscripción es sin remera, no hay más talles disponibles</strong>
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg border shadow-sm">
              <h3 className="font-medium text-lg mb-4 text-gray-800 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Información Personal
              </h3>

              {dniFound && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-800">Perfil encontrado</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Se precargaron tus datos personales. Revisalos y actualizalos si es necesario.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Label htmlFor="dni" className="flex justify-between">
                    <span>DNI *</span>
                    {fieldErrors.dni && <span className="text-red-500 text-xs">{fieldErrors.dni}</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      id="dni" name="dni" value={formData.dni}
                      onChange={handleInputChange}
                      onBlur={handleDniBlur}
                      className={fieldErrors.dni ? "border-red-500 pr-8" : "pr-8"}
                      placeholder="Ej: 32456789"
                    />
                    {dniLookingUp && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-gray-400" />}
                    {!dniLookingUp && dniFound && <CheckCircle2 className="absolute right-2 top-2.5 h-4 w-4 text-green-500" />}
                  </div>
                  <p className="text-xs text-gray-500">Si ya participaste antes, tus datos se cargarán automáticamente.</p>
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
                  <Popover open={grupoCiclistasOpen} onOpenChange={setGrupoCiclistasOpen}>
                    <PopoverTrigger asChild>
                      <Input
                        id="grupoCiclistas" name="grupoCiclistas" value={formData.grupoCiclistas}
                        onChange={(e) => setFormData({ ...formData, grupoCiclistas: e.target.value })}
                        placeholder="Escriba o seleccione su grupo"
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                      <div className="max-h-[200px] overflow-y-auto p-1">
                        <Button variant="ghost" size="sm" className="justify-start font-normal text-left h-auto py-1.5 w-full"
                          onClick={() => { handleSelectChange("grupoCiclistas", "No pertenezco a ninguno"); setGrupoCiclistasOpen(false) }}>
                          No pertenezco a ninguno
                        </Button>
                        {gruposCiclistas.map((g) => (
                          <Button key={g} variant="ghost" size="sm" className="justify-start font-normal text-left h-auto py-1.5 w-full"
                            onClick={() => { handleSelectChange("grupoCiclistas", g); setGrupoCiclistasOpen(false) }}>
                            {g}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-gray-500">Escriba el nombre de su grupo o seleccione uno de la lista.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recorrido" className="flex justify-between">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-green-500" />Recorrido *</span>
                    {fieldErrors.recorrido && <span className="text-red-500 text-xs">{fieldErrors.recorrido}</span>}
                  </Label>
                  <RadioGroup value={formData.recorrido} onValueChange={(v) => handleSelectChange("recorrido", v)} className="flex flex-col space-y-1 mt-2">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="30km" id="r-30" /><Label htmlFor="r-30" className="font-normal">30 KM</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="50km" id="r-50" /><Label htmlFor="r-50" className="font-normal">50 KM</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="aun_no_decido" id="r-nd" /><Label htmlFor="r-nd" className="font-normal">Aún no decido</Label></div>
                  </RadioGroup>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <Alert className="bg-white border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertTitle className="text-blue-800">Dato de pago 1 - Argentina</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Banco: Naranja X</li>
                      <li>Titular: Nancy Gisela Orbes</li>
                      <li>CUIT: 27-26233106-2</li>
                      <li>CBU: 4530000800016415745759</li>
                      <li>Alias: ciclotermal2025</li>
                      <li><strong>Importe: $35.000 (ARS)</strong></li>
                    </ul>
                  </AlertDescription>
                </Alert>
                <Alert className="bg-white border-green-200">
                  <AlertCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-800">Dato de pago 2 - Uruguay</AlertTitle>
                  <AlertDescription className="text-green-700">
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Banco: Prex</li>
                      <li>Titular: Nancy Gisela Orbes</li>
                      <li>CBU: 0000013000032290638313</li>
                      <li>Alias: CicloTermal.PREX</li>
                      <li><strong>Importe: $1.300 (UYU)</strong></li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-4 mt-6 border-t pt-4">
                <h4 className="font-medium text-gray-800 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Detalles de la transferencia
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombreTransferencia" className="flex justify-between">
                      <span>Nombre de quien transfiere *</span>
                      {fieldErrors.nombreTransferencia && <span className="text-red-500 text-xs">{fieldErrors.nombreTransferencia}</span>}
                    </Label>
                    <Input id="nombreTransferencia" name="nombreTransferencia" value={formData.nombreTransferencia} onChange={handleInputChange}
                      className={fieldErrors.nombreTransferencia ? "border-red-500" : ""} placeholder="Nombre completo" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horarioTransferencia" className="flex justify-between items-center">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-gray-500" />Horario de transferencia *</span>
                      {fieldErrors.horarioTransferencia && <span className="text-red-500 text-xs">{fieldErrors.horarioTransferencia}</span>}
                    </Label>
                    <Input id="horarioTransferencia" name="horarioTransferencia" type="datetime-local" value={formData.horarioTransferencia}
                      onChange={handleInputChange} className={fieldErrors.horarioTransferencia ? "border-red-500" : ""} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transferidoA" className="flex justify-between">
                    <span>Transferido a *</span>
                    {fieldErrors.transferidoA && <span className="text-red-500 text-xs">{fieldErrors.transferidoA}</span>}
                  </Label>
                  <RadioGroup value={formData.transferidoA} onValueChange={(v) => handleSelectChange("transferidoA", v)} className="flex flex-col space-y-2 mt-2">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Gise" id="t-gise" /><Label htmlFor="t-gise" className="font-normal">Gisela Orbes</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Bruni" id="t-bruni" /><Label htmlFor="t-bruni" className="font-normal">Brunilda Shubert</Label></div>
                  </RadioGroup>
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
                        <Button variant="outline" size="sm" onClick={() => setFormData({ ...formData, comprobantePago: null })}>
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 pb-10">
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
              <DialogTitle className="text-2xl font-bold text-white text-center">¡Inscripción Exitosa!</DialogTitle>
            </div>
            <div className="p-6">
              <DialogDescription className="text-gray-700 text-base mb-4">
                <div className="mb-3">Tu inscripción al <span className="font-semibold">Cicloturismo Termal {añoParam}</span> ha sido registrada exitosamente.</div>
                <div className="mb-3">Pronto recibirás un correo de confirmación con todos los detalles.</div>
                <div>Recuerda presentar tu DNI el día del evento para la acreditación.</div>
              </DialogDescription>
              <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4">
                <h4 className="text-green-800 font-medium flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  Información importante
                </h4>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>• Presentate con tu DNI el día del evento.</li>
                  <li>• Lugar de acreditación: <a href="https://maps.app.goo.gl/sKgRGozptoXJrpY17" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Frente al predio de la Terminal de Ómnibus de Federación</a>.</li>
                  <li>• Horario de acreditación: 7:30 AM</li>
                  <li>• Horario de salida: 8:30 AM</li>
                </ul>
              </div>
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
          <CardHeader className="bg-gradient-to-r from-pink-100 to-blue-100 rounded-t-lg">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
              Inscripción Cicloturismo Termal {añoParam}
            </CardTitle>
            <CardDescription className="text-center text-gray-700">
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
                <Button type="button" onClick={nextStep} className="flex items-center gap-1 bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700">
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" className="flex-1 bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700" disabled={isSubmitting} onClick={handleSubmit}>
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
                    onClick={() => { setFormData(emptyForm); setBirthDate(undefined); setFieldErrors({}); setDniFound(false) }}>
                    Limpiar formulario
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Borrar todos los datos ingresados</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardFooter>
        </Card>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© {añoParam} Cicloturismo Termal - Todos los derechos reservados</p>
        </div>
      </main>
    </div>
  )
}
