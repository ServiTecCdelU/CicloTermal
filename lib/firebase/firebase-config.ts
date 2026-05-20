import { initializeApp, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getAuth, type Auth } from "firebase/auth"

// Evita que Next.js dev mode trate los mensajes de offline de Firestore como errores fatales
if (typeof window !== "undefined") {
  const _origError = console.error.bind(console)
  console.error = (...args: any[]) => {
    const msg = String(args[0] ?? "")
    if (msg.includes("Cloud Firestore backend") || msg.includes("client is offline") || msg.includes("offline mode")) {
      return // silenciar — es ruido de red, no un error de código
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

// Firebase solo se inicializa si hay API key (ausente durante prerender estático).
// En el cliente siempre existe porque NEXT_PUBLIC_* se inyecta en build.
const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : (undefined as unknown as FirebaseApp)
const db = app ? getFirestore(app) : (undefined as unknown as Firestore)
const auth = app ? getAuth(app) : (undefined as unknown as Auth)

export { app, db, auth }
