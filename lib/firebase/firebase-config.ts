import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getAnalytics } from "firebase/analytics"

// Usar las variables de entorno si están disponibles, de lo contrario usar la configuración predeterminada
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}
console.log()

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Inicializar servicios de Firebase
export const db = getFirestore(app)
export const auth = getAuth(app)

// Inicializar Analytics - Solo en el cliente
let analytics
if (typeof window !== "undefined") {
  // Solo inicializar Analytics en el navegador, no en el servidor
  analytics = getAnalytics(app)
}

export { app, analytics }
