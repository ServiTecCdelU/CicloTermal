"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, setDoc, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Moon, Sunrise, Check, X, Save } from "lucide-react"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ItineraryDay {
  day: "sabado" | "domingo"
  title: string
  time: string
  subtitle: string
  content: string
  year: number
}

const emptyDay = (day: "sabado" | "domingo", year: number): ItineraryDay => ({
  day,
  title: "",
  time: "",
  subtitle: "",
  content: "",
  year,
})

export default function ItineraryEditor() {
  const { eventSettings } = useFirebaseContext()
  const currentYear = eventSettings?.currentYear || new Date().getFullYear()

  const [sabado, setSabado] = useState<ItineraryDay>(emptyDay("sabado", currentYear))
  const [domingo, setDomingo] = useState<ItineraryDay>(emptyDay("domingo", currentYear))
  const [loading, setLoading] = useState<"sabado" | "domingo" | null>(null)
  const [alert, setAlert] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false, message: "", type: "success",
  })

  useEffect(() => {
    loadData()
  }, [currentYear])

  const loadData = async () => {
    try {
      const q = query(collection(db, "itinerario"), where("year", "==", currentYear))
      const snapshot = await getDocs(q)
      snapshot.docs.forEach((d) => {
        const data = d.data() as ItineraryDay
        if (data.day === "sabado") setSabado({ ...emptyDay("sabado", currentYear), ...data })
        if (data.day === "domingo") setDomingo({ ...emptyDay("domingo", currentYear), ...data })
      })
    } catch (error) {
      console.error("Error cargando itinerario:", error)
    }
  }

  const showAlert = (message: string, type: "success" | "error" = "success") => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 5000)
  }

  const saveDay = async (dayData: ItineraryDay) => {
    setLoading(dayData.day)
    try {
      const docId = `${currentYear}_${dayData.day}`
      await setDoc(doc(db, "itinerario", docId), {
        ...dayData,
        year: currentYear,
        updatedAt: new Date(),
      })
      showAlert(`${dayData.day === "sabado" ? "Sabado" : "Domingo"} guardado`)
    } catch (error) {
      console.error("Error guardando:", error)
      showAlert("Error al guardar", "error")
    } finally {
      setLoading(null)
    }
  }

  const renderDayCard = (
    dayData: ItineraryDay,
    setter: (d: ItineraryDay) => void,
    icon: React.ReactNode,
    label: string,
  ) => (
    <Card className="shadow-md border-t-4 border-t-primary">
      <CardHeader className="bg-muted/50">
        <CardTitle className="flex items-center gap-2 text-primary">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Titulo (ej: SABADO 10)</Label>
            <Input
              value={dayData.title}
              onChange={(e) => setter({ ...dayData, title: e.target.value })}
              placeholder={dayData.day === "sabado" ? "SABADO 10" : "DOMINGO 11"}
            />
          </div>
          <div className="space-y-2">
            <Label>Hora (ej: 18:30 hs)</Label>
            <Input
              value={dayData.time}
              onChange={(e) => setter({ ...dayData, time: e.target.value })}
              placeholder="18:30 hs"
            />
          </div>
          <div className="space-y-2">
            <Label>Subtitulo (ej: La Nocturna)</Label>
            <Input
              value={dayData.subtitle}
              onChange={(e) => setter({ ...dayData, subtitle: e.target.value })}
              placeholder="La Nocturna"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Contenido</Label>
          <Textarea
            value={dayData.content}
            onChange={(e) => setter({ ...dayData, content: e.target.value })}
            placeholder="Pega aca el texto completo del itinerario del dia..."
            rows={12}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">Pega el texto tal cual. Se muestra respetando los saltos de linea.</p>
        </div>
        <Button
          onClick={() => saveDay(dayData)}
          disabled={loading === dayData.day}
          className="w-full sm:w-auto"
          size="lg"
        >
          {loading === dayData.day ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Guardando...</>
          ) : (
            <><Save className="h-5 w-5 mr-2" />Guardar {label}</>
          )}
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {alert.show && (
        <Alert className={`shadow-sm animate-in fade-in slide-in-from-top duration-300 ${alert.type === "error" ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}`}>
          <div className="flex items-center gap-2">
            {alert.type === "error" ? <X className="h-4 w-4 text-red-600" /> : <Check className="h-4 w-4 text-green-600" />}
            <AlertDescription className={`font-medium ${alert.type === "error" ? "text-red-700" : "text-green-700"}`}>
              {alert.message}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="space-y-6">
        {renderDayCard(sabado, setSabado, <Moon className="h-5 w-5" />, "Sabado")}
        {renderDayCard(domingo, setDomingo, <Sunrise className="h-5 w-5" />, "Domingo")}
      </div>
    </div>
  )
}
