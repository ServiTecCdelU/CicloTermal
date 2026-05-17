"use client"

import { useState, useMemo, useEffect } from "react"
import { SectionTitle } from "@/components/section-title"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { useCachedDoc } from "@/lib/use-cached-firestore"
import { db } from "@/lib/firebase/firebase-config"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Shirt, Search, CheckCircle2, UploadCloud, Plus, Trash2, PencilLine } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface JerseyFeature {
  id: string
  title: string
  description: string
}

interface JerseyData {
  title: string
  description: string
  imageUrl: string
  showSection: boolean
  callToActionTitle: string
  callToActionDescription: string
  features: JerseyFeature[]
}

const defaultJerseyData: JerseyData = {
  title: "Remera Oficial del Evento",
  description:
    "Diseño exclusivo para la Segunda Edición del Cicloturismo Termal de Federación. Confeccionada con materiales de alta calidad, perfecta para ciclistas que buscan comodidad y estilo.",
  imageUrl: "/placeholder.svg?height=600&width=600",
  showSection: true,
  callToActionTitle: "¡Pedí tu remera!",
  callToActionDescription: "Completá el formulario para reservar tu remera oficial.",
  features: [
    { id: "1", title: "Material Premium", description: "Tela transpirable y cómoda" },
    { id: "2", title: "Diseño Exclusivo", description: "Solo para participantes" },
    { id: "3", title: "Todos los Talles", description: "S, M, L, XL, XXL" },
    { id: "4", title: "Recuerdo Único", description: "Lleva el evento contigo" },
  ],
}

const talles = ["S", "M", "L", "XL", "XXL"]

interface RemeraItem {
  talle: string
  cantidad: number
}

function RemeroFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast()
  const [step, setStep] = useState<"dni" | "form" | "success">("dni")
  const [dni, setDni] = useState("")
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [items, setItems] = useState<RemeraItem[]>([{ talle: "", cantidad: 1 }])
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [estaRegistrado, setEstaRegistrado] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [existingTieneComprobante, setExistingTieneComprobante] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [aliasRemera, setAliasRemera] = useState<string | null>(null)

  useEffect(() => {
    getDoc(doc(db, "settings", "remera")).then((snap) => {
      if (snap.exists()) setAliasRemera(snap.data().alias ?? null)
    })
  }, [])

  const handleClose = () => {
    setStep("dni")
    setDni("")
    setNombre("")
    setTelefono("")
    setItems([{ talle: "", cantidad: 1 }])
    setComprobante(null)
    setEstaRegistrado(false)
    setIsEditing(false)
    setExistingTieneComprobante(false)
    onClose()
  }

  const buscarPorDni = async () => {
    if (!dni.trim() || !/^\d{7,8}$/.test(dni.trim())) {
      toast({ title: "DNI inválido", description: "Ingresá un DNI de 7 u 8 dígitos.", variant: "destructive" })
      return
    }
    setBuscando(true)
    try {
      // Buscar inscripción
      const partSnap = await getDoc(doc(db, "participantesCicloTermal", dni.trim()))
      if (partSnap.exists()) {
        const data = partSnap.data()
        setNombre(`${data.nombre || ""} ${data.apellido || ""}`.trim())
        setTelefono(data.telefono || "")
        setEstaRegistrado(true)
      } else {
        setNombre("")
        setTelefono("")
        setEstaRegistrado(false)
      }

      // Buscar pedido de remera existente
      const remeraSnap = await getDoc(doc(db, "remera", dni.trim()))
      if (remeraSnap.exists()) {
        const rd = remeraSnap.data()
        if (rd.items?.length) {
          setItems(rd.items)
        } else if (rd.talle) {
          setItems([{ talle: rd.talle, cantidad: 1 }])
        }
        if (!partSnap.exists()) {
          setNombre(rd.nombre || "")
          setTelefono(rd.telefono || "")
        }
        setExistingTieneComprobante(rd.tieneComprobante ?? !!rd.comprobanteBase64)
        setIsEditing(true)
      }

      setStep("form")
    } catch {
      toast({ title: "Error", description: "No se pudo consultar el DNI.", variant: "destructive" })
    } finally {
      setBuscando(false)
    }
  }

  const addItem = () => {
    if (items.length >= 5) return
    setItems((prev) => [...prev, { talle: "", cantidad: 1 }])
  }

  const removeItem = (idx: number) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateItem = (idx: number, field: keyof RemeraItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Archivo demasiado grande", description: "Debe ser menor a 5MB.", variant: "destructive" })
      e.target.value = ""
      return
    }
    if (!["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(file.type)) {
      toast({ title: "Tipo no válido", description: "Solo JPG, PNG o PDF.", variant: "destructive" })
      e.target.value = ""
      return
    }
    setComprobante(file)
  }

  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error("Error al procesar el archivo"))
    })

  const handleSubmit = async () => {
    if (!nombre.trim()) { toast({ title: "Nombre requerido", variant: "destructive" }); return }
    if (!telefono.trim()) { toast({ title: "Teléfono requerido", variant: "destructive" }); return }

    const validItems = items.filter((i) => i.talle && i.cantidad >= 1)
    if (validItems.length === 0) {
      toast({ title: "Seleccioná al menos un talle", variant: "destructive" })
      return
    }

    if (!comprobante && !existingTieneComprobante) {
      toast({ title: "Subí el comprobante de pago", variant: "destructive" })
      return
    }

    setEnviando(true)
    try {
      if (comprobante) {
        const comprobanteBase64 = await convertToBase64(comprobante)
        await setDoc(doc(db, "remera_comprobantes", dni.trim()), {
          comprobanteBase64,
          nombreArchivo: comprobante.name,
        })
      }

      await setDoc(
        doc(db, "remera", dni.trim()),
        {
          dni: dni.trim(),
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          items: validItems,
          tieneComprobante: !!comprobante || existingTieneComprobante,
          estaRegistrado,
          ...(isEditing ? {} : { estado: "pendiente", fechaSolicitud: new Date().toISOString() }),
        },
        { merge: true }
      )

      setStep("success")
    } catch {
      toast({ title: "Error al guardar", description: "Intentá de nuevo.", variant: "destructive" })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">
            {isEditing ? "Editar pedido de remera" : "Pedir remera oficial"}
          </DialogTitle>
        </DialogHeader>

        {step === "dni" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dni-input">DNI</Label>
              <div className="flex gap-2">
                <Input
                  id="dni-input"
                  placeholder="Ej: 38123456"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                  maxLength={8}
                  onKeyDown={(e) => e.key === "Enter" && buscarPorDni()}
                />
                <Button onClick={buscarPorDni} disabled={buscando} className="shrink-0">
                  {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">Si ya tenés un pedido, podés editarlo con tu DNI.</p>
            </div>
          </div>
        )}

        {step === "form" && (
          <div className="space-y-4">
            {isEditing && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-3 py-2 rounded-md flex items-center gap-2">
                <PencilLine className="h-4 w-4 shrink-0" />
                Ya tenés un pedido registrado. Podés modificarlo.
              </div>
            )}
            {!isEditing && !estaRegistrado && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2 rounded-md">
                No encontramos tu inscripción. La remera se retira el día del evento.
              </div>
            )}
            {!isEditing && estaRegistrado && (
              <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-3 py-2 rounded-md">
                Inscripción encontrada. Datos precargados.
              </div>
            )}

            <div className="space-y-2">
              <Label>Nombre y apellido</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre completo"
                readOnly={estaRegistrado}
                className={estaRegistrado ? "bg-gray-50" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
                placeholder="Ej: 3456123456"
                readOnly={estaRegistrado}
                className={estaRegistrado ? "bg-gray-50" : ""}
              />
            </div>

            {/* Items: talle + cantidad */}
            <div className="space-y-2">
              <Label>Talles</Label>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Select value={item.talle} onValueChange={(v) => updateItem(idx, "talle", v)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Talle" />
                      </SelectTrigger>
                      <SelectContent>
                        {talles.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={item.cantidad}
                      onChange={(e) => updateItem(idx, "cantidad", Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center"
                    />
                    {items.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-400 hover:text-red-500"
                        onClick={() => removeItem(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {items.length < 5 && (
                  <Button variant="outline" size="sm" onClick={addItem} className="w-full text-xs gap-1">
                    <Plus className="h-3 w-3" />
                    Agregar talle
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 space-y-1">
              <p className="font-semibold">Precio: $32.000 por remera</p>
              {aliasRemera && (
                <p>Alias para transferir: <span className="font-semibold">{aliasRemera}</span></p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Comprobante de pago
                {existingTieneComprobante && (
                  <span className="ml-2 text-xs text-gray-400 font-normal">(ya tenés uno subido, podés reemplazarlo)</span>
                )}
              </Label>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 transition-colors bg-gray-50">
                <div className="flex flex-col items-center">
                  <UploadCloud className="h-6 w-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">
                    {comprobante ? comprobante.name : "JPG, PNG o PDF · máx 5MB"}
                  </span>
                </div>
                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("dni")} className="flex-1">
                Atrás
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={enviando}
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
              >
                {enviando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isEditing ? "Guardar cambios" : "Enviar pedido"}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? "¡Pedido actualizado!" : "¡Pedido registrado!"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing
                  ? "Tu pedido fue actualizado correctamente."
                  : "Tu solicitud de remera fue enviada. Nos pondremos en contacto."}
              </p>
            </div>
            <Button onClick={handleClose} className="mt-2">Cerrar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function JerseySection() {
  const { eventSettings, isFirebaseAvailable } = useFirebaseContext()
  const currentYear = eventSettings?.currentYear || new Date().getFullYear()
  const [modalOpen, setModalOpen] = useState(false)

  const { data: rawDoc, loading } = useCachedDoc(
    `ct_jersey_v2_${currentYear}`,
    "jersey",
    "info",
    isFirebaseAvailable,
  )

  const jerseyData = useMemo<JerseyData>(() => {
    if (!rawDoc) return defaultJerseyData
    return {
      title: rawDoc.title || defaultJerseyData.title,
      description: rawDoc.description || defaultJerseyData.description,
      imageUrl: rawDoc.imageUrl || defaultJerseyData.imageUrl,
      showSection: rawDoc.showSection !== undefined ? rawDoc.showSection : defaultJerseyData.showSection,
      callToActionTitle: rawDoc.callToActionTitle || defaultJerseyData.callToActionTitle,
      callToActionDescription: rawDoc.callToActionDescription || defaultJerseyData.callToActionDescription,
      features: rawDoc.features || defaultJerseyData.features,
    }
  }, [rawDoc, currentYear])

  if (!jerseyData.showSection) {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 text-center py-12">
        <div className="flex justify-center items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <RemeroFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <SectionTitle>{jerseyData.title}</SectionTitle>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4">Llevá el espíritu del evento contigo</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Imagen de la remera */}
            <div className="relative w-[240px] h-[240px] md:w-[400px] md:h-[400px] flex-shrink-0 mx-auto md:mx-0">
              <div className="relative bg-white rounded-2xl shadow-xl p-6 md:p-8 transform hover:scale-105 transition-transform duration-300 w-full h-full">
                <div className="relative w-full h-full overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={jerseyData.imageUrl || "/placeholder.svg?height=600&width=600"}
                    alt={jerseyData.title}
                    className="w-full h-full object-contain hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>

            {/* Contenido descriptivo */}
            <div className="flex-1 space-y-6 md:space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1 md:px-4 md:py-2 bg-red-50 rounded-full border border-red-200">
                  <span className="text-xs md:text-sm font-medium text-red-600">
                    Edición Limitada
                  </span>
                </div>

                <div className="prose max-w-none">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed text-justify">
                    {jerseyData.description}
                  </p>
                </div>
              </div>

              {/* Características destacadas */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {jerseyData.features.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-start space-x-2 bg-gray-50 p-2 md:p-3 rounded-lg shadow-sm border border-gray-200"
                  >
                    <div className="flex-shrink-0 mx-1">
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-gray-900 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">✓</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 text-xs md:text-sm leading-tight">{feature.title}</h4>
                      <p className="text-xs md:text-sm text-gray-600 leading-tight">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Call to action con botón */}
              <div className="p-4 md:p-6 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="text-center space-y-3">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">
                    {jerseyData.callToActionTitle}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">{jerseyData.callToActionDescription}</p>
                  <Button
                    onClick={() => setModalOpen(true)}
                    className="bg-red-600 text-white hover:bg-red-700 font-semibold px-6 py-2"
                  >
                    <Shirt className="h-4 w-4 mr-2" />
                    Pedir remera
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
