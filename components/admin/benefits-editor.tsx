"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
} from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trash2,
  Edit3,
  Plus,
  X,
  Check,
  GripVertical,
  Calendar,
  MapPin,
  Clock,
  Route,
  Navigation,
  TrendingUp,
  Users,
  DollarSign,
  Shirt,
  Package,
  Coffee,
  Apple,
  Shield,
  Heart,
  Wrench,
  Truck,
  Medal,
  Trophy,
  Award,
  Utensils,
  GlassWaterIcon as Water,
  Camera,
  Music,
  Tent,
  Car,
  Gift,
  Star,
  Sun,
  Map,
  Timer,
  Battery,
  Wifi,
  LigatureIcon as Bandage,
  Bike,
  Flag,
  Target,
  Users2,
  Bookmark,
  Tag,
  Flame,
  Crown,
  Leaf,
  Mountain,
  Glasses,
  Backpack,
  Phone,
  Mail,
  Bell,
  Activity,
  Lightbulb,
  Rocket,
  Globe,
} from "lucide-react"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import type { EventItem, BenefitItem, AlertState } from "@/types"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Iconos disponibles
const availableIcons = [
  { name: "Calendar", component: Calendar },
  { name: "MapPin", component: MapPin },
  { name: "Clock", component: Clock },
  { name: "Route", component: Route },
  { name: "Navigation", component: Navigation },
  { name: "TrendingUp", component: TrendingUp },
  { name: "Users", component: Users },
  { name: "DollarSign", component: DollarSign },
  { name: "Shirt", component: Shirt },
  { name: "Package", component: Package },
  { name: "Coffee", component: Coffee },
  { name: "Apple", component: Apple },
  { name: "Shield", component: Shield },
  { name: "Heart", component: Heart },
  { name: "Wrench", component: Wrench },
  { name: "Truck", component: Truck },
  // Iconos adicionales útiles para eventos
  { name: "Medal", component: Medal },
  { name: "Trophy", component: Trophy },
  { name: "Award", component: Award },
  { name: "Utensils", component: Utensils },
  { name: "Water", component: Water },
  { name: "Camera", component: Camera },
  { name: "Music", component: Music },
  { name: "Tent", component: Tent },
  { name: "Car", component: Car },
  { name: "Gift", component: Gift },
  { name: "Star", component: Star },
  { name: "Sun", component: Sun },
  { name: "Map", component: Map },
  { name: "Timer", component: Timer },
  { name: "Battery", component: Battery },
  { name: "Wifi", component: Wifi },
  { name: "Bandage", component: Bandage },
  { name: "Bike", component: Bike },
  { name: "Flag", component: Flag },
  { name: "Target", component: Target },
  { name: "Users2", component: Users2 },
  { name: "Bookmark", component: Bookmark },
  { name: "Tag", component: Tag },
  { name: "Flame", component: Flame },
  { name: "Crown", component: Crown },
  { name: "Leaf", component: Leaf },
  { name: "Mountain", component: Mountain },
  { name: "Glasses", component: Glasses },
  { name: "Backpack", component: Backpack },
  { name: "Phone", component: Phone },
  { name: "Mail", component: Mail },
  { name: "Bell", component: Bell },
  { name: "Activity", component: Activity },
  { name: "Lightbulb", component: Lightbulb },
  { name: "Rocket", component: Rocket },
  { name: "Globe", component: Globe },
]

export default function BenefitsEditor() {
  const { eventSettings } = useFirebaseContext()
  const [eventItems, setEventItems] = useState<EventItem[]>([])
  const [benefitItems, setBenefitItems] = useState<BenefitItem[]>([])
  const [loading, setLoading] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [editingBenefitId, setEditingBenefitId] = useState<string | null>(null)
  const [eventFormData, setEventFormData] = useState({
    label: "",
    value: "",
    iconName: "Calendar",
  })
  const [benefitFormData, setBenefitFormData] = useState({
    text: "",
    iconName: "Shirt",
    iconType: "lucide" as const,
    iconUrl: "",
    imagePreview: "",
  })
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    message: "",
    type: "success",
  })

  useEffect(() => {
    loadData()
  }, [eventSettings])

  const loadData = async (): Promise<void> => {
    try {
      const currentYear = eventSettings?.currentYear || new Date().getFullYear()

      // Load event items
      const eventQuery = query(
        collection(db, "benefits"),
        where("type", "==", "event"),
        where("year", "==", currentYear),
        orderBy("order", "asc"),
      )
      const eventSnapshot = await getDocs(eventQuery)
      const eventData = eventSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as EventItem,
      )
      setEventItems(eventData)

      // Load benefit items
      const benefitQuery = query(
        collection(db, "benefits"),
        where("type", "==", "benefit"),
        where("year", "==", currentYear),
        orderBy("order", "asc"),
      )
      const benefitSnapshot = await getDocs(benefitQuery)
      const benefitData = benefitSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as BenefitItem,
      )
      setBenefitItems(benefitData)
    } catch (error) {
      console.error("Error loading data:", error)
      showAlert("Error al cargar datos", "error")
    }
  }

  const showAlert = (message: string, type: "success" | "error" = "success"): void => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 5000)
  }

  // Event handlers
  const handleEventSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!eventFormData.label.trim() || !eventFormData.value.trim()) {
      showAlert("Todos los campos son requeridos", "error")
      return
    }

    setLoading(true)
    try {
      const currentYear = eventSettings?.currentYear || new Date().getFullYear()
      const eventData = {
        label: eventFormData.label.trim(),
        value: eventFormData.value.trim(),
        iconName: eventFormData.iconName,
        iconType: "lucide" as const,
        type: "event" as const,
        year: currentYear,
        updatedAt: new Date(),
      }

      if (editingEventId) {
        await updateDoc(doc(db, "benefits", editingEventId), eventData)
        showAlert("Item del evento actualizado exitosamente")
      } else {
        const maxOrder = eventItems.length > 0 ? Math.max(...eventItems.map((s) => s.order)) : -1
        await addDoc(collection(db, "benefits"), {
          ...eventData,
          order: maxOrder + 1,
          createdAt: new Date(),
        })
        showAlert("Item del evento agregado exitosamente")
      }

      resetEventForm()
      loadData()
    } catch (error) {
      console.error("Error guardando item del evento:", error)
      showAlert("Error al guardar item del evento", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleBenefitSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!benefitFormData.text.trim()) {
      showAlert("El texto es requerido", "error")
      return
    }

    setLoading(true)
    try {
      const currentYear = eventSettings?.currentYear || new Date().getFullYear()
      const benefitData = {
        text: benefitFormData.text.trim(),
        iconName: benefitFormData.iconName,
        iconType: benefitFormData.iconType,
        type: "benefit" as const,
        year: currentYear,
        updatedAt: new Date(),
      }

      if (editingBenefitId) {
        await updateDoc(doc(db, "benefits", editingBenefitId), benefitData)
        showAlert("Beneficio actualizado exitosamente")
      } else {
        const maxOrder = benefitItems.length > 0 ? Math.max(...benefitItems.map((s) => s.order)) : -1
        await addDoc(collection(db, "benefits"), {
          ...benefitData,
          order: maxOrder + 1,
          createdAt: new Date(),
        })
        showAlert("Beneficio agregado exitosamente")
      }

      resetBenefitForm()
      loadData()
    } catch (error) {
      console.error("Error guardando beneficio:", error)
      showAlert("Error al guardar beneficio", "error")
    } finally {
      setLoading(false)
    }
  }

  const resetEventForm = (): void => {
    setEventFormData({
      label: "",
      value: "",
      iconName: "Calendar",
    })
    setEditingEventId(null)
  }

  const resetBenefitForm = (): void => {
    setBenefitFormData({
      text: "",
      iconName: "Shirt",
      iconType: "lucide",
      iconUrl: "",
      imagePreview: "",
    })
    setEditingBenefitId(null)
  }

  const handleEditEvent = (item: EventItem): void => {
    setEventFormData({
      label: item.label,
      value: item.value,
      iconName: item.iconName,
    })
    setEditingEventId(item.id)
  }

  const handleEditBenefit = (item: BenefitItem): void => {
    setBenefitFormData({
      text: item.text,
      iconName: item.iconName,
      iconType: item.iconType,
      iconUrl: item.iconUrl || "",
      imagePreview: item.iconUrl || "",
    })
    setEditingBenefitId(item.id)
  }

  const handleDeleteEvent = async (id: string): Promise<void> => {
    if (!confirm("¿Estás seguro de que quieres eliminar este item?")) return

    try {
      await deleteDoc(doc(db, "benefits", id))
      showAlert("Item eliminado exitosamente")
      loadData()
    } catch (error) {
      console.error("Error eliminando item:", error)
      showAlert("Error al eliminar item", "error")
    }
  }

  const handleDeleteBenefit = async (id: string): Promise<void> => {
    if (!confirm("¿Estás seguro de que quieres eliminar este beneficio?")) return

    try {
      await deleteDoc(doc(db, "benefits", id))
      showAlert("Beneficio eliminado exitosamente")
      loadData()
    } catch (error) {
      console.error("Error eliminando beneficio:", error)
      showAlert("Error al eliminar beneficio", "error")
    }
  }

  // Drag and drop handlers
  const handleEventDragEnd = async (result: any) => {
    if (!result.destination) return

    const items = Array.from(eventItems)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setEventItems(items)

    const batch = writeBatch(db)
    items.forEach((item, index) => {
      batch.update(doc(db, "benefits", item.id), { order: index })
    })

    try {
      await batch.commit()
      showAlert("Orden actualizado exitosamente")
    } catch (error) {
      console.error("Error actualizando orden:", error)
      showAlert("Error al actualizar el orden", "error")
      loadData()
    }
  }

  const handleBenefitDragEnd = async (result: any) => {
    if (!result.destination) return

    const items = Array.from(benefitItems)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setBenefitItems(items)

    const batch = writeBatch(db)
    items.forEach((item, index) => {
      batch.update(doc(db, "benefits", item.id), { order: index })
    })

    try {
      await batch.commit()
      showAlert("Orden actualizado exitosamente")
    } catch (error) {
      console.error("Error actualizando orden:", error)
      showAlert("Error al actualizar el orden", "error")
      loadData()
    }
  }

  const getIconComponent = (iconName: string) => {
    const icon = availableIcons.find((i) => i.name === iconName)
    return icon ? icon.component : Calendar
  }

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-7xl">
      {/* Alert */}
      {alert.show && (
        <Alert
          className={`shadow-sm animate-in fade-in slide-in-from-top duration-300 ${
            alert.type === "error" ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === "error" ? (
              <X className="h-4 w-4 text-red-600" />
            ) : (
              <Check className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={`font-medium ${alert.type === "error" ? "text-red-700" : "text-green-700"}`}>
              {alert.message}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <Tabs defaultValue="event" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="event">Información del Evento</TabsTrigger>
          <TabsTrigger value="benefits">Beneficios de la Inscripción</TabsTrigger>
        </TabsList>

        {/* Tab Información del Evento */}
        <TabsContent value="event" className="space-y-6">
          {/* Formulario para agregar/editar items del evento */}
          <Card className="shadow-md border-t-4 border-t-primary">
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center gap-2 text-primary">
                {editingEventId ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {editingEventId ? "Editar Item del Evento" : "Agregar Item del Evento"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleEventSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-label">Título *</Label>
                    <Input
                      id="event-label"
                      value={eventFormData.label}
                      onChange={(e) => setEventFormData((prev) => ({ ...prev, label: e.target.value }))}
                      placeholder="Ej: Fecha"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-value">Descripción *</Label>
                    <Input
                      id="event-value"
                      value={eventFormData.value}
                      onChange={(e) => setEventFormData((prev) => ({ ...prev, value: e.target.value }))}
                      placeholder="Ej: 12 de Octubre"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-icon">Icono</Label>
                    <Select
                      value={eventFormData.iconName}
                      onValueChange={(value) => setEventFormData((prev) => ({ ...prev, iconName: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIcons.map((icon) => {
                          const IconComponent = icon.component
                          return (
                            <SelectItem key={icon.name} value={icon.name}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                {icon.name}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button type="submit" disabled={loading} className="flex items-center gap-2 min-w-[160px]" size="lg">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        {editingEventId ? "Actualizar" : "Agregar"} Item
                      </>
                    )}
                  </Button>

                  {editingEventId && (
                    <Button type="button" variant="outline" onClick={resetEventForm} size="lg">
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Lista de items del evento */}
          <Card className="shadow-md">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle>Items del Evento ({eventItems.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {eventItems.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="bg-muted/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No hay items del evento</h3>
                  <p className="text-muted-foreground">Agrega el primer item usando el formulario de arriba</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleEventDragEnd}>
                  <Droppable droppableId="event-items">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                      >
                        {eventItems.map((item, index) => {
                          const IconComponent = getIconComponent(item.iconName)
                          return (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`relative group overflow-hidden transition-all hover:shadow-lg ${
                                    snapshot.isDragging ? "shadow-2xl rotate-2" : ""
                                  }`}
                                >
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div
                                          {...provided.dragHandleProps}
                                          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                                        >
                                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 flex items-center justify-center">
                                          <IconComponent className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wide">
                                            {item.label}
                                          </h3>
                                          <p className="font-semibold text-gray-900 truncate">{item.value}</p>
                                        </div>
                                      </div>

                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleEditEvent(item)}
                                          className="flex-1"
                                        >
                                          <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                          Editar
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleDeleteEvent(item.id)}
                                          className="text-destructive hover:bg-destructive/10"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Beneficios */}
        <TabsContent value="benefits" className="space-y-6">
          {/* Formulario para agregar/editar beneficios */}
          <Card className="shadow-md border-t-4 border-t-primary">
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center gap-2 text-primary">
                {editingBenefitId ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {editingBenefitId ? "Editar Beneficio" : "Agregar Beneficio"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleBenefitSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="benefit-text">Texto del Beneficio *</Label>
                    <Input
                      id="benefit-text"
                      value={benefitFormData.text}
                      onChange={(e) => setBenefitFormData((prev) => ({ ...prev, text: e.target.value }))}
                      placeholder="Ej: Jersey oficial del evento"
                      required
                    />
                  </div>

                  {/* Opción de imagen personalizada */}
                  <div className="space-y-2">
                    <Label>Tipo de Icono</Label>
                    <Select
                      value={benefitFormData.iconType}
                      onValueChange={(value: "lucide" | "image") =>
                        setBenefitFormData((prev) => ({ ...prev, iconType: value, iconUrl: "", imagePreview: "" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lucide">Icono de Lucide</SelectItem>
                        <SelectItem value="image">Imagen personalizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Icono</Label>
                  <Select
                    value={benefitFormData.iconName}
                    onValueChange={(value) => setBenefitFormData((prev) => ({ ...prev, iconName: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableIcons.map((icon) => {
                        const IconComponent = icon.component
                        return (
                          <SelectItem key={icon.name} value={icon.name}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {icon.name}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button type="submit" disabled={loading} className="flex items-center gap-2 min-w-[160px]" size="lg">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        {editingBenefitId ? "Actualizar" : "Agregar"} Beneficio
                      </>
                    )}
                  </Button>

                  {editingBenefitId && (
                    <Button type="button" variant="outline" onClick={resetBenefitForm} size="lg">
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Lista de beneficios */}
          <Card className="shadow-md">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle>Beneficios ({benefitItems.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {benefitItems.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="bg-muted/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Package className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No hay beneficios registrados</h3>
                  <p className="text-muted-foreground">Agrega el primer beneficio usando el formulario de arriba</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleBenefitDragEnd}>
                  <Droppable droppableId="benefit-items">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                      >
                        {benefitItems.map((item, index) => {
                          const IconComponent = getIconComponent(item.iconName)
                          return (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`relative group overflow-hidden transition-all hover:shadow-lg ${
                                    snapshot.isDragging ? "shadow-2xl rotate-2" : ""
                                  }`}
                                >
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div
                                          {...provided.dragHandleProps}
                                          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                                        >
                                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                                      </div>

                                      <div className="flex items-start gap-2">
                                        <div className="flex-shrink-0">
                                          <div className="h-6 w-6 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center">
                                            {item.iconType === "image" && item.iconUrl ? (
                                              <img
                                                src={item.iconUrl || "/placeholder.svg"}
                                                alt="Icon"
                                                className="h-4 w-4 object-contain"
                                              />
                                            ) : (
                                              <IconComponent className="h-3 w-3 text-white" />
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-sm flex-1">{item.text}</p>
                                      </div>

                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleEditBenefit(item)}
                                          className="flex-1"
                                        >
                                          <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                          Editar
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleDeleteBenefit(item.id)}
                                          className="text-destructive hover:bg-destructive/10"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
