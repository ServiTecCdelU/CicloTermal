"use client"

import dynamic from "next/dynamic"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import CarouselSection from "@/components/carousel-section"
import { BikeIcon, HeartIcon } from "@/components/section-title"

const sectionFallback = () => <div className="py-16 animate-pulse"><div className="h-64 bg-gray-100 rounded-lg mx-auto max-w-6xl" /></div>

const HistorySection = dynamic(() => import("@/components/history-section"), { loading: sectionFallback, ssr: false })
const BenefitsSection = dynamic(() => import("@/components/benefits-section"), { loading: sectionFallback, ssr: false })
const JerseySection = dynamic(() => import("@/components/jersey-section"), { loading: sectionFallback, ssr: false })
const PhotosSection = dynamic(() => import("@/components/photos-section"), { loading: sectionFallback, ssr: false })
const SponsorsSection = dynamic(() => import("@/components/sponsors-section"), { loading: sectionFallback, ssr: false })
const ContactSection = dynamic(() => import("@/components/contact-section"), { loading: sectionFallback, ssr: false })

function BikeDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-2 overflow-hidden">
      <div className="h-px bg-gray-200 flex-1 max-w-xs" />
      <BikeIcon size={40} className="opacity-80" />
      <HeartIcon size={16} />
      <BikeIcon size={40} className="opacity-80 scale-x-[-1]" />
      <div className="h-px bg-gray-200 flex-1 max-w-xs" />
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <section id="inicio">
          <CarouselSection />
        </section>
        <BikeDivider />
        <section id="historia" className="py-16">
          <HistorySection />
        </section>
        <BikeDivider />
        <section id="evento" className="py-16 bg-gray-50">
          <BenefitsSection />
        </section>
        <BikeDivider />
        <section id="remera" className="py-16">
          <JerseySection />
        </section>
        <BikeDivider />
        <section id="fotos" className="py-16 bg-gray-50">
          <PhotosSection />
        </section>
        <BikeDivider />
        <section id="sponsors" className="py-16">
          <SponsorsSection />
        </section>
        <BikeDivider />
        <section id="contacto" className="py-16 bg-gray-50">
          <ContactSection />
        </section>
      </main>
      <Footer />
    </div>
  )
}
