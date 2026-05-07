"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { db } from "../../lib/firebase/firebase-config"
import { collection, getDocs, query, where, addDoc, updateDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Mail, ChevronDown, ChevronUp } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Estado para mantener la sección de email/password abierta
  const [isEmailSectionOpen, setIsEmailSectionOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('emailSectionOpen')
      return saved !== null ? JSON.parse(saved) : false
    }
    return false
  })

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('emailSectionOpen', JSON.stringify(isEmailSectionOpen))
    }
  }, [isEmailSectionOpen])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const auth = getAuth()
      // Autenticar con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Verificar si el usuario existe en la colección de admins
      const adminsRef = collection(db, "admins")
      const adminQuery = query(adminsRef, where("email", "==", user.email))
      const adminSnapshot = await getDocs(adminQuery)

      if (!adminSnapshot.empty) {
        // El usuario ya está en la colección de admins
        const adminDoc = adminSnapshot.docs[0]
        const adminData = adminDoc.data()
        
        // Verificar si el usuario tiene rol de administrador
        if (adminData.role === "admin") {
          // El usuario es administrador aprobado, redirigir al dashboard
          router.push("/admin/dashboard")
        } else {
          // El usuario está pendiente de aprobación
          await auth.signOut()
          setError("Tu cuenta está pendiente de aprobación por un administrador.")
        }
      } else {
        // El usuario no existe en la colección de admins, agregarlo como pendiente
        try {
          await addDoc(collection(db, "admins"), {
            email: user.email,
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
            role: "pending", // Usuario pendiente de aprobación
            loginMethod: "email",
            createdAt: new Date(),
            lastLogin: new Date()
          })
          
          // Cerrar sesión ya que aún no está aprobado
          await auth.signOut()
          setError("Gracias por registrarte. Tu solicitud de acceso está pendiente de aprobación.")
        } catch (addError) {
          console.error("Error al guardar usuario en admins:", addError)
          await auth.signOut()
          setError("Error al procesar la solicitud. Por favor, intenta nuevamente.")
        }
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setError("Credenciales incorrectas. Por favor, verifica tu email y contraseña.")
      } else if (error.code === "auth/too-many-requests") {
        setError("Demasiados intentos fallidos. Por favor, intenta más tarde.")
      } else {
        setError("Error al iniciar sesión. Por favor, intenta nuevamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError("")
    setLoading(true)

    try {
      const auth = getAuth()
      const provider = new GoogleAuthProvider()
      
      // Autenticar con Google
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      
      // Verificar si el usuario de Google existe en la colección de admins
      const adminsRef = collection(db, "admins")
      const adminQuery = query(adminsRef, where("email", "==", user.email))
      const adminSnapshot = await getDocs(adminQuery)

      if (!adminSnapshot.empty) {
        // El usuario ya está en la colección de admins
        const adminDoc = adminSnapshot.docs[0]
        const adminData = adminDoc.data()
        
        // Actualizar último login
        try {
          await updateDoc(adminDoc.ref, {
            lastLogin: new Date()
          })
        } catch (updateError) {
          console.error("Error al actualizar último login:", updateError)
        }
        
        // Verificar si el usuario tiene rol de administrador
        if (adminData.role === "admin") {
          // El usuario es administrador aprobado, redirigir al dashboard
          router.push("/admin/dashboard")
        } else {
          // El usuario está pendiente de aprobación
          await auth.signOut()
          setError("Tu cuenta está pendiente de aprobación por un administrador.")
        }
      } else {
        // El usuario no existe en la colección de admins, agregarlo como pendiente
        try {
          await addDoc(collection(db, "admins"), {
            email: user.email,
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
            role: "pending", // Usuario pendiente de aprobación
            loginMethod: "google",
            createdAt: new Date(),
            lastLogin: new Date()
          })
          
          // Cerrar sesión ya que aún no está aprobado
          await auth.signOut()
          setError("Gracias por registrarte. Tu solicitud de acceso está pendiente de aprobación.")
        } catch (addError) {
          console.error("Error al guardar usuario en admins:", addError)
          await auth.signOut()
          setError("Error al procesar la solicitud. Por favor, intenta nuevamente.")
        }
      }
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error)
      if (error.code === "auth/popup-closed-by-user") {
        setError("Inicio de sesión cancelado. Por favor, intenta nuevamente.")
      } else if (error.code === "auth/cancelled-popup-request") {
        setError("La solicitud de inicio de sesión fue cancelada. Por favor, intenta nuevamente.")
      } else {
        setError("Error al iniciar sesión con Google. Por favor, intenta nuevamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleEmailSection = () => {
    setIsEmailSectionOpen(prev => !prev)
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

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {/* Sección colapsable para email/password */}
            <div className="border rounded-lg">
             
            
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            {isEmailSectionOpen && (
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            )}
          </CardFooter>
        </form>

        <CardFooter className="flex flex-col space-y-2">
            
          <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleLogin} 
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" aria-hidden="true">
              <path
                d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                fill="#EA4335"
              />
              <path
                d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                fill="#4285F4"
              />
              <path
                d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                fill="#FBBC05"
              />
              <path
                d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.2154 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                fill="#34A853"
              />
            </svg>
            Iniciar sesión con Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
