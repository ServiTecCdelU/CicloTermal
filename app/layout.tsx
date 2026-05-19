import type React from "react"
import type { Metadata } from "next"
import { Inter, Permanent_Marker } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { FirebaseProvider } from "@/lib/firebase/firebase-provider"

const inter = Inter({ subsets: ["latin"] })
const permanentMarker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-marker",
})

export const metadata: Metadata = {
  title: "Cicloturismo Termal de Federación",
  description: "Evento de cicloturismo en Federación, Entre Ríos, Argentina",
  generator: "v0.dev",
  metadataBase: new URL("https://ciclo-turismo.vercel.app"),
  openGraph: {
    title: "Cicloturismo Termal de Federación",
    description: "Evento de cicloturismo en Federación, Entre Ríos, Argentina",
    siteName: "Cicloturismo Termal",
    images: [
      {
        url: "/logo.jpg", // Imagen alojada en /public/logo.jpg
        alt: "Logo Cicloturismo Termal",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cicloturismo Termal de Federación",
    description: "Evento de cicloturismo en Federación, Entre Ríos, Argentina",
    images: ["/logo 1.jpg"],
  },
}



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} ${permanentMarker.variable} min-h-screen bg-white text-black flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <FirebaseProvider>
            {children}
            <Toaster />
          </FirebaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
