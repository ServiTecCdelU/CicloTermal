import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

// Evita que Next.js dev mode trate los mensajes de offline de Firestore como errores fatales
if (typeof window !== "undefined") {
  const _origError = console.error.bind(console)
  console.error = (...args: any[]) => {
    const msg = String(args[0] ?? "")
    if (msg.includes("Cloud Firestore backend") || msg.includes("client is offline") || msg.includes("offline mode")) {
      return
    }
    _origError(...args)
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Inicialización directa — protegida de SSR/prerender donde no hay API key
const app = getApps().length ? getApps()[0] : (firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null)
const db = app ? getFirestore(app) : (null as any)
const auth = app ? getAuth(app) : (null as any)

export { app, db, auth }
