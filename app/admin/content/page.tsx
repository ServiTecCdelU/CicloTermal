"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Images, Shirt, Gift, Camera, Award, Phone, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import CarouselEditor from "@/components/admin/carousel-editor"
import JerseyEditor from "@/components/admin/jersey-editor"
import BenefitsEditor from "@/components/admin/benefits-editor"
import SponsorsEditor from "@/components/admin/sponsors-editor"
import PhotosEditor from "@/components/admin/photos-editor"
import ContactEditor from "@/components/admin/contact-editor"
import FormEditor from "@/components/admin/form-editor"
import HistoryEditor from "@/components/admin/history-editor"

const tabs = [
  {
    value: "historia",
    label: "Historia",
    icon: FileText,
    description: "Administra las secciones de historia del evento",
  },
  {
    value: "benefits",
    label: "Beneficios",
    icon: Gift,
    description: "Edita la lista de beneficios incluidos en la inscripción",
  },
  {
    value: "jersey",
    label: "Remera",
    icon: Shirt,
    description: "Edita la información e imagen de la remera oficial",
  },
  {
    value: "sponsors",
    label: "Sponsors",
    icon: Award,
    description: "Administra los logos, nombres y enlaces de los sponsors",
  },
  {
    value: "photos",
    label: "Fotos",
    icon: Camera,
    description: "Administra las fotos del evento",
  },
  {
    value: "contact",
    label: "Contacto",
    icon: Phone,
    description: "Edita la información de contacto y el mapa",
  },
]

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState("sponsors")
  const [showMobileTabs, setShowMobileTabs] = useState(false)

  const currentTabIndex = tabs.findIndex((tab) => tab.value === activeTab)
  const currentTab = tabs[currentTabIndex]

  const navigateTab = (direction: "prev" | "next") => {
    const newIndex =
      direction === "prev" ? Math.max(0, currentTabIndex - 1) : Math.min(tabs.length - 1, currentTabIndex + 1)
    setActiveTab(tabs[newIndex].value)
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestión de Contenido</h1>
        <p className="text-muted-foreground mt-2">Edita el contenido del sitio web</p>
      </div>

      <div className="space-y-6">
        {/* Mobile Navigation */}
        <div className="block lg:hidden">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <currentTab.icon className="h-5 w-5" />
                  <CardTitle className="text-lg">{currentTab.label}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateTab("prev")}
                    disabled={currentTabIndex === 0}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {currentTabIndex + 1} / {tabs.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateTab("next")}
                    disabled={currentTabIndex === tabs.length - 1}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>{currentTab.description}</CardDescription>
            </CardHeader>
          </Card>

          {/* Mobile Tab Selector */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {tabs.map((tab) => (
                  <Button
                    key={tab.value}
                    variant={activeTab === tab.value ? "default" : "outline"}
                    onClick={() => setActiveTab(tab.value)}
                    className="flex items-center gap-2 h-auto p-3"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="text-sm">{tab.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Tabs */}
        <Tabs defaultValue="sponsors" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="hidden lg:block">
            <TabsList className="grid grid-cols-6 h-auto p-1">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex flex-col items-center gap-1 p-3 h-auto">
                  <tab.icon className="h-4 w-4" />
                  <span className="text-xs">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="sponsors">
            <Card>
              <CardHeader className="hidden lg:block">
                <CardTitle>Sponsors</CardTitle>
                <CardDescription>Administra los logos, nombres y enlaces de los sponsors</CardDescription>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <SponsorsEditor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carousel">
            <Card>
              <CardHeader className="hidden lg:block">
                <CardTitle>Carrusel de Inicio</CardTitle>
                <CardDescription>Edita las imágenes y el botón del carrusel en la página de inicio</CardDescription>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <CarouselEditor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jersey">
            <Card>
              <CardHeader className="hidden lg:block">
                <CardTitle>Remera Oficial</CardTitle>
                <CardDescription>Edita la información e imagen de la remera oficial</CardDescription>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <JerseyEditor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historia">
            <Card>
              <CardHeader className="hidden lg:block">
                <CardTitle>Historia del Evento</CardTitle>
                <CardDescription>Administra las secciones de historia del evento</CardDescription>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <HistoryEditor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benefits">
            <Card>
              <CardHeader className="hidden lg:block">
                <CardTitle>Beneficios de la Inscripción</CardTitle>
                <CardDescription>Edita la lista de beneficios incluidos en la inscripción</CardDescription>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <BenefitsEditor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos">
            <Card>
              <CardHeader className="hidden lg:block">
                <CardTitle>Galería de Fotos</CardTitle>
                <CardDescription>Administra las fotos del evento</CardDescription>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <PhotosEditor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader className="hidden lg:block">
                <CardTitle>Información de Contacto</CardTitle>
                <CardDescription>Edita la información de contacto y el mapa</CardDescription>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <ContactEditor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="form">
            <Card>
              <CardHeader className="hidden lg:block">
                <CardTitle>Formulario de Inscripción</CardTitle>
                <CardDescription>Personaliza los campos del formulario de inscripción</CardDescription>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <FormEditor />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}



  {/*{
    value: "carousel",
    label: "Carrusel",
    icon: Images,
    description: "Edita las imágenes y el botón del carrusel en la página de inicio",
  },
  {
    value: "form",
    label: "Formulario",
    icon: FileText,
    description: "Personaliza los campos del formulario de inscripción",
  },
  */}