"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase/firebase-config"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { Loader2, MapPin, Plus, Trash2, ExternalLink, Check, X, Facebook, Instagram, Twitter } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ContactLink {
  id: string
  title: string
  url: string
  type: "facebook" | "instagram" | "twitter" | "otro"
}

interface ContactData {
  address: string
  phones: string[]
  email: string
  links: ContactLink[]
  mapUrl: string
  showMap: boolean
}

interface AlertState {
  show: boolean
  message: string
  type: "success" | "error"
}

const linkTypes = [
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "twitter", label: "Twitter", icon: Twitter },
  { value: "otro", label: "Otro", icon: ExternalLink },
]

export default function ContactEditor() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contactData, setContactData] = useState<ContactData>({
    address: "Federación, Entre Ríos, Argentina",
    phones: ["+54 9 3456 53-0720"],
    email: "",
    links: [],
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27326.25265830704!2d-57.94760566738281!3d-30.979729799999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95ae33e020a08b21%3A0x6a86cd05ca4d1ac9!2sFederaci%C3%B3n%2C%20Entre%20R%C3%ADos!5e0!3m2!1ses-419!2sar!4v1652364807261!5m2!1ses-419!2sar",
    showMap: true,
  })
  const [newLink, setNewLink] = useState({
    title: "",
    url: "",
    type: "otro" as const,
  })
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    message: "",
    type: "success",
  })

  useEffect(() => {
    const fetchContactData = async () => {
      try {
        const contactDoc = doc(db, "contacto", "info")
        const docSnap = await getDoc(contactDoc)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setContactData({
            address: data.address || contactData.address,
            phones: Array.isArray(data.phones) ? data.phones : contactData.phones,
            email: data.email || "",
            links: Array.isArray(data.links) ? data.links : [],
            mapUrl: data.mapUrl || contactData.mapUrl,
            showMap: data.showMap !== undefined ? data.showMap : contactData.showMap,
          })
        }
      } catch (error) {
        console.error("Error fetching contact data:", error)
        showAlert("Error al cargar datos de contacto", "error")
      } finally {
        setLoading(false)
      }
    }

    fetchContactData()
  }, [])

  const showAlert = (message: string, type: "success" | "error" = "success"): void => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 5000)
  }

  const handleInputChange = (field: keyof ContactData, value: any) => {
    setContactData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const addPhone = () => {
    setContactData((prev) => ({
      ...prev,
      phones: [...prev.phones, ""],
    }))
  }

  const updatePhone = (index: number, value: string) => {
    setContactData((prev) => ({
      ...prev,
      phones: prev.phones.map((phone, i) => (i === index ? value : phone)),
    }))
  }

  const removePhone = (index: number) => {
    if (contactData.phones.length > 1) {
      setContactData((prev) => ({
        ...prev,
        phones: prev.phones.filter((_, i) => i !== index),
      }))
    }
  }

  const addLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      showAlert("Título y URL son requeridos", "error")
      return
    }

    const link: ContactLink = {
      id: Date.now().toString(),
      title: newLink.title.trim(),
      url: newLink.url.trim(),
      type: newLink.type,
    }

    setContactData((prev) => ({
      ...prev,
      links: [...prev.links, link],
    }))

    setNewLink({ title: "", url: "", type: "otro" })
    showAlert("Enlace agregado correctamente")
  }

  const removeLink = (id: string) => {
    setContactData((prev) => ({
      ...prev,
      links: prev.links.filter((link) => link.id !== id),
    }))
    showAlert("Enlace eliminado correctamente")
  }

  const saveChanges = async () => {
    setSaving(true)
    try {
      // Filtrar teléfonos vacíos
      const cleanedData = {
        ...contactData,
        phones: contactData.phones.filter((phone) => phone.trim() !== ""),
        email: contactData.email.trim(),
      }

      await setDoc(doc(db, "contacto", "info"), {
        ...cleanedData,
        updatedAt: new Date(),
      })

      showAlert("Información de contacto actualizada correctamente")
    } catch (error) {
      console.error("Error saving contact data:", error)
      showAlert("Error al guardar los cambios", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-pink-500" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Dirección *</Label>
              <Input
                id="address"
                value={contactData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Dirección completa"
              />
            </div>

            <div className="space-y-2">
              <Label>Teléfonos *</Label>
              {contactData.phones.map((phone, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={phone}
                    onChange={(e) => updatePhone(index, e.target.value)}
                    placeholder="+54 9 3456 53-0720"
                  />
                  {contactData.phones.length > 1 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => removePhone(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addPhone} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Agregar teléfono
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={contactData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="contacto@ejemplo.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Enlaces adicionales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-violet-500" />
              Enlaces Adicionales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Agregar nuevo enlace */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <Label>Agregar enlace</Label>
              <div className="grid grid-cols-1 gap-2">
                <Input
                  placeholder="Título del enlace"
                  value={newLink.title}
                  onChange={(e) => setNewLink((prev) => ({ ...prev, title: e.target.value }))}
                />
                <Input
                  placeholder="https://ejemplo.com"
                  value={newLink.url}
                  onChange={(e) => setNewLink((prev) => ({ ...prev, url: e.target.value }))}
                />
                <Select
                  value={newLink.type}
                  onValueChange={(value: any) => setNewLink((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {linkTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addLink} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar enlace
                </Button>
              </div>
            </div>

            {/* Lista de enlaces */}
            {contactData.links.length > 0 && (
              <div className="space-y-2">
                <Label>Enlaces guardados</Label>
                {contactData.links.map((link) => {
                  const LinkIcon = linkTypes.find((t) => t.value === link.type)?.icon || ExternalLink
                  return (
                    <div key={link.id} className="flex items-center gap-2 p-2 border rounded">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{link.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeLink(link.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Configuración del mapa */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Mapa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="showMap"
              checked={contactData.showMap}
              onCheckedChange={(checked) => handleInputChange("showMap", checked)}
            />
            <Label htmlFor="showMap">Mostrar mapa</Label>
          </div>

          {contactData.showMap && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mapUrl">URL del mapa (iframe de Google Maps)</Label>
                <Textarea
                  id="mapUrl"
                  value={contactData.mapUrl}
                  onChange={(e) => handleInputChange("mapUrl", e.target.value)}
                  rows={4}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
                <p className="text-xs text-muted-foreground">
                  Puedes obtener este código desde Google Maps: Compartir &gt; Incorporar un mapa
                </p>
              </div>

              <div className="border rounded-lg overflow-hidden h-60">
                <iframe
                  src={contactData.mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa de ubicación"
                ></iframe>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button onClick={saveChanges} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
