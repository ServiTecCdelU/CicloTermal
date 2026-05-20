"use client"

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import JerseySection from "@/components/jersey-section"

export default function PedirRemeraPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-24 pb-16">
        <JerseySection />
      </main>
      <Footer />
    </div>
  )
}
