"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Redirigir si ya hay sesión activa (incluyendo callback de OAuth)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user?.email) {
        await redirectByRole(session.user.email)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const redirectByRole = async (userEmail: string) => {
    const { data } = await supabase.from("admins").select("role").eq("email", userEmail).single()

    if (data?.role === "admin") {
      router.push("/admin/dashboard")
    } else if (data?.role === "remera") {
      router.push("/admin/remera")
    } else if (data?.role === "pending") {
      await supabase.auth.signOut()
      setError("Tu cuenta está pendiente de aprobación por un administrador.")
      setLoading(false)
    } else {
      // Usuario no existe en admins → agregar como pending
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from("admins").insert({
        email: userEmail,
        display_name: user?.user_metadata?.full_name ?? "",
        photo_url: user?.user_metadata?.avatar_url ?? "",
        role: "pending",
        login_method: user?.app_metadata?.provider ?? "email",
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      })
      await supabase.auth.signOut()
      setError("Gracias por registrarte. Tu solicitud de acceso está pendiente de aprobación.")
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError("")
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/admin" },
      })
      if (error) throw error
      // El browser redirige a Google — no se hace setLoading(false) acá
    } catch {
      setError("Error al iniciar sesión con Google.")
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Acceso Administradores</CardTitle>
          <CardDescription className="text-center">
            Ingresa tus credenciales para acceder al panel administrativo
          </CardDescription>
        </CardHeader>

        {error && (
          <div className="mx-6 mb-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <CardFooter className="flex flex-col space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" aria-hidden="true">
              <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
              <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
              <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
              <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.2154 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
            </svg>
            Iniciar sesión con Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
