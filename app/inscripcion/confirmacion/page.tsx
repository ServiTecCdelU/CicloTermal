import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { CheckCircle } from "lucide-react"

export default function ConfirmationPage() {
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
              ¡Inscripción Exitosa!
            </CardTitle>
            <CardDescription className="text-lg">
              Tu inscripción al Cicloturismo Termal de Federación ha sido registrada correctamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>
              Hemos recibido tu información y comprobante de pago. Recibirás un correo electrónico con la
              confirmación de tu inscripción.
              Su inscripción es sin remera, ya que no hay más talles disponibles
            </p>
            <p>Recuerda que el evento se realizará el 12 de octubre de 2025 en Federación, Entre Ríos.</p>
            <p className="font-medium">¡Gracias por ser parte de esta experiencia!</p>
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
