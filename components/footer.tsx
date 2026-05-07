import Link from "next/link"
//import { Facebook, Instagram, Twitter } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-pink-100 via-violet-100 to-blue-100 py-10 border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-center md:center-text-left">
          {/* Información del evento */}
          <div>
            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
              Cicloturismo Termal
            </h3>
            <p className="text-sm text-gray-600 mb-2">Federación, Entre Ríos, Argentina</p>
            <p className="text-sm text-gray-600">12 de octubre de 2025</p>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
              Enlaces rápidos
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

        {/* Derechos y créditos */}
        <div className="mt-10 pt-6 border-t border-gray-200 text-center space-y-2">
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} Cicloturismo Termal de Federación. Todos los derechos reservados.
          </p>
          <p className="text-sm text-gray-600">
            Desarrollado por{" "}
            <a
              href="https://linktr.ee/serviteccdelu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-600 hover:underline"
            >
              servitec
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}



//{/* Redes sociales */}
{/*<div>
<h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
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