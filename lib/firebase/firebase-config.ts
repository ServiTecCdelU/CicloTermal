import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
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

// Inicialización lazy: evita errores durante prerender estático de Next.js.
// En el cliente se inicializa una sola vez en la primera llamada.
let _app: FirebaseApp | null = null
let _db: Firestore | null = null
let _auth: Auth | null = null

function getApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  }
  return _app
}

// Exportados como getters para que se inicialicen solo cuando se usan (en client components)
export const app = new Proxy({} as FirebaseApp, { get: (_, prop) => (getApp() as any)[prop] })
export const db = new Proxy({} as Firestore, {
  get: (_, prop) => {
    if (!_db) _db = getFirestore(getApp())
    return (_db as any)[prop]
  },
})
export const auth = new Proxy({} as Auth, {
  get: (_, prop) => {
    if (!_auth) _auth = getAuth(getApp())
    return (_auth as any)[prop]
  },
})
