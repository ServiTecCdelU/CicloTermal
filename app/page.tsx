"use client"

import dynamic from "next/dynamic"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import CarouselSection from "@/components/carousel-section"

const HistorySection = dynamic(() => import("@/components/history-section"))
const BenefitsSection = dynamic(() => import("@/components/benefits-section"))
const JerseySection = dynamic(() => import("@/components/jersey-section"))
const PhotosSection = dynamic(() => import("@/components/photos-section"))
const SponsorsSection = dynamic(() => import("@/components/sponsors-section"))
const ContactSection = dynamic(() => import("@/components/contact-section"))

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      <Navbar />
      <main>
        <section id="inicio">
          <CarouselSection />
        </section>
        <section id="historia" className="py-16">
          <HistorySection />
        </section>
        <section id="evento" className="py-16 bg-gradient-to-r from-violet-50 to-blue-50">
          <BenefitsSection />
        </section>
        {/**/}
          <section id="remera" className="py-16">
          <JerseySection />
        </section>
        {/**/}
        <section id="fotos" className="py-16">
          <PhotosSection />
        </section>
        <section id="sponsors" className="py-16 bg-gradient-to-r from-pink-50 to-violet-50">
          <SponsorsSection />
        </section>
        <section id="contacto" className="py-16">
          <ContactSection />
        </section>
      </main>
      <Footer />
    </div>
  )
}
