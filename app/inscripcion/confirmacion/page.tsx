"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { CheckCircle, Info } from "lucide-react"
import { db } from "@/lib/firebase/firebase-config"
import { doc, getDoc } from "firebase/firestore"

const defaults = {
  titulo: "¡Inscripción Exitosa!",
  descripcion: "Tu inscripción al Cicloturismo Termal de Federación ha sido registrada correctamente.",
  mensaje: "Pronto recibirás un correo de confirmación con todos los detalles.\nRecuerda presentar tu DNI el día del evento para la acreditación.",
  infoExtra: "• Presentate con tu DNI el día del evento.\n• Lugar de acreditación: Frente al predio de la Terminal de Ómnibus de Federación.\n• Horario de acreditación: 7:30 AM\n• Horario de salida: 8:30 AM",
}

export default function ConfirmationPage() {
  const [data, setData] = useState(defaults)

  useEffect(() => {
    getDoc(doc(db, "settings", "confirmacion")).then((snap) => {
      if (snap.exists()) {
        const d = snap.data()
        setData({
          titulo: d.titulo || defaults.titulo,
          descripcion: d.descripcion || defaults.descripcion,
          mensaje: d.mensaje || defaults.mensaje,
          infoExtra: d.infoExtra || defaults.infoExtra,
        })
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
              {data.titulo}
            </CardTitle>
            <CardDescription className="text-lg">
              {data.descripcion}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.mensaje.split("\n").map((line, i) => (
              <p key={i} className="text-center text-gray-700">{line}</p>
            ))}

            {data.infoExtra && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-1">
                <p className="font-semibold text-blue-800 flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  Información importante
                </p>
                {data.infoExtra.split("\n").map((line, i) => (
                  <p key={i} className="text-sm text-blue-700">{line}</p>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/">
              <Button className="bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 hover:from-pink-600 hover:via-violet-600 hover:to-blue-600">
                Volver al inicio
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
