import { initializeApp } from "firebase/app"
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

// try-catch protege el prerender estático de /_not-found donde la API key
// puede estar vacía. En el cliente siempre inicializa correctamente.
let app: any = null
let db: any = null
let auth: any = null

try {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  auth = getAuth(app)
} catch {
  // Falla silenciosamente durante prerender — el provider maneja el caso null
}

export { app, db, auth }
