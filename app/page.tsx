import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import CarouselSection from "@/components/carousel-section"
import JerseySection from "@/components/jersey-section"
import HistorySection from "@/components/history-section"
import BenefitsSection from "@/components/benefits-section"
import PhotosSection from "@/components/photos-section"
import SponsorsSection from "@/components/sponsors-section"
import ContactSection from "@/components/contact-section"
import CyclingMap from "@/components/cycling-map"

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
