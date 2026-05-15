import type { ReactNode } from "react"

// Título de sección con fuente marker, corazones rojos y línea decorativa
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-3">
        <HeartIcon />
        <h2
          className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight"
          style={{ fontFamily: "var(--font-marker)" }}
        >
          {children}
        </h2>
        <HeartIcon />
      </div>
      <div className="w-24 h-1 bg-red-600 mt-3 mb-2" />
    </div>
  )
}

// SVG corazón rojo (estilo sólido, no romántico — idéntico al del logo)
export function HeartIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#dc2626"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}

// SVG ciclista silueta (estilo del logo)
export function BikeIcon({ size = 48, className = "", color = "#111" }: { size?: number; className?: string; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <circle cx="20" cy="44" r="13" stroke={color} strokeWidth="4" fill="none" />
      <circle cx="80" cy="44" r="13" stroke={color} strokeWidth="4" fill="none" />
      <line x1="20" y1="44" x2="50" y2="20" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <line x1="50" y1="20" x2="80" y2="44" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <line x1="50" y1="44" x2="50" y2="20" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="20" y1="44" x2="50" y2="44" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <line x1="80" y1="44" x2="72" y2="22" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="68" y1="22" x2="76" y2="22" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="20" x2="44" y2="20" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <circle cx="56" cy="12" r="5" fill={color} />
      <path d="M56 17 Q62 22 70 22" stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M56 17 Q52 30 50 44" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}
