"use client"

import Link from "next/link"
import { useFirebaseContext } from "@/lib/firebase/firebase-provider"
import { BikeIcon, HeartIcon } from "@/components/section-title"

function formatFecha(fechaEvento?: string) {
  if (!fechaEvento) return "Federación, Entre Ríos"
  const [y, m, d] = fechaEvento.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
}

export default function Footer() {
  const { eventSettings } = useFirebaseContext()

  return (
    <footer className="bg-gray-50 py-10 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-center md:center-text-left">
          {/* Información del evento */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center justify-center gap-2" style={{ fontFamily: "var(--font-marker)" }}>
              <HeartIcon size={14} />
              Cicloturismo Termal
              <HeartIcon size={14} />
            </h3>
            <p className="text-sm text-gray-600 mb-2">Federación, Entre Ríos, Argentina</p>
            <p className="text-sm text-gray-600">{formatFecha(eventSettings?.fechaEvento)}</p>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center justify-center gap-2" style={{ fontFamily: "var(--font-marker)" }}>
              <HeartIcon size={14} />
              Enlaces rápidos
              <HeartIcon size={14} />
            </h3>
            <ul className="space-y-2 ">
              {[
                { href: "/#inicio", label: "Inicio" },
                { href: "/#historia", label: "Historia" },
                { href: "/#Evento", label: "Evento" },
                { href: "/#fotos", label: "Fotos" },
                { href: "/#sponsors", label: "Sponsors" },
                { href: "/#contacto", label: "Contacto" },
                { href: "/admin", label: "Admin" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-600 hover:text-gray-900">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          
        </div>

        {/* Bici decorativa */}
        <div className="flex items-center justify-center gap-3 mt-8 mb-4">
          <BikeIcon size={36} className="opacity-40" />
          <HeartIcon size={14} />
          <BikeIcon size={36} className="opacity-40 scale-x-[-1]" />
        </div>

        {/* Derechos y créditos */}
        <div className="pt-6 border-t border-gray-200 text-center space-y-4">
          <a
            href="https://linktr.ee/serviteccdelu"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-col items-center gap-2 group"
          >
            <span className="text-sm font-black text-gray-600 group-hover:text-gray-900 transition-colors">
              Página web desarrollada por
            </span>
            <img
              src="/ServiTec.png"
              alt="ServiTec"
              className="h-28 object-contain group-hover:scale-105 transition-transform"
            />
          </a>
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} Cicloturismo Termal de Federación. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}



//{/* Redes sociales */}
{/*<div>
<h3 className="text-lg font-bold mb-4 text-gray-900">
  Síguenos
</h3>
<div className="flex justify-center md:justify-start items-center space-x-6">
  <Link href="#" className="text-gray-600 hover:text-pink-500" aria-label="Facebook">
    <Facebook className="h-6 w-6" />
  </Link>
  <Link href="#" className="text-gray-600 hover:text-violet-500" aria-label="Instagram">
    <Instagram className="h-6 w-6" />
  </Link>
  <Link href="#" className="text-gray-600 hover:text-blue-500" aria-label="Twitter">
    <Twitter className="h-6 w-6" />
  </Link>
</div>
/</div>*/}