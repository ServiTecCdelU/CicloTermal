"use client"
import { DialogFooter } from "@/components/ui/dialog"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { collection, getDocs, query, orderBy, setDoc, doc } from "firebase/firestore"
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
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import emailjs from "@emailjs/browser"

// Inicializa EmailJS
if (typeof window !== "undefined") {
  emailjs.init("azc3nwXCG2ojZsRsB")
}

// Constantes para el stock
const STOCK_REMERAS = { s: 50, m: 100, l: 150, xl: 100, xxl: 50 }
const LIMITE_TOTAL_REMERAS = 450

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

  useEffect(() => {
    if (calendarOpen) {
      const newDate = new Date(year, month, 1)
      document.querySelector('[data-calendar-root="true"]')?.setAttribute("data-view-date", newDate.toISOString())
    }
  }, [year, month, calendarOpen])

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
          <Select value={month.toString()} onValueChange={(value) => setMonth(Number.parseInt(value))}>
            <SelectTrigger className="w-[130px] h-8">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {months.map((monthName, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year.toString()} onValueChange={(value) => setYear(Number.parseInt(value))}>
            <SelectTrigger className="w-[90px] h-8">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => {
            setDate(newDate)
            if (newDate) {
              setYear(newDate.getFullYear())
              setMonth(newDate.getMonth())
            }
            setCalendarOpen(false)
          }}
          initialFocus
          locale={es}
          month={new Date(year, month)}
          onMonthChange={(newMonth) => {
            setMonth(newMonth.getMonth())
            setYear(newMonth.getFullYear())
          }}
          className="border-t rounded-none"
        />
      </PopoverContent>
    </Popover>
  )
}

const useToast = () => {
  const [toasts, setToasts] = useState([])
  const toast = ({ title, description, variant = "default" }) => {
    const id = Date.now()
    const newToast = { id, title, description, variant }
    setToasts((prev) => [...prev, newToast])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }
  return { toast, toasts }
}

const Toast = ({ toast, onClose }) => {
  const bgColor =
    toast.variant === "destructive" ? "bg-red-500" : toast.variant === "success" ? "bg-green-500" : "bg-blue-500"
  return (
    <div className={`${bgColor} text-white p-3 rounded-lg shadow-lg mb-2 transition-all animate-in slide-in-from-right-5`}>
      <div className="font-medium">{toast.title}</div>
      {toast.description && <div className="text-sm">{toast.description}</div>}
    </div>
  )
}

const ToastContainer = ({ toasts }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
    {toasts.map((toast) => (
      <Toast key={toast.id} toast={toast} />
    ))}
  </div>
)

const gruposCiclistas = [
  "Team Riders", "Pedal Power", "Grand Team Bike Cdelu", "Ciclo Materos", "Los Despacito",
  "Kamikaze MTB", "Rural Bike concepcion", "En Bici Ando", "Desafiando Caminos", "Los Tiernitos",
  "CicloturismoBasso", "Desacatados Bike", "Bikers Alcorta", "Bici Chicas", "Panteras Bike",
]

const paises = [
  "Argentina", "Uruguay", "Bolivia", "Brasil", "Chile", "Colombia", "Ecuador", 
  "Paraguay", "Perú", "Venezuela", "México", "Estados Unidos", "Canadá", "España", "Otro",
]

const FormSteps = ({ currentStep, totalSteps }) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Paso {currentStep} de {totalSteps}</span>
        <span className="text-sm text-muted-foreground">
          {currentStep === 1 ? "Información personal" : 
           currentStep === 2 ? "Condiciones de salud" : "Pago y términos"}
        </span>
      </div>
      <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
    </div>
  )
}


export default function InscripcionPage() {
  const { toast, toasts } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [currentStep, setCurrentStep] = useState(1)
  const topRef = useRef(null)
  const [birthDate, setBirthDate] = useState(undefined)
  const [grupoCiclistasOpen, setGrupoCiclistasOpen] = useState(false)
  const [stockRemeras, setStockRemeras] = useState(STOCK_REMERAS)
  const [totalInscripcionesValidas, setTotalInscripcionesValidas] = useState(0)
  const [stockAgotado, setStockAgotado] = useState(false)

  const totalSteps = 3

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    fechaNacimiento: "",
    localidad: "",
    email: "",
    telefono: "",
    paisTelefono: "Argentina",
    telefonoEmergencia: "",
    paisTelefonoEmergencia: "Argentina",
    grupoSanguineo: "",
    genero: "",
    grupoCiclistas: "",
    talleRemera: "",
    condicionesSalud: "",
    esCeliaco: "",
    recorrido: "",
    transferidoA: "",
    nombreTransferencia: "",
    horarioTransferencia: "",
    aceptaCondiciones: false,
    comprobantePago: null,
    comprobantePagoUrl: "",
  })


  useEffect(() => {
    if (birthDate) {
      setFormData({
        ...formData,
        fechaNacimiento: format(birthDate, "yyyy-MM-dd"),
      })
    }
  }, [birthDate])

  useEffect(() => {
    if (formData.fechaNacimiento && !birthDate) {
      try {
        const parsedDate = parse(formData.fechaNacimiento, "yyyy-MM-dd", new Date())
        if (!isNaN(parsedDate.getTime())) {
          setBirthDate(parsedDate)
        }
      } catch (error) {
        console.error("Error parsing date:", error)
      }
    }
  }, [formData.fechaNacimiento])

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false)
    setFormData({
      nombre: "",
      apellido: "",
      dni: "",
      fechaNacimiento: "",
      localidad: "",
      email: "",
      telefono: "",
      paisTelefono: "Argentina",
      telefonoEmergencia: "",
      paisTelefonoEmergencia: "Argentina",
      grupoSanguineo: "",
      genero: "",
      grupoCiclistas: "",
      talleRemera: "",
      condicionesSalud: "",
      esCeliaco: "",
      recorrido: "",
      transferidoA: "",
      nombreTransferencia: "",
      horarioTransferencia: "",
      aceptaCondiciones: false,
      comprobantePago: null,
      comprobantePagoUrl: "",
    })
    setBirthDate(undefined)
    setFieldErrors({})
    setCurrentStep(1)
    window.scrollTo({ top: 0, behavior: "smooth" })
    topRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const goToHomePage = () => {
    window.location.href = "/"
  }

  const validateName = (value) => {
    return /^[A-Za-zÁáÉéÍíÓóÚúÜüÑñ\s]+$/.test(value)
  }

  const validateDNI = (value) => {
    return /^\d+$/.test(value)
  }

  const validateEmail = (value) => {
    if (!value) return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  function validatePhone(value) {
    if (!value) return true
    return /^\d+$/.test(value.replace(/\D/g, ""))
  }

  const validateField = (name, value) => {
    switch (name) {
      case "nombre":
        return validateName(value) ? "" : "El nombre solo debe contener letras"
      case "apellido":
        return validateName(value) ? "" : "El apellido solo debe contener letras"
      case "dni":
        return validateDNI(value) ? "" : "El DNI debe tener 7-8 dígitos"
      case "email":
        return validateEmail(value) ? "" : "Formato de email inválido"
      case "telefono":
        return validatePhone(value) ? "" : "Formato de teléfono inválido"
      case "nombreTransferencia":
        return validateName(value) ? "" : "El nombre solo debe contener letras"
      default:
        return ""
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    const newValue = type === "checkbox" ? e.target.checked : value
    setFormData({
      ...formData,
      [name]: newValue,
    })
    if (["nombre", "apellido", "dni", "email", "telefono", "nombreTransferencia"].includes(name)) {
      const error = validateField(name, newValue)
      setFieldErrors({
        ...fieldErrors,
        [name]: error,
      })
    }
  }

  const handleCheckboxChange = (name, checked) => {
    setFormData({
      ...formData,
      [name]: checked,
    })
  }

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Función mejorada para manejar archivos
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validación rápida de tamaño (límite más estricto)
      const maxSize = 5 * 1024 * 1024 // 5MB límite más realista
      if (file.size > maxSize) {
        toast({
          title: "Archivo demasiado grande",
          description: "El archivo debe ser menor a 5MB. Por favor, comprima la imagen o seleccione otro archivo.",
          variant: "destructive",
        })
        e.target.value = ""
        return
      }

      // Validación de tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de archivo no válido",
          description: "Solo se permiten archivos JPG, PNG o PDF.",
          variant: "destructive",
        })
        e.target.value = ""
        return
      }

      // Si pasa las validaciones, establecer el archivo
      setFormData({
        ...formData,
        comprobantePago: file,
      })
      
      toast({
        title: "Archivo cargado",
        description: "El comprobante se ha cargado correctamente.",
        variant: "success",
      })
    }
  }

  // Función mejorada para convertir a Base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      // Verificar tamaño nuevamente antes de procesar
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error("Archivo demasiado grande para procesar"))
        return
      }

      const reader = new FileReader()
      reader.readAsDataURL(file)
      
      reader.onload = () => {
        const result = reader.result
        // Verificar que el Base64 no sea excesivamente grande
        if (result.length > 7000000) { // ~5MB en Base64
          reject(new Error("El archivo comprimido sigue siendo demasiado grande"))
          return
        }
        resolve(result)
      }
      
      reader.onerror = (error) => {
        reject(new Error("Error al procesar el archivo"))
      }
    })
  }

  const validateStep = (step) => {
    const errors = {}
    if (step === 1) {
      if (!formData.nombre) errors.nombre = "El nombre es obligatorio"
      else if (!validateName(formData.nombre)) errors.nombre = "El nombre solo debe contener letras"
      if (!formData.apellido) errors.apellido = "El apellido es obligatorio"
      else if (!validateName(formData.apellido)) errors.apellido = "El apellido solo debe contener letras"
      if (!formData.dni) errors.dni = "El DNI es obligatorio"
      else if (!validateDNI(formData.dni)) errors.dni = "El DNI debe tener 7-8 dígitos"
      if (!formData.fechaNacimiento) errors.fechaNacimiento = "La fecha de nacimiento es obligatoria"
      if (!formData.localidad) errors.localidad = "La localidad es obligatoria"
      if (!formData.email) errors.email = "El email es obligatorio"
      else if (!validateEmail(formData.email)) errors.email = "Formato de email inválido"
      if (!formData.telefono) errors.telefono = "El teléfono es obligatorio"
      else if (!validatePhone(formData.telefono)) errors.telefono = "Formato de teléfono inválido"
      if (!formData.telefonoEmergencia) errors.telefonoEmergencia = "El teléfono de emergencia es obligatorio"
      else if (!validatePhone(formData.telefonoEmergencia)) errors.telefonoEmergencia = "Formato de teléfono inválido"
      if (!formData.grupoSanguineo) errors.grupoSanguineo = "El grupo sanguíneo es obligatorio"
      if (!formData.genero) errors.genero = "El género es obligatorio"
      if (!formData.grupoCiclistas) errors.grupoCiclistas = "El grupo de ciclistas es obligatorio"
      if (!formData.recorrido) errors.recorrido = "El recorrido es obligatorio"
    } else if (step === 2) {
      if (formData.esCeliaco === undefined || formData.esCeliaco === null || formData.esCeliaco === "")
        errors.esCeliaco = "Debe indicar si es celíaco o no"
    } else if (step === 3) {
      if (!formData.aceptaCondiciones) errors.aceptaCondiciones = "Debe aceptar los términos y condiciones"
      if (!formData.nombreTransferencia) errors.nombreTransferencia = "El nombre de quien transfiere es obligatorio"
      else if (!validateName(formData.nombreTransferencia)) errors.nombreTransferencia = "El nombre solo debe contener letras"
      if (!formData.horarioTransferencia) errors.horarioTransferencia = "El horario de transferencia es obligatorio"
      if (!formData.transferidoA) errors.transferidoA = "Debe indicar a quién transfirió"
    }
    
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      const firstErrorKey = Object.keys(errors)[0]
      const firstError = errors[firstErrorKey]
      toast({
        title: "Error en el formulario",
        description: `${firstErrorKey.charAt(0).toUpperCase() + firstErrorKey.slice(1)}: ${firstError}`,
        variant: "destructive",
      })
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
      const registrationsRef = collection(db, "participantes2025")
      const allRegistrations = query(registrationsRef, orderBy("fechaInscripcion", "asc"))
      const snapshot = await getDocs(allRegistrations)
      return snapshot.size + 1
    } catch (error) {
      console.error("Error obteniendo número de inscripción:", error)
      return Date.now()
    }
  }

  const sendAdminNotificationEmail = async (participantData) => {
    try {
      const templateParams = {
        nombre: participantData.nombre,
        apellido: participantData.apellido,
        comprobanteUrl: participantData.nombreArchivo || "comprobante",
        emailIara: "iara37699@gmail.com",
      }

      await emailjs.send("default_service", "template_f7yvb9x", templateParams)
      console.log("Email de notificación al administrador enviado con éxito.")
      return true
    } catch (error) {
      console.error("Error al enviar el correo de notificación al administrador:", error)
      toast({
        title: "Error al enviar email",
        description: `No se pudo enviar el correo de confirmación al administrador: ${error.message || JSON.stringify(error)}`,
        variant: "destructive",
      })
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar todos los pasos
    const allErrors = {}
    
    // Step 1 validations
    if (!formData.nombre) allErrors.nombre = "El nombre es obligatorio"
    else if (!validateName(formData.nombre)) allErrors.nombre = "El nombre solo debe contener letras"
    if (!formData.apellido) allErrors.apellido = "El apellido es obligatorio"
    else if (!validateName(formData.apellido)) allErrors.apellido = "El apellido solo debe contener letras"
    if (!formData.dni) allErrors.dni = "El DNI es obligatorio"
    else if (!validateDNI(formData.dni)) allErrors.dni = "El DNI debe tener 7-8 dígitos"
    if (!formData.fechaNacimiento) allErrors.fechaNacimiento = "La fecha de nacimiento es obligatoria"
    if (!formData.localidad) allErrors.localidad = "La localidad es obligatoria"
    if (!formData.email) allErrors.email = "El email es obligatorio"
    else if (!validateEmail(formData.email)) allErrors.email = "Formato de email inválido"
    if (!formData.telefono) allErrors.telefono = "El teléfono es obligatorio"
    else if (!validatePhone(formData.telefono)) allErrors.telefono = "Formato de teléfono inválido"
    if (!formData.telefonoEmergencia) allErrors.telefonoEmergencia = "El teléfono de emergencia es obligatorio"
    else if (!validatePhone(formData.telefonoEmergencia)) allErrors.telefonoEmergencia = "Formato de teléfono inválido"
    if (!formData.grupoSanguineo) allErrors.grupoSanguineo = "El grupo sanguíneo es obligatorio"
    if (!formData.genero) allErrors.genero = "El género es obligatorio"
    if (!formData.grupoCiclistas) allErrors.grupoCiclistas = "El grupo de ciclistas es obligatorio"
    if (!formData.recorrido) allErrors.recorrido = "El recorrido es obligatorio"
    
    // Step 2 validations
    if (!formData.esCeliaco) allErrors.esCeliaco = "Debe indicar si es celíaco o no"
    
    // Step 3 validations
    if (!formData.aceptaCondiciones) allErrors.aceptaCondiciones = "Debe aceptar los términos y condiciones"
    if (!formData.nombreTransferencia) allErrors.nombreTransferencia = "El nombre de quien transfiere es obligatorio"
    else if (!validateName(formData.nombreTransferencia)) allErrors.nombreTransferencia = "El nombre solo debe contener letras"
    if (!formData.horarioTransferencia) allErrors.horarioTransferencia = "El horario de transferencia es obligatorio"
    if (!formData.transferidoA) allErrors.transferidoA = "Debe indicar a quién transfirió"

    setFieldErrors(allErrors)
    if (Object.keys(allErrors).length > 0) {
      const firstError = Object.values(allErrors)[0]
      toast({
        title: "Error en el formulario",
        description: firstError,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const numeroInscripcion = await getNextRegistrationNumber()
      let imagenBase64 = ""

      if (formData.comprobantePago) {
        try {
          imagenBase64 = await convertToBase64(formData.comprobantePago)
        } catch (error) {
          toast({
            title: "Error al procesar el archivo",
            description: error.message,
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      const condicionSalud = {
        condicionesSalud: formData.condicionesSalud || "",
        esCeliaco: formData.esCeliaco || "no",
      }

      const registrationData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: formData.dni,
        fechaNacimiento: formData.fechaNacimiento || "",
        localidad: formData.localidad || "",
        email: formData.email || "",
        telefono: formData.telefono || "",
        paisTelefono: formData.paisTelefono || "Argentina",
        telefonoEmergencia: formData.telefonoEmergencia || "",
        paisTelefonoEmergencia: formData.paisTelefonoEmergencia || "Argentina",
        grupoSanguineo: formData.grupoSanguineo || "",
        genero: formData.genero || "",
        grupoCiclistas: formData.grupoCiclistas || "",
        //talleRemera: formData.talleRemera || "",
        recorrido: formData.recorrido || "",
        nombreTransferencia: formData.nombreTransferencia || "",
        horarioTransferencia: formData.horarioTransferencia || "",
        transferidoA: formData.transferidoA || "",
        condicionSalud: JSON.stringify(condicionSalud),
        comprobantePagoUrl: "",
        imagenBase64: imagenBase64,
        nombreArchivo: formData.comprobantePago?.name || "comprobante.jpg",
        fechaInscripcion: new Date().toISOString(),
        year: new Date().getFullYear(),
        estado: "pendiente",
        aceptaTerminos: formData.aceptaCondiciones,
        numeroInscripcion: numeroInscripcion,
      }

      const documentName = `${numeroInscripcion.toString().padStart(3, "0")} ${formData.nombre} ${formData.apellido}`

      const docRef = doc(db, "participantes2025", documentName)
      await setDoc(docRef, registrationData)

      await sendAdminNotificationEmail(registrationData)

      setSubmitted(true)
      setShowSuccessDialog(true)
    } catch (error) {
      console.error("Error al enviar formulario:", error)
      toast({
        title: "Error",
        description: `Error específico: ${error.message || "Hubo un problema al procesar tu inscripción"}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }


  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Alerta sobre las remeras */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="flex justify-between">
                    <span>Nombre *</span>
                    {fieldErrors.nombre && <span className="text-red-500 text-xs">{fieldErrors.nombre}</span>}
                  </Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className={fieldErrors.nombre ? "border-red-500" : ""}
                    placeholder="Ej: Juan Carlos"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido" className="flex justify-between">
                    <span>Apellido *</span>
                    {fieldErrors.apellido && <span className="text-red-500 text-xs">{fieldErrors.apellido}</span>}
                  </Label>
                  <Input
                    id="apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    className={fieldErrors.apellido ? "border-red-500" : ""}
                    placeholder="Ej: Gómez"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dni" className="flex justify-between">
                    <span>DNI *</span>
                    {fieldErrors.dni && <span className="text-red-500 text-xs">{fieldErrors.dni}</span>}
                  </Label>
                  <Input
                    id="dni"
                    name="dni"
                    value={formData.dni}
                    onChange={handleInputChange}
                    className={fieldErrors.dni ? "border-red-500" : ""}
                    placeholder="Ej: 32456789"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaNacimiento" className="flex justify-between">
                    <span>Fecha de nacimiento *</span>
                    {fieldErrors.fechaNacimiento && (
                      <span className="text-red-500 text-xs">{fieldErrors.fechaNacimiento}</span>
                    )}
                  </Label>
                  <DatePicker date={birthDate} setDate={setBirthDate} placeholder="Seleccionar fecha" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localidad" className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-gray-500" />
                      <span>Localidad *</span>
                    </span>
                    {fieldErrors.localidad && <span className="text-red-500 text-xs">{fieldErrors.localidad}</span>}
                  </Label>
                  <Input
                    id="localidad"
                    name="localidad"
                    value={formData.localidad}
                    onChange={handleInputChange}
                    placeholder="Ej: Buenos Aires"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-gray-500" />
                      Email *
                    </span>
                    {fieldErrors.email && <span className="text-red-500 text-xs">{fieldErrors.email}</span>}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={fieldErrors.email ? "border-red-500" : ""}
                    placeholder="Ej: ejemplo@correo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono" className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-gray-500" />
                      Teléfono *
                    </span>
                    {fieldErrors.telefono && <span className="text-red-500 text-xs">{fieldErrors.telefono}</span>}
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      name="paisTelefono"
                      value={formData.paisTelefono || "Argentina"}
                      onValueChange={(value) => handleSelectChange("paisTelefono", value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="País" />
                      </SelectTrigger>
                      <SelectContent>
                        {paises.map((pais) => (
                          <SelectItem key={pais} value={pais}>
                            {pais}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className={fieldErrors.telefono ? "border-red-500" : ""}
                      placeholder="Ej: 11 5555 5555"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Ingrese solo números, sin espacios ni guiones.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefonoEmergencia" className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      Teléfono de emergencia *
                    </span>
                    {fieldErrors.telefonoEmergencia && (
                      <span className="text-red-500 text-xs">{fieldErrors.telefonoEmergencia}</span>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      name="paisTelefonoEmergencia"
                      value={formData.paisTelefonoEmergencia || "Argentina"}
                      onValueChange={(value) => handleSelectChange("paisTelefonoEmergencia", value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="País" />
                      </SelectTrigger>
                      <SelectContent>
                        {paises.map((pais) => (
                          <SelectItem key={pais} value={pais}>
                            {pais}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="telefonoEmergencia"
                      name="telefonoEmergencia"
                      value={formData.telefonoEmergencia}
                      onChange={handleInputChange}
                      className={fieldErrors.telefonoEmergencia ? "border-red-500" : ""}
                      placeholder="Ej: 11 4444 4444"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Ingrese solo números, sin espacios ni guiones.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grupoSanguineo" className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5 text-red-500" />
                      <span>Grupo sanguíneo *</span>
                    </span>
                    {fieldErrors.grupoSanguineo && (
                      <span className="text-red-500 text-xs">{fieldErrors.grupoSanguineo}</span>
                    )}
                  </Label>
                  <Select
                    name="grupoSanguineo"
                    value={formData.grupoSanguineo}
                    onValueChange={(value) => handleSelectChange("grupoSanguineo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a+">A+</SelectItem>
                      <SelectItem value="a-">A-</SelectItem>
                      <SelectItem value="b+">B+</SelectItem>
                      <SelectItem value="b-">B-</SelectItem>
                      <SelectItem value="ab+">AB+</SelectItem>
                      <SelectItem value="ab-">AB-</SelectItem>
                      <SelectItem value="o+">O+</SelectItem>
                      <SelectItem value="o-">O-</SelectItem>
                      <SelectItem value="desconocido">Desconocido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genero" className="flex justify-between">
                    <span>Género *</span>
                    {fieldErrors.genero && <span className="text-red-500 text-xs">{fieldErrors.genero}</span>}
                  </Label>
                  <RadioGroup
                    value={formData.genero}
                    onValueChange={(value) => handleSelectChange("genero", value)}
                    className="flex flex-col space-y-1 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="femenino" id="genero-femenino" />
                      <Label htmlFor="genero-femenino" className="font-normal">
                        Femenino
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="masculino" id="genero-masculino" />
                      <Label htmlFor="genero-masculino" className="font-normal">
                        Masculino
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="otro" id="genero-otro" />
                      <Label htmlFor="genero-otro" className="font-normal">
                        Prefiero no especificar
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grupoCiclistas" className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Grupo de ciclistas *</span>
                    </span>
                    {fieldErrors.grupoCiclistas && (
                      <span className="text-red-500 text-xs">{fieldErrors.grupoCiclistas}</span>
                    )}
                  </Label>

                  <Popover open={grupoCiclistasOpen} onOpenChange={setGrupoCiclistasOpen}>
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <Input
                          id="grupoCiclistas"
                          name="grupoCiclistas"
                          value={formData.grupoCiclistas}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              grupoCiclistas: e.target.value,
                            })
                          }}
                          placeholder="Escriba o seleccione su grupo de ciclistas"
                          className="w-full"
                        />
                      </div>
                    </PopoverTrigger>

                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                      <div className="max-h-[200px] overflow-y-auto p-1">
                        <div className="grid grid-cols-1 gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start font-normal text-left h-auto py-1.5"
                            onClick={() => {
                              handleSelectChange("grupoCiclistas", "No pertenezco a ninguno")
                              setGrupoCiclistasOpen(false)
                            }}
                          >
                            No pertenezco a ninguno
                          </Button>

                          {gruposCiclistas.map((grupo) => (
                            <Button
                              key={grupo}
                              variant="ghost"
                              size="sm"
                              className="justify-start font-normal text-left h-auto py-1.5"
                              onClick={() => {
                                handleSelectChange("grupoCiclistas", grupo)
                                setGrupoCiclistasOpen(false)
                              }}
                            >
                              {grupo}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <p className="text-xs text-gray-500">
                    Escriba el nombre de su grupo o seleccione uno de la lista.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recorrido" className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-green-500" />
                      <span>Recorrido *</span>
                    </span>
                    {fieldErrors.recorrido && <span className="text-red-500 text-xs">{fieldErrors.recorrido}</span>}
                  </Label>
                  <RadioGroup
                    value={formData.recorrido}
                    onValueChange={(value) => handleSelectChange("recorrido", value)}
                    className="flex flex-col space-y-1 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="30km" id="recorrido-30km" />
                      <Label htmlFor="recorrido-30km" className="font-normal">
                        30 KM
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="50km" id="recorrido-50km" />
                      <Label htmlFor="recorrido-50km" className="font-normal">
                        50 KM
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="aun_no_decido" id="recorrido-aun-no-decido" />
                      <Label htmlFor="recorrido-aun-no-decido" className="font-normal">
                        Aún no decido
                      </Label>
                    </div>
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
                <Label htmlFor="condicionesSalud">
                  Indique cualquier condición de salud, alergias o medicamentos que debamos conocer:
                </Label>
                <Textarea
                  id="condicionesSalud"
                  name="condicionesSalud"
                  value={formData.condicionesSalud}
                  onChange={handleInputChange}
                  placeholder="Describa aquí alergias, medicamentos que toma regularmente o cualquier condición de salud relevante para la actividad física."
                  className="min-h-32"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Esta información es importante para asegurar su bienestar durante el evento. Si no tiene condiciones
                  especiales de salud, puede dejar este campo en blanco.
                </p>
              </div>
              <div className="space-y-2 mt-4 border-t pt-4">
                <Label htmlFor="esCeliaco" className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                    <span>¿Es usted celíaco? *</span>
                  </span>
                  {fieldErrors.esCeliaco && <span className="text-red-500 text-xs">{fieldErrors.esCeliaco}</span>}
                </Label>
                <RadioGroup
                  value={formData.esCeliaco}
                  onValueChange={(value) => handleSelectChange("esCeliaco", value)}
                  className="flex flex-col space-y-1 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="si" id="celiaco-si" />
                    <Label htmlFor="celiaco-si" className="font-normal">
                      Sí
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="celiaco-no" />
                    <Label htmlFor="celiaco-no" className="font-normal">
                      No
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-gray-500 mt-1">
                  *Esta información es necesaria para la preparación del desayuno incluido en el evento.
                </p>
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
                      <li>CUIT: 27-26233106-2</li>
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
                      <span>Nombre de quien hace la transferencia *</span>
                      {fieldErrors.nombreTransferencia && (
                        <span className="text-red-500 text-xs">{fieldErrors.nombreTransferencia}</span>
                      )}
                    </Label>
                    <Input
                      id="nombreTransferencia"
                      name="nombreTransferencia"
                      value={formData.nombreTransferencia}
                      onChange={handleInputChange}
                      className={fieldErrors.nombreTransferencia ? "border-red-500" : ""}
                      placeholder="Nombre completo de quien transfiere"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="horarioTransferencia" className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-gray-500" />
                        Horario de transferencia *
                      </span>
                      {fieldErrors.horarioTransferencia && (
                        <span className="text-red-500 text-xs">{fieldErrors.horarioTransferencia}</span>
                      )}
                    </Label>
                    <Input
                      id="horarioTransferencia"
                      name="horarioTransferencia"
                      type="datetime-local"
                      value={formData.horarioTransferencia}
                      onChange={handleInputChange}
                      className={fieldErrors.horarioTransferencia ? "border-red-500" : ""}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transferidoA" className="flex justify-between">
                    <span>Transferido a *</span>
                    {fieldErrors.transferidoA && (
                      <span className="text-red-500 text-xs">{fieldErrors.transferidoA}</span>
                    )}
                  </Label>
                  <RadioGroup
                    value={formData.transferidoA}
                    onValueChange={(value) => handleSelectChange("transferidoA", value)}
                    className="flex flex-col space-y-2 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Gise" id="transferido-gisela" />
                      <Label htmlFor="transferido-gisela" className="font-normal">
                        Gisela Orbes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Bruni" id="transferido-brunilda" />
                      <Label htmlFor="transferido-brunilda" className="font-normal">
                        Brunilda Shubert
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-4 mt-6 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="comprobantePago" className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Comprobante de pago
                    </span>
                    {fieldErrors.comprobantePago && (
                      <span className="text-red-500 text-xs">{fieldErrors.comprobantePago}</span>
                    )}
                  </Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                      fieldErrors.comprobantePago
                        ? "border-red-300 bg-red-50 hover:border-red-400"
                        : "border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    <UploadCloud className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <Input
                      id="comprobantePago"
                      name="comprobantePago"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="comprobantePago" className="cursor-pointer">
                      <span className="text-blue-600 font-medium hover:text-blue-700">
                        Haga clic para subir el comprobante
                      </span>
                      <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (máx. 5MB)</p>
                    </label>
                    {formData.comprobantePago && (
                      <div className="mt-2 p-2 bg-green-50 rounded border text-xs">
                        <CheckCircle2 className="h-4 w-4 text-green-600 inline mr-1" />
                        Archivo seleccionado: {formData.comprobantePago.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 shadow-sm">
              <h3 className="font-medium text-lg mb-4 text-yellow-800">Términos y Condiciones</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="terms">
                    <AccordionTrigger className="text-sm font-medium text-yellow-800">
                      Leer términos y condiciones
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm text-gray-700 p-2">
                        <p>Al participar en el Cicloturismo Termal, acepta las siguientes condiciones:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Participa bajo su propia responsabilidad y riesgo</li>
                          <li>Debe contar con bicicleta en buen estado y equipo de seguridad</li>
                          <li>Es obligatorio el uso de casco durante toda la actividad</li>
                          <li>Se compromete a respetar las normas de tránsito y las indicaciones de los organizadores</li>
                          <li>Autoriza el uso de imágenes tomadas durante el evento para fines promocionales</li>
                          <li>La organización no se hace responsable por pérdidas, daños o lesiones durante el evento</li>
                          <li>El evento se realizará con lluvia, solo se suspende por condiciones climáticas extremas</li>
                          <li>Los menores de edad deben contar con autorización de sus padres o tutores, presentarlo al momento de la acreditación</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <div className="flex items-start space-x-2 mt-4">
                  <Checkbox
                    id="aceptaCondiciones"
                    name="aceptaCondiciones"
                    checked={formData.aceptaCondiciones}
                    onCheckedChange={(checked) => handleCheckboxChange("aceptaCondiciones", checked)}
                    className={fieldErrors.aceptaCondiciones ? "border-red-500" : ""}
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="aceptaCondiciones"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Acepto los términos y condiciones *
                    </Label>
                    {fieldErrors.aceptaCondiciones && (
                      <p className="text-red-500 text-xs">{fieldErrors.aceptaCondiciones}</p>
                    )}
                  </div>
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
          <Button
            onClick={goToHomePage}
            variant="outline"
            className="flex items-center gap-2 bg-white hover:bg-gray-100 shadow-sm"
          >
            <Home className="h-4 w-4" />
            Volver a la página principal
          </Button>
        </div>

        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent
            className="bg-white max-w-md overflow-hidden p-0"
            onOpenAutoFocus={(event) => {
              event.preventDefault()
              document.getElementById("understood-button")?.focus()
            }}
          >
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-6">
              <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <DialogTitle className="text-2xl font-bold text-white text-center">¡Inscripción Exitosa!</DialogTitle>
            </div>
            <div className="p-6">
              <DialogDescription className="text-gray-700 text-base mb-4">
                <div className="mb-3">
                  Tu inscripción al <span className="font-semibold">Cicloturismo Termal</span> ha sido registrada
                  exitosamente.
                </div>
                <div className="mb-3">
                  Pronto recibirás un correo de confirmación con todos los detalles de tu participación y los próximos
                  pasos a seguir.
                </div>
                <div>Recuerda que deberás presentar tu DNI el día del evento para la acreditación.</div>
              </DialogDescription>
              <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4">
                <h4 className="text-green-800 font-medium flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  Información importante
                </h4>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>• Fecha del evento: 12 de Octubre de 2025</li>
                  <li>
                    • Lugar de acreditación:{" "}
                    <a
                      href="https://maps.app.goo.gl/sKgRGozptoXJrpY17"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Frente al predio de la Terminal de Ómnibus de Federación
                    </a>
                    .
                  </li>
                  <li>• Horario de acreditación: 7:30 AM</li>
                  <li>• Horario de salida: 8:30 AM</li>
                </ul>
              </div>
            </div>
            <DialogFooter className="bg-gray-50 p-4 flex flex-col gap-2">
              <Button
                id="understood-button"
                onClick={handleCloseSuccessDialog}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Entendido
              </Button>
              <Button variant="outline" onClick={goToHomePage} className="w-full bg-transparent">
                Volver a la página principal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="max-w-4xl mx-auto shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-pink-100 to-blue-100 rounded-t-lg">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
              Inscripción Cicloturismo Termal
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex items-center gap-1 bg-transparent"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
              )}
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-1 bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando inscripción...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Completar inscripción
                    </>
                  )}
                </Button>
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setFormData({
                        nombre: "",
                        apellido: "",
                        dni: "",
                        fechaNacimiento: "",
                        localidad: "",
                        email: "",
                        telefono: "",
                        paisTelefono: "Argentina",
                        telefonoEmergencia: "",
                        telefonoEmergencia: "Argentina",
                        grupoSanguineo: "",
                        grupoCiclistas: "",
                        genero: "",
                        talleRemera: "",
                        condicionesSalud: "",
                        aceptaCondiciones: false,
                        comprobantePago: null,
                        comprobantePagoUrl: "",
                        esCeliaco: "",
                      })
                      setBirthDate(undefined)
                      setFieldErrors({})
                    }}
                  >
                    Limpiar formulario
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Borrar todos los datos ingresados</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardFooter>
        </Card>
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 Cicloturismo Termal - Todos los derechos reservados</p>
        </div>
      </main>
    </div>
  )
}
