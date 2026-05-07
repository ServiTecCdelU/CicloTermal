"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/firebase/firebase-config"
import { signOut } from "firebase/auth"
import { useToast } from "@/components/ui/use-toast"
import { LayoutDashboard, Users, FileEdit, Settings, LogOut, Menu, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Inscripciones",
    href: "/admin/registrations",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Contenido",
    href: "/admin/content",
    icon: <FileEdit className="h-5 w-5" />,
  },
  {
    title: "Configuración",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
  },
]

export default function AdminNavbar() {
  const pathname = usePathname()
  const { toast } = useToast()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      })
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        scrolled ? "bg-white shadow-md py-2" : "bg-white/90 backdrop-blur-sm py-3"
      )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <h2 className="font-bold text-xl bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
                Cicloturismo
              </h2>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md transition-colors text-sm font-medium",
                    pathname === item.href
                      ? "bg-gradient-to-r from-pink-100 to-blue-100 text-pink-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <span className="flex items-center">
                    {item.icon}
                    <span className="ml-2">{item.title}</span>
                  </span>
                </Link>
              ))}
              
              <Button
                variant="ghost"
                className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5 mr-2" />
                <span>Cerrar sesión</span>
              </Button>
            </nav>

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300 border-t",
          isMobileMenuOpen ? "max-h-64" : "max-h-0"
        )}>
          <div className="container mx-auto px-4 py-2 flex flex-col space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-gradient-to-r from-pink-100 to-blue-100 text-pink-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {item.icon}
                <span className="ml-2">{item.title}</span>
              </Link>
            ))}
            
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span>Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </header>
      
      {/* Content padding for fixed header */}
      <div className="pt-16">
        {/* Main content would go here */}
      </div>
    </>
  )
}