"use client"

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getAuth, type Auth } from "firebase/auth"

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

function initFirebase() {
  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
  return { app, db: getFirestore(app), auth: getAuth(app) }
}

let _app: FirebaseApp
let _db: Firestore
let _auth: Auth

// Inicialización inmediata en el cliente, protegida en server
if (typeof window !== "undefined") {
  const fb = initFirebase()
  _app = fb.app
  _db = fb.db
  _auth = fb.auth
} else {
  try {
    const fb = initFirebase()
    _app = fb.app
    _db = fb.db
    _auth = fb.auth
  } catch {
    // Prerender estático sin env vars — los exports quedan undefined
    // pero nunca se usan en server porque todo es "use client"
  }
}

export const app = _app!
export const db = _db!
export const auth = _auth!
