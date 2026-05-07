"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  FileSpreadsheet,
  Download,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  BarChart3,
  Award,
  Shield,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface Registration {
  id: string
  nombre?: string
  apellido?: string
  dni?: string
  email?: string
  telefono?: string
  localidad?: string
  numeroInscripcion?: number
  fechaNacimiento?: string
  genero?: string
  telefonoEmergencia?: string
  talleRemera?: string
  grupoSanguineo?: string
  grupoCiclistas?: string
  condicionSalud?: string
  transferidoA?: string
  precio?: string
  estado?: string
  fechaInscripcion?: Date
  [key: string]: any
}

interface Expense {
  id: string
  concepto: string
  monto: number
  categoria: string
  fecha: Date
  descripcion?: string
  pagadoPor?: string
}

interface ExcelExportProps {
  registrations: Registration[]
  expenses?: Expense[]
}

const parseHealthConditions = (condicionSalud: string) => {
  if (!condicionSalud) {
    return { esCeliaco: "no", condicionesSalud: "" }
  }

  try {
    const parsed = JSON.parse(condicionSalud)
    return {
      esCeliaco: parsed.esCeliaco || "no",
      condicionesSalud: parsed.condicionesSalud || "",
    }
  } catch {
    return { esCeliaco: "no", condicionesSalud: condicionSalud }
  }
}

const calculateAdvancedStats = (registrations: Registration[], expenses: Expense[]) => {
  const validRegistrations = registrations.filter((reg) => reg.estado !== "rechazado")
  const confirmedRegistrations = registrations.filter((reg) => reg.estado === "confirmado")
  const pendingRegistrations = registrations.filter((reg) => reg.estado === "pendiente" || !reg.estado)

  // Análisis demográfico avanzado
  const maleCount = validRegistrations.filter((reg) => reg.genero?.toLowerCase() === "masculino").length
  const femaleCount = validRegistrations.filter((reg) => reg.genero?.toLowerCase() === "femenino").length
  const otherCount = validRegistrations.filter(
    (reg) => reg.genero && reg.genero?.toLowerCase() !== "masculino" && reg.genero?.toLowerCase() !== "femenino",
  ).length

  // Análisis de salud crítico
  let withHealthConditions = 0
  let celiacCount = 0
  const healthAlerts: string[] = []

  validRegistrations.forEach((reg) => {
    try {
      const healthInfo = parseHealthConditions(reg.condicionSalud)
      if (healthInfo.esCeliaco === "si") {
        celiacCount++
        healthAlerts.push(`${reg.nombre} ${reg.apellido} - Celíaco`)
      }
      if (healthInfo.condicionesSalud && healthInfo.condicionesSalud.trim() !== "") {
        withHealthConditions++
        healthAlerts.push(`${reg.nombre} ${reg.apellido} - ${healthInfo.condicionesSalud}`)
      }
    } catch (error) {
      console.error("Error al procesar condicionSalud:", error)
    }
  })

  // Análisis de inventario inteligente de remeras
  const jerseySize: Record<string, number> = { xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0 }
  validRegistrations.forEach((reg) => {
    if (reg.talleRemera) {
      const size = reg.talleRemera.toLowerCase()
      if (jerseySize.hasOwnProperty(size)) {
        jerseySize[size]++
      }
    }
  })

  // Stock recomendado con buffer del 10%
  const recommendedStock = Object.entries(jerseySize).map(([size, count]) => ({
    size: size.toUpperCase(),
    current: count,
    recommended: Math.ceil(count * 1.1),
    buffer: Math.ceil(count * 0.1),
  }))

  // Análisis de grupos ciclistas con ranking
  const groupsMap = new Map<string, string[]>()
  validRegistrations.forEach((reg) => {
    const grupo = reg.grupoCiclistas || reg.grupoBici || reg.grupo_bici || reg.grupobici || reg.grupo
    if (grupo && grupo.trim() !== "") {
      const groupName = grupo.trim()
      const participantName = `${reg.nombre || ""} ${reg.apellido || ""}`.trim()

      if (!groupsMap.has(groupName)) {
        groupsMap.set(groupName, [])
      }
      if (participantName) {
        groupsMap.get(groupName)?.push(participantName)
      }
    }
  })

  const groupsRanking = Array.from(groupsMap.entries())
    .map(([nombre, participantes]) => ({
      nombre,
      cantidad: participantes.length,
      participantes: participantes.sort(),
      impacto: participantes.length > 5 ? "Alto" : participantes.length > 2 ? "Medio" : "Bajo",
    }))
    .sort((a, b) => b.cantidad - a.cantidad)

  // Análisis financiero avanzado
  const totalExpenses = expenses.reduce((total, expense) => total + expense.monto, 0)
  const totalIncome = confirmedRegistrations.reduce((total, reg) => {
    const precio = Number.parseFloat(reg.precio?.replace(/[^\d.-]/g, "") || "0")
    return total + precio
  }, 0)

  const netBalance = totalIncome - totalExpenses
  const profitMargin = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0

  // Análisis de gastos por categoría con impacto
  const expensesByCategory = expenses.reduce(
    (acc, expense) => {
      if (!acc[expense.categoria]) {
        acc[expense.categoria] = { total: 0, count: 0, items: [] }
      }
      acc[expense.categoria].total += expense.monto
      acc[expense.categoria].count += 1
      acc[expense.categoria].items.push(expense)
      return acc
    },
    {} as Record<string, { total: number; count: number; items: Expense[] }>,
  )

  const expensesAnalysis = Object.entries(expensesByCategory)
    .map(([categoria, data]) => ({
      categoria,
      total: data.total,
      count: data.count,
      percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
      average: data.total / data.count,
      impacto: data.total > totalExpenses * 0.2 ? "Alto" : data.total > totalExpenses * 0.1 ? "Medio" : "Bajo",
      items: data.items.sort((a, b) => b.monto - a.monto),
    }))
    .sort((a, b) => b.total - a.total)

  // Análisis de localidades
  const localityAnalysis = validRegistrations.reduce(
    (acc, reg) => {
      const locality = reg.localidad || "Sin especificar"
      acc[locality] = (acc[locality] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const topLocalities = Object.entries(localityAnalysis)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)

  return {
    // Métricas básicas
    totalRegistrations: registrations.length,
    validRegistrations: validRegistrations.length,
    confirmedRegistrations: confirmedRegistrations.length,
    pendingRegistrations: pendingRegistrations.length,
    conversionRate: registrations.length > 0 ? (confirmedRegistrations.length / registrations.length) * 100 : 0,

    // Análisis demográfico
    maleCount,
    femaleCount,
    otherCount,
    genderDistribution: {
      male: validRegistrations.length > 0 ? (maleCount / validRegistrations.length) * 100 : 0,
      female: validRegistrations.length > 0 ? (femaleCount / validRegistrations.length) * 100 : 0,
      other: validRegistrations.length > 0 ? (otherCount / validRegistrations.length) * 100 : 0,
    },

    // Análisis de salud crítico
    withHealthConditions,
    celiacCount,
    healthAlerts,
    healthRisk: celiacCount > 0 || withHealthConditions > 0 ? "Alto" : "Bajo",

    // Inventario inteligente
    jerseySize,
    recommendedStock,
    totalJerseys: Object.values(jerseySize).reduce((a, b) => a + b, 0),

    // Grupos y comunidad
    groupsCount: groupsMap.size,
    groupsRanking,
    averageGroupSize:
      groupsRanking.length > 0 ? groupsRanking.reduce((sum, g) => sum + g.cantidad, 0) / groupsRanking.length : 0,

    // Análisis financiero
    totalIncome,
    totalExpenses,
    netBalance,
    profitMargin,
    expensesAnalysis,

    // Análisis geográfico
    topLocalities,
    totalLocalities: Object.keys(localityAnalysis).length,
  }
}

export function AdminRegistrationsExcel({ registrations, expenses = [] }: ExcelExportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [includeConfirmed, setIncludeConfirmed] = useState(true)
  const [includePending, setIncludePending] = useState(false)
  const [includeDashboard, setIncludeDashboard] = useState(true)
  const [includeExpenses, setIncludeExpenses] = useState(true)
  const [premiumMode, setPremiumMode] = useState(true)

  const stats = calculateAdvancedStats(registrations, expenses)
  const confirmedRegistrations = registrations.filter((reg) => reg.estado === "confirmado")
  const pendingRegistrations = registrations.filter((reg) => reg.estado === "pendiente" || !reg.estado)

  const exportToExcel = () => {
    let htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Reporte Ejecutivo - ${new Date().toLocaleDateString("es-ES")}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
            
            * { box-sizing: border-box; }
            
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
              margin: 0; 
              padding: 0; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #1a202c;
              line-height: 1.6;
            }
            
            .sheet { 
              page-break-after: always; 
              margin: 0; 
              padding: 40px;
              background: white;
              min-height: 100vh;
              position: relative;
            }
            
            .sheet:last-child { page-break-after: auto; }
            
            /* Headers ejecutivos con gradientes */
            .executive-header {
              background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%);
              color: white;
              padding: 60px 40px;
              text-align: center;
              margin: -40px -40px 50px -40px;
              position: relative;
              overflow: hidden;
            }
            
            .executive-header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
              opacity: 0.3;
            }
            
            .executive-header h1 {
              margin: 0 0 15px 0;
              font-size: 42px;
              font-weight: 800;
              letter-spacing: -1px;
              position: relative;
              z-index: 1;
            }
            
            .executive-header .subtitle {
              font-size: 18px;
              opacity: 0.9;
              font-weight: 400;
              position: relative;
              z-index: 1;
            }
            
            .executive-header .timestamp {
              position: absolute;
              top: 20px;
              right: 40px;
              font-size: 14px;
              opacity: 0.8;
              z-index: 1;
            }
            
            /* KPI Cards Premium */
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
              gap: 25px;
              margin-bottom: 40px;
            }
            
            .kpi-card {
              background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 30px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.08);
              position: relative;
              overflow: hidden;
              transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            
            .kpi-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 20px 40px rgba(0,0,0,0.12);
            }
            
            .kpi-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899);
            }
            
            .kpi-icon {
              width: 48px;
              height: 48px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 20px;
              font-size: 24px;
            }
            
            .kpi-value {
              font-size: 36px;
              font-weight: 800;
              margin-bottom: 8px;
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            
            .kpi-label {
              font-size: 14px;
              color: #64748b;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .kpi-change {
              font-size: 12px;
              padding: 4px 8px;
              border-radius: 6px;
              font-weight: 600;
              margin-top: 8px;
              display: inline-block;
            }
            
            .kpi-positive { background: #dcfce7; color: #166534; }
            .kpi-negative { background: #fee2e2; color: #dc2626; }
            .kpi-neutral { background: #f1f5f9; color: #475569; }
            
            /* Tablas Premium */
            .premium-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0,0,0,0.08);
              margin-bottom: 30px;
            }
            
            .premium-table th {
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              color: white;
              padding: 20px 16px;
              font-weight: 600;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border: none;
              position: relative;
            }
            
            .premium-table th:first-child { border-radius: 12px 0 0 0; }
            .premium-table th:last-child { border-radius: 0 12px 0 0; }
            
            .premium-table td {
              padding: 16px;
              border-bottom: 1px solid #f1f5f9;
              font-size: 13px;
              vertical-align: middle;
            }
            
            .premium-table tr:hover {
              background: #f8fafc;
            }
            
            .premium-table tr:last-child td {
              border-bottom: none;
            }
            
            /* Status Badges Premium */
            .status-badge {
              padding: 6px 12px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              display: inline-flex;
              align-items: center;
              gap: 4px;
            }
            
            .status-confirmed {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
            }
            
            .status-pending {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white;
              box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
            }
            
            .status-rejected {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
            }
            
            /* Alertas médicas */
            .health-alert {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border-left: 4px solid #f59e0b;
              font-weight: 600;
            }
            
            .celiac-alert {
              background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
              border-left: 4px solid #ef4444;
              font-weight: 600;
            }
            
            /* Progress Bars */
            .progress-container {
              background: #f1f5f9;
              border-radius: 8px;
              height: 8px;
              overflow: hidden;
              margin: 8px 0;
            }
            
            .progress-bar {
              height: 100%;
              border-radius: 8px;
              transition: width 0.3s ease;
            }
            
            .progress-primary { background: linear-gradient(90deg, #4f46e5, #7c3aed); }
            .progress-success { background: linear-gradient(90deg, #10b981, #059669); }
            .progress-warning { background: linear-gradient(90deg, #f59e0b, #d97706); }
            .progress-danger { background: linear-gradient(90deg, #ef4444, #dc2626); }
            
            /* Secciones con estilo */
            .section {
              background: white;
              border-radius: 16px;
              padding: 30px;
              margin-bottom: 30px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.08);
              border: 1px solid #e2e8f0;
            }
            
            .section-header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 2px solid #f1f5f9;
            }
            
            .section-icon {
              width: 40px;
              height: 40px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              color: white;
            }
            
            .section-title {
              font-size: 24px;
              font-weight: 700;
              color: #1e293b;
              margin: 0;
            }
            
            /* Categorías de gastos con colores */
            .expense-logistica { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); }
            .expense-alimentacion { background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); }
            .expense-premios { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); }
            .expense-marketing { background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); }
            .expense-equipamiento { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); }
            .expense-servicios { background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); }
            .expense-transporte { background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%); }
            .expense-otros { background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); }
            
            /* Footer corporativo */
            .corporate-footer {
              margin-top: 60px;
              padding: 40px;
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              color: white;
              text-align: center;
              border-radius: 16px;
              position: relative;
            }
            
            .corporate-footer::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 2px;
              background: linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899);
            }
            
            .confidential-notice {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border: 2px solid #f59e0b;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
              color: #92400e;
              font-weight: 600;
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
              .kpi-grid { grid-template-columns: 1fr; }
              .executive-header { padding: 40px 20px; }
              .executive-header h1 { font-size: 28px; }
              .sheet { padding: 20px; }
            }
            
            /* Print optimizations */
            @media print {
              .sheet { 
                margin: 0; 
                padding: 20px; 
                box-shadow: none; 
                page-break-inside: avoid;
              }
              .kpi-card:hover { transform: none; }
            }
          </style>
        </head>
        <body>
    `

    // HOJA 1: DASHBOARD EJECUTIVO PREMIUM
    if (includeDashboard) {
      htmlContent += `
        <div class="sheet">
          <div class="executive-header">
            <div class="timestamp">Generado: ${new Date().toLocaleString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</div>
            <h1>📊 DASHBOARD EJECUTIVO</h1>
            <div class="subtitle">Reporte Integral de Gestión y Análisis de Rendimiento</div>
          </div>

          <!-- KPIs Principales -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-icon" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">👥</div>
              <div class="kpi-value">${stats.totalRegistrations}</div>
              <div class="kpi-label">Total Inscripciones</div>
              <div class="kpi-change kpi-positive">+${stats.validRegistrations} válidas</div>
            </div>
            
            <div class="kpi-card">
              <div class="kpi-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">✅</div>
              <div class="kpi-value">${stats.confirmedRegistrations}</div>
              <div class="kpi-label">Confirmados</div>
              <div class="kpi-change kpi-positive">${stats.conversionRate.toFixed(1)}% conversión</div>
            </div>
            
            <div class="kpi-card">
              <div class="kpi-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">⏳</div>
              <div class="kpi-value">${stats.pendingRegistrations}</div>
              <div class="kpi-label">Pendientes</div>
              <div class="kpi-change kpi-warning">Requiere seguimiento</div>
            </div>
            
            <div class="kpi-card">
              <div class="kpi-icon" style="background: linear-gradient(135deg, #059669 0%, #047857 100%);">💰</div>
              <div class="kpi-value">$${stats.totalIncome.toLocaleString("es-ES")}</div>
              <div class="kpi-label">Ingresos Totales</div>
              <div class="kpi-change ${stats.netBalance >= 0 ? "kpi-positive" : "kpi-negative"}">
                Balance: $${stats.netBalance.toLocaleString("es-ES")}
              </div>
            </div>
            
            <div class="kpi-card">
              <div class="kpi-icon" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">📊</div>
              <div class="kpi-value">$${stats.totalExpenses.toLocaleString("es-ES")}</div>
              <div class="kpi-label">Gastos Totales</div>
              <div class="kpi-change kpi-neutral">${stats.expensesAnalysis.length} categorías</div>
            </div>
            
            <div class="kpi-card">
              <div class="kpi-icon" style="background: linear-gradient(135deg, #7c3aed 0%, #6b21a8 100%);">📈</div>
              <div class="kpi-value">${stats.profitMargin.toFixed(1)}%</div>
              <div class="kpi-label">Margen de Ganancia</div>
              <div class="kpi-change ${stats.profitMargin >= 20 ? "kpi-positive" : stats.profitMargin >= 10 ? "kpi-warning" : "kpi-negative"}">
                ${stats.profitMargin >= 20 ? "Excelente" : stats.profitMargin >= 10 ? "Bueno" : "Mejorable"}
              </div>
            </div>
          </div>

          <!-- Análisis Demográfico -->
          <div class="section">
            <div class="section-header">
              <div class="section-icon">👥</div>
              <h2 class="section-title">Análisis Demográfico Avanzado</h2>
            </div>
            
            <table class="premium-table">
              <thead>
                <tr>
                  <th>Segmento</th>
                  <th>Cantidad</th>
                  <th>Porcentaje</th>
                  <th>Progreso</th>
                  <th>Impacto</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>👨 Masculino</strong></td>
                  <td>${stats.maleCount}</td>
                  <td>${stats.genderDistribution.male.toFixed(1)}%</td>
                  <td>
                    <div class="progress-container">
                      <div class="progress-bar progress-primary" style="width: ${stats.genderDistribution.male}%"></div>
                    </div>
                  </td>
                  <td><span class="status-badge ${stats.maleCount > stats.femaleCount ? "status-confirmed" : "status-pending"}">
                    ${stats.maleCount > stats.femaleCount ? "Mayoría" : "Minoría"}
                  </span></td>
                </tr>
                <tr>
                  <td><strong>👩 Femenino</strong></td>
                  <td>${stats.femaleCount}</td>
                  <td>${stats.genderDistribution.female.toFixed(1)}%</td>
                  <td>
                    <div class="progress-container">
                      <div class="progress-bar progress-success" style="width: ${stats.genderDistribution.female}%"></div>
                    </div>
                  </td>
                  <td><span class="status-badge ${stats.femaleCount > stats.maleCount ? "status-confirmed" : "status-pending"}">
                    ${stats.femaleCount > stats.maleCount ? "Mayoría" : "Minoría"}
                  </span></td>
                </tr>
                <tr>
                  <td><strong>🏳️‍🌈 Otros</strong></td>
                  <td>${stats.otherCount}</td>
                  <td>${stats.genderDistribution.other.toFixed(1)}%</td>
                  <td>
                    <div class="progress-container">
                      <div class="progress-bar progress-warning" style="width: ${stats.genderDistribution.other}%"></div>
                    </div>
                  </td>
                  <td><span class="status-badge status-pending">Inclusivo</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Alertas Médicas Críticas -->
          ${
            stats.healthAlerts.length > 0
              ? `
          <div class="section">
            <div class="section-header">
              <div class="section-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">🚨</div>
              <h2 class="section-title">Alertas Médicas Críticas</h2>
            </div>
            
            <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
              <div class="kpi-card">
                <div class="kpi-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">🌾</div>
                <div class="kpi-value">${stats.celiacCount}</div>
                <div class="kpi-label">Participantes Celíacos</div>
                <div class="kpi-change kpi-warning">Requiere menú especial</div>
              </div>
              
              <div class="kpi-card">
                <div class="kpi-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">🏥</div>
                <div class="kpi-value">${stats.withHealthConditions}</div>
                <div class="kpi-label">Con Condiciones Médicas</div>
                <div class="kpi-change kpi-negative">Atención especial</div>
              </div>
              
              <div class="kpi-card">
                <div class="kpi-icon" style="background: linear-gradient(135deg, #7c3aed 0%, #6b21a8 100%);">⚡</div>
                <div class="kpi-value">${stats.healthRisk}</div>
                <div class="kpi-label">Nivel de Riesgo</div>
                <div class="kpi-change ${stats.healthRisk === "Alto" ? "kpi-negative" : "kpi-positive"}">
                  ${stats.healthRisk === "Alto" ? "Protocolo especial" : "Estándar"}
                </div>
              </div>
            </div>
            
            <table class="premium-table">
              <thead>
                <tr><th>Participante</th><th>Condición Médica</th><th>Prioridad</th></tr>
              </thead>
              <tbody>
                ${stats.healthAlerts
                  .slice(0, 10)
                  .map((alert) => {
                    const isCeliac = alert.includes("Celíaco")
                    return `
                    <tr class="${isCeliac ? "celiac-alert" : "health-alert"}">
                      <td><strong>${alert.split(" - ")[0]}</strong></td>
                      <td>${alert.split(" - ")[1]}</td>
                      <td><span class="status-badge ${isCeliac ? "status-rejected" : "status-pending"}">
                        ${isCeliac ? "CRÍTICA" : "ALTA"}
                      </span></td>
                    </tr>
                  `
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          <!-- Inventario Inteligente de Remeras -->
          <div class="section">
            <div class="section-header">
              <div class="section-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">👕</div>
              <h2 class="section-title">Inventario Inteligente de Remeras</h2>
            </div>
            
            <table class="premium-table">
              <thead>
                <tr>
                  <th>Talle</th>
                  <th>Demanda Actual</th>
                  <th>Stock Recomendado</th>
                  <th>Buffer Seguridad</th>
                  <th>Porcentaje</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${stats.recommendedStock
                  .map((item) => {
                    const percentage = stats.totalJerseys > 0 ? (item.current / stats.totalJerseys) * 100 : 0
                    return `
                    <tr>
                      <td><strong style="text-transform: uppercase; font-size: 14px;">${item.size}</strong></td>
                      <td>${item.current}</td>
                      <td><strong style="color: #059669;">${item.recommended}</strong></td>
                      <td>+${item.buffer}</td>
                      <td>
                        <div class="progress-container">
                          <div class="progress-bar progress-success" style="width: ${percentage}%"></div>
                        </div>
                        ${percentage.toFixed(1)}%
                      </td>
                      <td><span class="status-badge ${percentage > 20 ? "status-confirmed" : percentage > 10 ? "status-pending" : "status-rejected"}">
                        ${percentage > 20 ? "ALTA" : percentage > 10 ? "MEDIA" : "BAJA"}
                      </span></td>
                    </tr>
                  `
                  })
                  .join("")}
              </tbody>
            </table>
          </div>

          <!-- Ranking de Grupos Ciclistas -->
          ${
            stats.groupsRanking.length > 0
              ? `
          <div class="section">
            <div class="section-header">
              <div class="section-icon" style="background: linear-gradient(135deg, #7c3aed 0%, #6b21a8 100%);">🚴‍♂️</div>
              <h2 class="section-title">Ranking de Grupos Ciclistas</h2>
            </div>
            
            <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr);">
              <div class="kpi-card">
                <div class="kpi-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">🏆</div>
                <div class="kpi-value">${stats.groupsCount}</div>
                <div class="kpi-label">Grupos Totales</div>
              </div>
              
              <div class="kpi-card">
                <div class="kpi-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">📊</div>
                <div class="kpi-value">${stats.averageGroupSize.toFixed(1)}</div>
                <div class="kpi-label">Promedio por Grupo</div>
              </div>
              
              <div class="kpi-card">
                <div class="kpi-icon" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">👑</div>
                <div class="kpi-value">${stats.groupsRanking[0]?.cantidad || 0}</div>
                <div class="kpi-label">Grupo Más Grande</div>
              </div>
            </div>
            
            <table class="premium-table">
              <thead>
                <tr>
                  <th>Ranking</th>
                  <th>Grupo</th>
                  <th>Participantes</th>
                  <th>Impacto</th>
                  <th>Integrantes</th>
                </tr>
              </thead>
              <tbody>
                ${stats.groupsRanking
                  .slice(0, 10)
                  .map(
                    (group, index) => `
                  <tr>
                    <td>
                      <span style="font-weight: bold; font-size: 16px; color: ${index === 0 ? "#f59e0b" : index === 1 ? "#6b7280" : index === 2 ? "#d97706" : "#64748b"};">
                        ${index + 1}${index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : ""}
                      </span>
                    </td>
                    <td><strong>${group.nombre}</strong></td>
                    <td style="text-align: center; font-weight: bold; font-size: 16px;">${group.cantidad}</td>
                    <td><span class="status-badge ${group.impacto === "Alto" ? "status-confirmed" : group.impacto === "Medio" ? "status-pending" : "status-rejected"}">
                      ${group.impacto}
                    </span></td>
                    <td style="font-size: 11px;">${group.participantes.slice(0, 3).join(", ")}${group.participantes.length > 3 ? ` +${group.participantes.length - 3} más` : ""}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          <!-- Análisis Geográfico -->
          ${
            stats.topLocalities.length > 0
              ? `
          <div class="section">
            <div class="section-header">
              <div class="section-icon" style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);">🗺️</div>
              <h2 class="section-title">Distribución Geográfica</h2>
            </div>
            
            <table class="premium-table">
              <thead>
                <tr><th>Localidad</th><th>Participantes</th><th>Porcentaje</th><th>Progreso</th></tr>
              </thead>
              <tbody>
                ${stats.topLocalities
                  .map(([locality, count]) => {
                    const percentage = (count / stats.validRegistrations) * 100
                    return `
                    <tr>
                      <td><strong>${locality}</strong></td>
                      <td>${count}</td>
                      <td>${percentage.toFixed(1)}%</td>
                      <td>
                        <div class="progress-container">
                          <div class="progress-bar progress-primary" style="width: ${percentage}%"></div>
                        </div>
                      </td>
                    </tr>
                  `
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }
        </div>
      `
    }

    // HOJA 2: REGISTRO COMPLETO DE PARTICIPANTES
    const selectedRegistrations = []
    if (includeConfirmed) selectedRegistrations.push(...confirmedRegistrations)
    if (includePending) selectedRegistrations.push(...pendingRegistrations)

    if (selectedRegistrations.length > 0) {
      htmlContent += `
        <div class="sheet">
          <div class="executive-header">
            <div class="timestamp">Página 2 de 3</div>
            <h1>👥 REGISTRO COMPLETO DE PARTICIPANTES</h1>
            <div class="subtitle">Base de Datos Integral con Análisis de Estado y Condiciones Médicas</div>
          </div>

          <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 40px;">
            <div class="kpi-card">
              <div class="kpi-icon" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">📊</div>
              <div class="kpi-value">${selectedRegistrations.length}</div>
              <div class="kpi-label">Total Seleccionados</div>
            </div>
            
            ${
              includeConfirmed
                ? `
            <div class="kpi-card">
              <div class="kpi-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">✅</div>
              <div class="kpi-value">${confirmedRegistrations.length}</div>
              <div class="kpi-label">Confirmados</div>
            </div>
            `
                : ""
            }
            
            ${
              includePending
                ? `
            <div class="kpi-card">
              <div class="kpi-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">⏳</div>
              <div class="kpi-value">${pendingRegistrations.length}</div>
              <div class="kpi-label">Pendientes</div>
            </div>
            `
                : ""
            }
            
            <div class="kpi-card">
              <div class="kpi-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">🚨</div>
              <div class="kpi-value">${stats.celiacCount + stats.withHealthConditions}</div>
              <div class="kpi-label">Alertas Médicas</div>
            </div>
          </div>

          <div class="section">
            <table class="premium-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>N° Inscripción</th>
                  <th>Participante</th>
                  <th>DNI</th>
                  <th>Contacto</th>
                  <th>Emergencia</th>
                  <th>Datos Personales</th>
                  <th>Remera</th>
                  <th>Grupo</th>
                  <th>Salud</th>
                  <th>Financiero</th>
                </tr>
              </thead>
              <tbody>
                ${selectedRegistrations
                  .sort((a, b) => (a.numeroInscripcion || 0) - (b.numeroInscripcion || 0))
                  .map((reg) => {
                    const healthInfo = parseHealthConditions(reg.condicionSalud)
                    const telefonoEmergencia =
                      reg.telefonoEmergencia ||
                      reg.telefono_emergencia ||
                      reg.telEmergencia ||
                      reg.telefonoContacto ||
                      ""
                    const grupoSanguineo =
                      reg.grupoSanguineo || reg.grupo_sanguineo || reg.gruposanguineo || reg.sangre || ""
                    const grupoBici =
                      reg.grupoCiclistas || reg.grupoBici || reg.grupo_bici || reg.grupobici || reg.grupo || ""
                    const hasHealthAlert =
                      healthInfo.esCeliaco === "si" ||
                      (healthInfo.condicionesSalud && healthInfo.condicionesSalud.trim() !== "")

                    return `
                      <tr class="${hasHealthAlert ? (healthInfo.esCeliaco === "si" ? "celiac-alert" : "health-alert") : ""}">
                        <td>
                          <span class="status-badge ${reg.estado === "confirmado" ? "status-confirmed" : "status-pending"}">
                            ${reg.estado === "confirmado" ? "✅ CONFIRMADO" : "⏳ PENDIENTE"}
                          </span>
                        </td>
                        <td style="font-weight: bold; font-size: 14px;">#${reg.numeroInscripcion || "-"}</td>
                        <td>
                          <div style="font-weight: bold; font-size: 13px;">${reg.apellido || ""}, ${reg.nombre || ""}</div>
                          <div style="font-size: 11px; color: #64748b;">${reg.fechaNacimiento || ""} • ${reg.genero || ""}</div>
                        </td>
                        <td style="font-family: monospace;">${reg.dni || ""}</td>
                        <td>
                          <div style="font-size: 11px;"><strong>📧</strong> ${reg.email || ""}</div>
                          <div style="font-size: 11px;"><strong>📱</strong> ${reg.telefono || ""}</div>
                          <div style="font-size: 11px;"><strong>📍</strong> ${reg.localidad || ""}</div>
                        </td>
                        <td style="color: #dc2626; font-weight: bold;">
                          ${telefonoEmergencia ? `🚨 ${telefonoEmergencia}` : "-"}
                        </td>
                        <td>
                          <div style="font-size: 11px;"><strong>🩸</strong> ${grupoSanguineo || "N/E"}</div>
                          <div style="font-size: 11px;"><strong>📅</strong> ${reg.fechaInscripcion ? reg.fechaInscripcion.toLocaleDateString("es-ES") : ""}</div>
                        </td>
                        <td style="text-align: center;">
                          <span style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-weight: bold; text-transform: uppercase;">
                            ${reg.talleRemera || "N/E"}
                          </span>
                        </td>
                        <td style="font-weight: bold; color: #7c3aed;">${grupoBici || "-"}</td>
                        <td>
                          ${healthInfo.esCeliaco === "si" ? '<div style="background: #fef3c7; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; color: #92400e; margin-bottom: 2px;">🌾 CELÍACO</div>' : ""}
                          ${healthInfo.condicionesSalud ? `<div style="background: #fee2e2; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; color: #dc2626;">${healthInfo.condicionesSalud}</div>` : ""}
                          ${!hasHealthAlert ? '<span style="color: #059669; font-weight: bold;">✅ OK</span>' : ""}
                        </td>
                        <td>
                          <div style="font-weight: bold; color: #059669;">${reg.precio || "N/E"}</div>
                          ${reg.transferidoA ? `<div style="font-size: 10px; color: #64748b;">→ ${reg.transferidoA}</div>` : ""}
                        </td>
                      </tr>
                    `
                  })
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="confidential-notice">
            <strong>⚠️ INFORMACIÓN CONFIDENCIAL</strong><br>
            Este registro contiene datos personales y médicos sensibles. Manejo restringido según normativas de privacidad.
          </div>
        </div>
      `
    }

    // HOJA 3: GESTIÓN FINANCIERA AVANZADA
    if (includeExpenses && expenses.length > 0) {
      htmlContent += `
        <div class="sheet">
          <div class="executive-header">
            <div class="timestamp">Página 3 de 3</div>
            <h1>💰 GESTIÓN FINANCIERA AVANZADA</h1>
            <div class="subtitle">Análisis Integral de Ingresos, Gastos y Rentabilidad del Evento</div>
          </div>

          <!-- KPIs Financieros -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">💰</div>
              <div class="kpi-value">$${stats.totalIncome.toLocaleString("es-ES")}</div>
              <div class="kpi-label">Ingresos Totales</div>
              <div class="kpi-change kpi-positive">${stats.confirmedRegistrations} confirmados</div>
            </div>
            
            <div class="kpi-card">
              <div class="kpi-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">📊</div>
              <div class="kpi-value">$${stats.totalExpenses.toLocaleString("es-ES")}</div>
              <div class="kpi-label">Gastos Totales</div>
              <div class="kpi-change kpi-negative">${expenses.length} transacciones</div>
            </div>
            
            <div class="kpi-card">
              <div class="kpi-icon" style="background: linear-gradient(135deg, ${stats.netBalance >= 0 ? "#10b981, #059669" : "#ef4444, #dc2626"});">📈</div>
              <div class="kpi-value">$${stats.netBalance.toLocaleString("es-ES")}</div>
              <div class="kpi-label">Balance Neto</div>
              <div class="kpi-change ${stats.netBalance >= 0 ? "kpi-positive" : "kpi-negative"}">
                ${stats.netBalance >= 0 ? "Ganancia" : "Pérdida"}
              </div>
            </div>
            
            <div class="kpi-card">
              <div class="kpi-icon" style="background: linear-gradient(135deg, #7c3aed 0%, #6b21a8 100%);">🎯</div>
              <div class="kpi-value">${stats.profitMargin.toFixed(1)}%</div>
              <div class="kpi-label">Margen de Ganancia</div>
              <div class="kpi-change ${stats.profitMargin >= 20 ? "kpi-positive" : stats.profitMargin >= 10 ? "kpi-warning" : "kpi-negative"}">
                ${stats.profitMargin >= 20 ? "Excelente" : stats.profitMargin >= 10 ? "Bueno" : "Crítico"}
              </div>
            </div>
          </div>

          <!-- Análisis por Categorías -->
          <div class="section">
            <div class="section-header">
              <div class="section-icon" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">📊</div>
              <h2 class="section-title">Análisis por Categorías de Gasto</h2>
            </div>
            
            <table class="premium-table">
              <thead>
                <tr>
                  <th>Ranking</th>
                  <th>Categoría</th>
                  <th>Total Invertido</th>
                  <th>% del Presupuesto</th>
                  <th>Cantidad</th>
                  <th>Promedio</th>
                  <th>Impacto</th>
                  <th>Progreso</th>
                </tr>
              </thead>
              <tbody>
                ${stats.expensesAnalysis
                  .map(
                    (category, index) => `
                  <tr class="expense-${category.categoria.toLowerCase().replace(/\s+/g, "")}">
                    <td style="font-weight: bold; font-size: 16px;">
                      ${index + 1}${index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : ""}
                    </td>
                    <td>
                      <div style="font-weight: bold; font-size: 14px;">${category.categoria}</div>
                      <div style="font-size: 11px; color: #64748b;">${category.count} transacciones</div>
                    </td>
                    <td style="font-weight: bold; font-size: 16px; color: #dc2626;">
                      $${category.total.toLocaleString("es-ES")}
                    </td>
                    <td>
                      <div style="font-weight: bold; font-size: 14px;">${category.percentage.toFixed(1)}%</div>
                      <div class="progress-container">
                        <div class="progress-bar ${category.impacto === "Alto" ? "progress-danger" : category.impacto === "Medio" ? "progress-warning" : "progress-success"}" 
                             style="width: ${category.percentage}%"></div>
                      </div>
                    </td>
                    <td style="text-align: center; font-weight: bold;">${category.count}</td>
                    <td style="font-weight: bold;">$${category.average.toLocaleString("es-ES")}</td>
                    <td>
                      <span class="status-badge ${category.impacto === "Alto" ? "status-rejected" : category.impacto === "Medio" ? "status-pending" : "status-confirmed"}">
                        ${category.impacto}
                      </span>
                    </td>
                    <td>
                      <div style="font-size: 11px; color: #64748b;">
                        Mayor: $${Math.max(...category.items.map((i) => i.monto)).toLocaleString("es-ES")}
                      </div>
                    </td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <!-- Timeline de Gastos -->
          <div class="section">
            <div class="section-header">
              <div class="section-icon" style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);">📅</div>
              <h2 class="section-title">Timeline Detallado de Gastos</h2>
            </div>
            
            <table class="premium-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Categoría</th>
                  <th>Monto</th>
                  <th>Responsable</th>
                  <th>Descripción</th>
                  <th>Impacto</th>
                </tr>
              </thead>
              <tbody>
                ${expenses
                  .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
                  .map((expense) => {
                    const categoryClass = `expense-${expense.categoria.toLowerCase().replace(/\s+/g, "")}`
                    const impacto =
                      expense.monto > stats.totalExpenses * 0.1
                        ? "Alto"
                        : expense.monto > stats.totalExpenses * 0.05
                          ? "Medio"
                          : "Bajo"

                    return `
                      <tr class="${categoryClass}">
                        <td style="font-weight: bold;">${expense.fecha.toLocaleDateString("es-ES")}</td>
                        <td>
                          <div style="font-weight: bold; font-size: 13px;">${expense.concepto}</div>
                        </td>
                        <td>
                          <span style="padding: 4px 8px; background: rgba(79, 70, 229, 0.1); border-radius: 6px; font-size: 10px; text-transform: uppercase; font-weight: bold;">
                            ${expense.categoria}
                          </span>
                        </td>
                        <td style="font-weight: bold; font-size: 16px; color: #dc2626;">
                          $${expense.monto.toLocaleString("es-ES")}
                        </td>
                        <td style="font-weight: bold; color: #4f46e5;">${expense.pagadoPor || "N/E"}</td>
                        <td style="font-size: 11px; color: #64748b;">${expense.descripcion || "-"}</td>
                        <td>
                          <span class="status-badge ${impacto === "Alto" ? "status-rejected" : impacto === "Medio" ? "status-pending" : "status-confirmed"}">
                            ${impacto}
                          </span>
                        </td>
                      </tr>
                    `
                  })
                  .join("")}
              </tbody>
            </table>
          </div>

          <!-- Resumen Ejecutivo Final -->
          <div class="section" style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border: 2px solid #4f46e5;">
            <div class="section-header">
              <div class="section-icon" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">🎯</div>
              <h2 class="section-title">Resumen Ejecutivo Final</h2>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px;">
              <div>
                <h4 style="color: #059669; margin-bottom: 15px;">✅ Fortalezas Identificadas</h4>
                <ul style="list-style: none; padding: 0;">
                  <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    💰 Balance financiero: ${stats.netBalance >= 0 ? "POSITIVO" : "NEGATIVO"}
                  </li>
                  <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    📊 Tasa de conversión: ${stats.conversionRate.toFixed(1)}%
                  </li>
                  <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    👥 Participación grupal: ${stats.groupsCount} grupos activos
                  </li>
                  <li style="padding: 8px 0;">
                    🏥 Gestión médica: ${stats.healthAlerts.length} alertas identificadas
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 style="color: #dc2626; margin-bottom: 15px;">⚠️ Áreas de Mejora</h4>
                <ul style="list-style: none; padding: 0;">
                  <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    📈 Margen de ganancia: ${stats.profitMargin.toFixed(1)}% ${stats.profitMargin < 15 ? "(Mejorable)" : "(Óptimo)"}
                  </li>
                  <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    ⏳ Pendientes: ${stats.pendingRegistrations} por confirmar
                  </li>
                  <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    💸 Mayor gasto: ${stats.expensesAnalysis[0]?.categoria || "N/A"}
                  </li>
                  <li style="padding: 8px 0;">
                    🚨 Riesgo médico: ${stats.healthRisk}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      `
    }

    // Footer corporativo
    htmlContent += `
        <div class="corporate-footer">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-bottom: 30px;">
            <div>
              <h4 style="margin: 0 0 15px 0; color: #e2e8f0;">📄 Información del Documento</h4>
              <p style="margin: 5px 0; font-size: 13px; opacity: 0.9;">Generado: ${new Date().toLocaleString("es-ES")}</p>
              <p style="margin: 5px 0; font-size: 13px; opacity: 0.9;">Versión: 2.0 Executive</p>
              <p style="margin: 5px 0; font-size: 13px; opacity: 0.9;">Páginas: ${includeDashboard ? "1" : "0"}${selectedRegistrations.length > 0 ? " + 1" : ""}${includeExpenses && expenses.length > 0 ? " + 1" : ""}</p>
            </div>
            
            <div>
              <h4 style="margin: 0 0 15px 0; color: #e2e8f0;">🔒 Confidencialidad</h4>
              <p style="margin: 5px 0; font-size: 13px; opacity: 0.9;">Documento clasificado</p>
              <p style="margin: 5px 0; font-size: 13px; opacity: 0.9;">Datos personales protegidos</p>
              <p style="margin: 5px 0; font-size: 13px; opacity: 0.9;">Uso interno exclusivo</p>
            </div>
            
            <div>
              <h4 style="margin: 0 0 15px 0; color: #e2e8f0;">⚡ Sistema</h4>
              <p style="margin: 5px 0; font-size: 13px; opacity: 0.9;">Plataforma de Gestión</p>
              <p style="margin: 5px 0; font-size: 13px; opacity: 0.9;">Reportes Ejecutivos v2.0</p>
              <p style="margin: 5px 0; font-size: 13px; opacity: 0.9;">Análisis Avanzado</p>
            </div>
          </div>
          
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
            <p style="margin: 0; font-weight: 600; font-size: 16px;">© ${new Date().getFullYear()} - Sistema de Gestión Ejecutiva</p>
            <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 13px;">Todos los derechos reservados • Documento generado automáticamente</p>
          </div>
        </div>
        </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `reporte-ejecutivo-${new Date().toISOString().split("T")[0]}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setIsOpen(false)
  }

  const hasData = confirmedRegistrations.length > 0 || pendingRegistrations.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 text-xs h-10 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200 text-green-700 hover:text-green-800 hover:scale-105"
          disabled={!hasData}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span className="hidden sm:inline font-semibold">Excel Premium</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                Reporte Ejecutivo Premium
              </div>
              <div className="text-sm text-muted-foreground font-normal">Sistema de análisis empresarial avanzado</div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            Genera un reporte de nivel corporativo con 3 hojas especializadas: Dashboard ejecutivo con KPIs, registro
            completo de participantes con alertas médicas, y análisis financiero avanzado con métricas de rentabilidad.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dashboard Section */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                Dashboard Ejecutivo
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold">
                  KPIs Avanzados
                </Badge>
              </CardTitle>
              <CardDescription>
                Métricas ejecutivas, análisis demográfico, inventario inteligente y ranking de grupos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="dashboard"
                  checked={includeDashboard}
                  onCheckedChange={setIncludeDashboard}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <label htmlFor="dashboard" className="text-sm font-medium cursor-pointer">
                  Incluir análisis ejecutivo completo con visualizaciones premium
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold">Métricas Clave</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Conversión, balance, márgenes</div>
                </div>
                <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-semibold">Alertas Médicas</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stats.celiacCount} celíacos, {stats.withHealthConditions} condiciones
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participants Section */}
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-md">
                  <Users className="h-4 w-4 text-white" />
                </div>
                Registro de Participantes
                <Badge variant="secondary" className="bg-green-100 text-green-800 font-semibold">
                  {stats.validRegistrations} válidos
                </Badge>
              </CardTitle>
              <CardDescription>
                Base de datos completa con sistema de alertas médicas y análisis de estado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="confirmed"
                    checked={includeConfirmed}
                    onCheckedChange={setIncludeConfirmed}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <label htmlFor="confirmed" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Confirmados
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {confirmedRegistrations.length}
                    </Badge>
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="pending"
                    checked={includePending}
                    onCheckedChange={setIncludePending}
                    className="data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600"
                  />
                  <label htmlFor="pending" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Pendientes
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {pendingRegistrations.length}
                    </Badge>
                  </label>
                </div>
              </div>

              <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-semibold">Alertas Médicas Críticas</span>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {stats.celiacCount + stats.withHealthConditions} casos
                  </Badge>
                </div>
                <Progress
                  value={((stats.celiacCount + stats.withHealthConditions) / stats.validRegistrations) * 100}
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground mt-1">Requiere protocolo especial de atención</div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Section */}
          {expenses.length > 0 && (
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-1.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-md">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  Gestión Financiera
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 font-semibold">
                    ${stats.totalExpenses.toLocaleString("es-ES")}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Análisis avanzado de rentabilidad, categorización de gastos y timeline financiero
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-4">
                  <Checkbox
                    id="expenses"
                    checked={includeExpenses}
                    onCheckedChange={setIncludeExpenses}
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                  <label htmlFor="expenses" className="text-sm font-medium cursor-pointer">
                    Incluir análisis financiero completo con métricas de rentabilidad
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/60 rounded-lg p-3 border border-purple-200 text-center">
                    <div className="text-lg font-bold text-green-600">
                      $${stats.totalIncome.toLocaleString("es-ES")}
                    </div>
                    <div className="text-xs text-muted-foreground">Ingresos</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-purple-200 text-center">
                    <div className="text-lg font-bold text-red-600">
                      $${stats.totalExpenses.toLocaleString("es-ES")}
                    </div>
                    <div className="text-xs text-muted-foreground">Gastos</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-purple-200 text-center">
                    <div className={`text-lg font-bold ${stats.netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      $${stats.netBalance.toLocaleString("es-ES")}
                    </div>
                    <div className="text-xs text-muted-foreground">Balance</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Premium Mode Toggle */}
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-amber-800">Modo Premium Activado</div>
                    <div className="text-sm text-amber-700">
                      Diseño ejecutivo con gradientes, iconos y visualizaciones avanzadas
                    </div>
                  </div>
                </div>
                <Checkbox
                  id="premium"
                  checked={premiumMode}
                  onCheckedChange={setPremiumMode}
                  className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1 hover:bg-gray-50">
              Cancelar
            </Button>
            <Button
              onClick={exportToExcel}
              disabled={!includeConfirmed && !includePending}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Generar Reporte Ejecutivo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Download, Settings, BarChart3, Users, DollarSign, Filter, Palette, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"

interface Registration {
  id: string
  nombre?: string
  apellido?: string
  dni?: string
  email?: string
  telefono?: string
  localidad?: string
  numeroInscripcion?: number
  fechaNacimiento?: string
  genero?: string
  telefonoEmergencia?: string
  talleRemera?: string
  grupoSanguineo?: string
  grupoCiclistas?: string
  condicionSalud?: string
  transferidoA?: string
  precio?: string
  estado?: string
  fechaInscripcion?: Date
  [key: string]: any
}

interface Expense {
  id: string
  concepto: string
  monto: number
  categoria: string
  fecha: Date
  descripcion?: string
  pagadoPor?: string
}

interface ExcelExportProps {
  registrations: Registration[]
  expenses?: Expense[]
}

const parseHealthConditions = (condicionSalud: string) => {
  if (!condicionSalud) {
    return { esCeliaco: "no", condicionesSalud: "" }
  }

  try {
    const parsed = JSON.parse(condicionSalud)
    return {
      esCeliaco: parsed.esCeliaco || "no",
      condicionesSalud: parsed.condicionesSalud || "",
    }
  } catch {
    return { esCeliaco: "no", condicionesSalud: condicionSalud }
  }
}

const calculateStats = (registrations: Registration[]) => {
  const validRegistrations = registrations.filter((reg) => reg.estado !== "rechazado")
  const confirmedRegistrations = registrations.filter((reg) => reg.estado === "confirmado")
  const pendingRegistrations = registrations.filter((reg) => reg.estado === "pendiente" || !reg.estado)

  const maleCount = validRegistrations.filter((reg) => reg.genero?.toLowerCase() === "masculino").length
  const femaleCount = validRegistrations.filter((reg) => reg.genero?.toLowerCase() === "femenino").length
  const otherCount = validRegistrations.filter(
    (reg) => reg.genero && reg.genero?.toLowerCase() !== "masculino" && reg.genero?.toLowerCase() !== "femenino",
  ).length

  let withHealthConditions = 0
  let celiacCount = 0

  validRegistrations.forEach((reg) => {
    try {
      const healthInfo = parseHealthConditions(reg.condicionSalud)
      if (healthInfo.esCeliaco === "si") {
        celiacCount++
      }
      if (healthInfo.condicionesSalud && healthInfo.condicionesSalud.trim() !== "") {
        withHealthConditions++
      }
    } catch (error) {
      console.error("Error al procesar condicionSalud:", error)
    }
  })

  // Calcular talles
  const jerseySize: Record<string, number> = { xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0 }
  validRegistrations.forEach((reg) => {
    if (reg.talleRemera) {
      const size = reg.talleRemera.toLowerCase()
      if (jerseySize.hasOwnProperty(size)) {
        jerseySize[size]++
      }
    }
  })

  // Contar grupos únicos
  const groupsMap = new Map<string, string[]>()
  validRegistrations.forEach((reg) => {
    const grupo = reg.grupoCiclistas || reg.grupoBici || reg.grupo_bici || reg.grupobici || reg.grupo
    if (grupo && grupo.trim() !== "") {
      const groupName = grupo.trim()
      const participantName = `${reg.nombre || ""} ${reg.apellido || ""}`.trim()

      if (!groupsMap.has(groupName)) {
        groupsMap.set(groupName, [])
      }
      if (participantName) {
        groupsMap.get(groupName)?.push(participantName)
      }
    }
  })

  return {
    totalRegistrations: registrations.length,
    validRegistrations: validRegistrations.length,
    confirmedRegistrations: confirmedRegistrations.length,
    pendingRegistrations: pendingRegistrations.length,
    maleCount,
    femaleCount,
    otherCount,
    withHealthConditions,
    celiacCount,
    jerseySize,
    groupsCount: groupsMap.size,
    groupsInfo: Array.from(groupsMap.entries())
      .map(([nombre, participantes]) => ({
        nombre,
        cantidad: participantes.length,
        participantes: participantes.sort(),
      }))
      .sort((a, b) => b.cantidad - a.cantidad),
  }
}

export function AdminRegistrationsExcel({ registrations, expenses = [] }: ExcelExportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [includeConfirmed, setIncludeConfirmed] = useState(true)
  const [includePending, setIncludePending] = useState(false)
  const [includeDashboard, setIncludeDashboard] = useState(true)
  const [includeExpenses, setIncludeExpenses] = useState(true)
  const [includeAdvancedStyles, setIncludeAdvancedStyles] = useState(true)

  const stats = calculateStats(registrations)
  const confirmedRegistrations = registrations.filter((reg) => reg.estado === "confirmado")
  const pendingRegistrations = registrations.filter((reg) => reg.estado === "pendiente" || !reg.estado)

  const exportToExcel = () => {
    const currentDate = new Date().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    let htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Reporte Premium - Sistema de Inscripciones</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              color: #1a202c;
              line-height: 1.6;
            }
            
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 20px;
            }
            
            /* ===== HOJA 1: DASHBOARD STYLES ===== */
            .dashboard-sheet {
              background: #ffffff;
              border-radius: 20px;
              box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
              margin-bottom: 40px;
              overflow: hidden;
            }
            
            .dashboard-header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            
            .dashboard-header::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpIi8+Cjwvc3ZnPg==');
              animation: float 20s infinite linear;
              opacity: 0.1;
            }
            
            @keyframes float {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            .dashboard-title {
              font-size: 32px;
              font-weight: 800;
              margin-bottom: 10px;
              position: relative;
              z-index: 2;
            }
            
            .dashboard-subtitle {
              font-size: 16px;
              opacity: 0.9;
              position: relative;
              z-index: 2;
            }
            
            .metrics-container {
              padding: 40px 30px;
              background: #f8fafc;
            }
            
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 25px;
              margin-bottom: 40px;
            }
            
            .metric-card {
              background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
              border-radius: 16px;
              padding: 25px;
              text-align: center;
              border: 1px solid #e2e8f0;
              transition: all 0.3s ease;
              position: relative;
              overflow: hidden;
            }
            
            .metric-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, #667eea, #764ba2);
            }
            
            .metric-value {
              font-size: 36px;
              font-weight: 800;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 8px;
            }
            
            .metric-label {
              font-size: 14px;
              font-weight: 500;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .section-card {
              background: white;
              border-radius: 16px;
              padding: 30px;
              margin-bottom: 25px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
              border: 1px solid #e2e8f0;
            }
            
            .section-title {
              font-size: 20px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .section-title::before {
              content: '';
              width: 4px;
              height: 24px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 2px;
            }
            
            /* ===== HOJA 2: INSCRIPCIONES STYLES ===== */
            .registrations-sheet {
              background: #ffffff;
              border-radius: 20px;
              box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
              margin-bottom: 40px;
              overflow: hidden;
            }
            
            .registrations-header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            
            .registrations-table-container {
              padding: 30px;
              overflow-x: auto;
            }
            
            /* ===== HOJA 3: GASTOS STYLES ===== */
            .expenses-sheet {
              background: #ffffff;
              border-radius: 20px;
              box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
              margin-bottom: 40px;
              overflow: hidden;
            }
            
            .expenses-header {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            
            /* ===== TABLA STYLES ===== */
            .premium-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
              margin-bottom: 30px;
            }
            
            .premium-table th {
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              color: white;
              padding: 18px 15px;
              font-weight: 600;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              text-align: left;
              position: sticky;
              top: 0;
              z-index: 10;
            }
            
            .premium-table th:first-child {
              border-top-left-radius: 12px;
            }
            
            .premium-table th:last-child {
              border-top-right-radius: 12px;
            }
            
            .premium-table td {
              padding: 15px;
              font-size: 13px;
              border-bottom: 1px solid #f1f5f9;
              background: white;
              transition: all 0.2s ease;
            }
            
            .premium-table tbody tr:hover td {
              background: #f8fafc;
              transform: scale(1.01);
            }
            
            .premium-table tbody tr:nth-child(even) td {
              background: #f9fafb;
            }
            
            /* STATUS BADGES */
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .status-confirmed {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
            }
            
            .status-pending {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white;
              box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
            }
            
            .status-rejected {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
            }
            
            /* ROW HIGHLIGHTS */
            .confirmed-row {
              border-left: 4px solid #10b981;
              background: linear-gradient(90deg, #f0fdf4 0%, #ffffff 100%);
            }
            
            .pending-row {
              border-left: 4px solid #f59e0b;
              background: linear-gradient(90deg, #fffbeb 0%, #ffffff 100%);
            }
            
            .celiac-highlight {
              background: linear-gradient(90deg, #fef3c7 0%, #ffffff 100%);
              font-weight: 600;
              color: #d97706;
            }
            
            .health-condition-highlight {
              background: linear-gradient(90deg, #fee2e2 0%, #ffffff 100%);
              color: #dc2626;
            }
            
            /* EXPENSE CATEGORIES */
            .expense-logistica { border-left: 4px solid #3b82f6; background: linear-gradient(90deg, #dbeafe 0%, #ffffff 100%); }
            .expense-alimentacion { border-left: 4px solid #10b981; background: linear-gradient(90deg, #dcfce7 0%, #ffffff 100%); }
            .expense-premios { border-left: 4px solid #f59e0b; background: linear-gradient(90deg, #fef3c7 0%, #ffffff 100%); }
            .expense-marketing { border-left: 4px solid #8b5cf6; background: linear-gradient(90deg, #f3e8ff 0%, #ffffff 100%); }
            .expense-equipamiento { border-left: 4px solid #ef4444; background: linear-gradient(90deg, #fee2e2 0%, #ffffff 100%); }
            .expense-servicios { border-left: 4px solid #6366f1; background: linear-gradient(90deg, #e0e7ff 0%, #ffffff 100%); }
            .expense-transporte { border-left: 4px solid #f97316; background: linear-gradient(90deg, #fed7aa 0%, #ffffff 100%); }
            .expense-otros { border-left: 4px solid #6b7280; background: linear-gradient(90deg, #f1f5f9 0%, #ffffff 100%); }
            
            /* CATEGORY TAGS */
            .category-tag {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .cat-logistica { background: #dbeafe; color: #1e40af; }
            .cat-alimentacion { background: #dcfce7; color: #166534; }
            .cat-premios { background: #fef3c7; color: #92400e; }
            .cat-marketing { background: #f3e8ff; color: #6b21a8; }
            .cat-equipamiento { background: #fee2e2; color: #991b1b; }
            .cat-servicios { background: #e0e7ff; color: #3730a3; }
            .cat-transporte { background: #fed7aa; color: #9a3412; }
            .cat-otros { background: #f1f5f9; color: #374151; }
            
            /* MONEY FORMAT */
            .money {
              font-weight: 700;
              color: #dc2626;
              font-family: 'Courier New', monospace;
            }
            
            .money-positive {
              color: #059669;
            }
            
            /* PROGRESS BARS */
            .progress-bar {
              width: 100%;
              height: 8px;
              background: #e2e8f0;
              border-radius: 4px;
              overflow: hidden;
              margin-top: 5px;
            }
            
            .progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #667eea, #764ba2);
              transition: width 0.3s ease;
            }
            
            /* FOOTER */
            .premium-footer {
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              color: white;
              padding: 30px;
              text-align: center;
              margin-top: 50px;
              border-radius: 16px;
            }
            
            .premium-footer h3 {
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 10px;
              color: #f1f5f9;
            }
            
            .premium-footer p {
              font-size: 12px;
              opacity: 0.8;
              margin: 5px 0;
            }
            
            /* RESPONSIVE */
            @media (max-width: 768px) {
              .metrics-grid {
                grid-template-columns: 1fr;
                gap: 15px;
              }
              
              .metric-card {
                padding: 20px;
              }
              
              .metric-value {
                font-size: 28px;
              }
              
              .section-card {
                padding: 20px;
                margin-bottom: 15px;
              }
            }
            
            /* PRINT STYLES */
            @media print {
              body { background: white; }
              .dashboard-sheet, .registrations-sheet, .expenses-sheet {
                page-break-after: always;
                box-shadow: none;
                border: 1px solid #e2e8f0;
              }
              
              .dashboard-sheet:last-child, .registrations-sheet:last-child, .expenses-sheet:last-child {
                page-break-after: auto;
              }
            }
          </style>
        </head>
        <body>
    `

    // ===== HOJA 1: DASHBOARD PREMIUM =====
    if (includeDashboard) {
      const totalRevenue = registrations.reduce((sum, reg) => {
        const precio = parseFloat(reg.precio || '0')
        return sum + (isNaN(precio) ? 0 : precio)
      }, 0)

      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.monto, 0)
      const netProfit = totalRevenue - totalExpenses

      htmlContent += `
        <div class="container">
          <div class="dashboard-sheet">
            <div class="dashboard-header">
              <h1 class="dashboard-title">📊 DASHBOARD EJECUTIVO</h1>
              <p class="dashboard-subtitle">Reporte Premium Generado el ${currentDate}</p>
            </div>
            
            <div class="metrics-container">
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-value">${stats.totalRegistrations}</div>
                  <div class="metric-label">📋 Total Inscripciones</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${stats.confirmedRegistrations}</div>
                  <div class="metric-label">✅ Confirmados</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${stats.pendingRegistrations}</div>
                  <div class="metric-label">⏳ Pendientes</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">$${totalRevenue.toLocaleString('es-ES')}</div>
                  <div class="metric-label">💰 Ingresos Totales</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">$${totalExpenses.toLocaleString('es-ES')}</div>
                  <div class="metric-label">💸 Gastos Totales</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value ${netProfit >= 0 ? 'money-positive' : ''}">$${netProfit.toLocaleString('es-ES')}</div>
                  <div class="metric-label">📈 Balance Neto</div>
                </div>
              </div>
              
              <div class="section-card">
                <h3 class="section-title">👥 Distribución Demográfica</h3>
                <table class="premium-table">
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Cantidad</th>
                      <th>Porcentaje</th>
                      <th>Progreso</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>🚹 Masculino</strong></td>
                      <td>${stats.maleCount}</td>
                      <td><strong>${stats.validRegistrations > 0 ? ((stats.maleCount / stats.validRegistrations) * 100).toFixed(1) : 0}%</strong></td>
                      <td>
                        <div class="progress-bar">
                          <div class="progress-fill" style="width: ${stats.validRegistrations > 0 ? (stats.maleCount / stats.validRegistrations) * 100 : 0}%"></div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>🚺 Femenino</strong></td>
                      <td>${stats.femaleCount}</td>
                      <td><strong>${stats.validRegistrations > 0 ? ((stats.femaleCount / stats.validRegistrations) * 100).toFixed(1) : 0}%</strong></td>
                      <td>
                        <div class="progress-bar">
                          <div class="progress-fill" style="width: ${stats.validRegistrations > 0 ? (stats.femaleCount / stats.validRegistrations) * 100 : 0}%"></div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>⚧ Otros</strong></td>
                      <td>${stats.otherCount}</td>
                      <td><strong>${stats.validRegistrations > 0 ? ((stats.otherCount / stats.validRegistrations) * 100).toFixed(1) : 0}%</strong></td>
                      <td>
                        <div class="progress-bar">
                          <div class="progress-fill" style="width: ${stats.validRegistrations > 0 ? (stats.otherCount / stats.validRegistrations) * 100 : 0}%"></div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="section-card">
                <h3 class="section-title">🏥 Información Médica Crítica</h3>
                <table class="premium-table">
                  <thead>
                    <tr>
                      <th>Condición</th>
                      <th>Cantidad</th>
                      <th>% del Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="health-condition-highlight">
                      <td><strong>🏥 Con Condiciones de Salud</strong></td>
                      <td>${stats.withHealthConditions}</td>
                      <td><strong>${stats.validRegistrations > 0 ? ((stats.withHealthConditions / stats.validRegistrations) * 100).toFixed(1) : 0}%</strong></td>
                      <td><span class="status-badge ${stats.withHealthConditions > 0 ? 'status-pending' : 'status-confirmed'}">
                        ${stats.withHealthConditions > 0 ? 'ATENCIÓN' : 'OK'}
                      </span></td>
                    </tr>
                    <tr class="celiac-highlight">
                      <td><strong>🌾 Celíacos</strong></td>
                      <td>${stats.celiacCount}</td>
                      <td><strong>${stats.validRegistrations > 0 ? ((stats.celiacCount / stats.validRegistrations) * 100).toFixed(1) : 0}%</strong></td>
                      <td><span class="status-badge ${stats.celiacCount > 0 ? 'status-pending' : 'status-confirmed'}">
                        ${stats.celiacCount > 0 ? 'DIETA ESPECIAL' : 'OK'}
                      </span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="section-card">
                <h3 class="section-title">👕 Inventario de Remeras</h3>
                <table class="premium-table">
                  <thead>
                    <tr>
                      <th>Talle</th>
                      <th>Pedidos</th>
                      <th>Porcentaje</th>
                      <th>Stock Requerido</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.entries(stats.jerseySize)
                      .sort(([, a], [, b]) => b - a)
                      .map(([size, count]) => {
                        const percentage = stats.validRegistrations > 0 ? ((count / stats.validRegistrations) * 100).toFixed(1) : 0
                        const stockNeeded = Math.ceil(count * 1.1) // 10% buffer
                        return `
                        <tr>
                          <td><strong style="text-transform: uppercase;">${size}</strong></td>
                          <td>${count}</td>
                          <td><strong>${percentage}%</strong></td>
                          <td><span class="status-badge status-confirmed">${stockNeeded} unidades</span></td>
                        </tr>
                        `
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>
              
              ${stats.groupsInfo.length > 0 ? `
              <div class="section-card">
                <h3 class="section-title">🚴‍♂️ Grupos de Ciclistas (${stats.groupsCount} grupos activos)</h3>
                <table class="premium-table">
                  <thead>
                    <tr>
                      <th>Ranking</th>
                      <th>Grupo</th>
                      <th>Participantes</th>
                      <th>% del Total</th>
                      <th>Integrantes</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${stats.groupsInfo
                      .map((group, index) => {
                        const percentage = ((group.cantidad / stats.validRegistrations) * 100).toFixed(1)
                        return `
                        <tr>
                          <td><strong>#${index + 1}</strong></td>
                          <td><strong>${group.nombre}</strong></td>
                          <td><span class="status-badge status-confirmed">${group.cantidad}</span></td>
                          <td><strong>${percentage}%</strong></td>
                          <td>${group.participantes.join(", ")}</td>
                        </tr>
                        `
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>
              ` : ""}
            </div>
          </div>
        </div>
      `
    }

    // ===== HOJA 2: INSCRIPCIONES DETALLADAS =====
    const selectedRegistrations = []
    if (includeConfirmed) selectedRegistrations.push(...confirmedRegistrations)
    if (includePending) selectedRegistrations.push(...pendingRegistrations)

    if (selectedRegistrations.length > 0) {
      htmlContent += `
        <div class="container">
          <div class="registrations-sheet">
            <div class="registrations-header">
              <h1 class="dashboard-title">📋 REGISTRO COMPLETO DE PARTICIPANTES</h1>
              <p class="dashboard-subtitle">
                ${selectedRegistrations.length} participantes registrados
                ${includeConfirmed ? `• ✅ ${confirmedRegistrations.length} Confirmados` : ""} 
                ${includePending ? `• ⏳ ${pendingRegistrations.length} Pendientes` : ""}
              </p>
            </div>
            
            <div class="registrations-table-container">
              <table class="premium-table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>N° Inscripción</th>
                    <th>Datos Personales</th>
                    <th>DNI</th>
                    <th>Contacto</th>
                    <th>Emergencia</th>
                    <th>Nacimiento</th>
                    <th>Género</th>
                    <th>Ubicación</th>
                    <th>Talle</th>
                    <th>Sangre</th>
                    <th>Grupo Ciclista</th>
                    <th>Celíaco</th>
                    <th>Condiciones Médicas</th>
                    <th>Transferencia</th>
                    <th>Precio</th>
                    <th>Fecha Inscripción</th>
                  </tr>
                </thead>
                <tbody>
                  ${selectedRegistrations
                    .sort((a, b) => (a.numeroInscripcion || 0) - (b.numeroInscripcion || 0))
                    .map((reg) => {
                      const healthInfo = parseHealthConditions(reg.condicionSalud)
                      const telefonoEmergencia = reg.telefonoEmergencia || reg.telefono_emergencia || reg.telEmergencia || reg.telefonoContacto || ""
                      const grupoSanguineo = reg.grupoSanguineo || reg.grupo_sanguineo || reg.gruposanguineo || reg.sangre || ""
                      const grupoBici = reg.grupoCiclistas || reg.grupoBici || reg.grupo_bici || reg.grupobici || reg.grupo || ""
                      const rowClass = reg.estado === "confirmado" ? "confirmed-row" : "pending-row"
                      const celiacClass = healthInfo.esCeliaco === "si" ? "celiac-highlight" : ""
                      const healthClass = healthInfo.condicionesSalud && healthInfo.condicionesSalud.trim() !== "" ? "health-condition-highlight" : ""

                      return `
                        <tr class="${rowClass} ${celiacClass} ${healthClass}">
                          <td>
                            <span class="status-badge ${reg.estado === "confirmado" ? "status-confirmed" : "status-pending"}">
                              ${reg.estado === "confirmado" ? "✅ CONFIRMADO" : "⏳ PENDIENTE"}
                            </span>
                          </td>
                          <td><strong style="font-size: 14px; color: #1e293b;">#${reg.numeroInscripcion || "-"}</strong></td>
                          <td>
                            <div style="font-weight: 700; color: #1e293b;">${reg.apellido || ""}, ${reg.nombre || ""}</div>
                          </td>
                          <td><strong>${reg.dni || ""}</strong></td>
                          <td>
                            <div style="font-size: 11px;">
                              📧 ${reg.email || ""}<br>
                              📱 ${reg.telefono || ""}
                            </div>
                          </td>
                          <td><strong style="color: #dc2626;">🚨 ${telefonoEmergencia || "-"}</strong></td>
                          <td>${reg.fechaNacimiento || ""}</td>
                          <td>
                            <span style="font-weight: 600;">
                              ${reg.genero === "masculino" ? "🚹 M" : reg.genero === "femenino" ? "🚺 F" : "⚧ O"}
                            </span>
                          </td>
                          <td>${reg.localidad || ""}</td>
                          <td>
                            <span class="status-badge status-confirmed" style="font-size: 11px;">
                              ${(reg.talleRemera || "").toUpperCase()}
                            </span>
                          </td>
                          <td><strong style="color: #dc2626;">${grupoSanguineo}</strong></td>
                          <td><strong style="color: #059669;">${grupoBici}</strong></td>
                          <td>
                            <span style="font-weight: 700; color: ${healthInfo.esCeliaco === "si" ? "#d97706" : "#059669"};">
                              ${healthInfo.esCeliaco === "si" ? "🌾 SÍ" : "✅ NO"}
                            </span>
                          </td>
                          <td style="max-width: 200px; word-wrap: break-word;">
                            ${healthInfo.condicionesSalud ? `<strong style="color: #dc2626;">⚠️ ${healthInfo.condicionesSalud}</strong>` : "✅ Ninguna"}
                          </td>
                          <td>${reg.transferidoA || reg.transfirio_a || "-"}</td>
                          <td><strong class="money">${reg.precio || "0"}</strong></td>
                          <td style="font-size: 11px;">
                            ${reg.fechaInscripcion ? reg.fechaInscripcion.toLocaleDateString("es-ES") : "-"}
                          </td>
                        </tr>
                      `
                    })
                    .join("")}
                </tbody>
              </table>
              
              <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #10b981;">
                <h4 style="color: #059669; margin-bottom: 10px;">📊 Resumen de esta Hoja:</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                  <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #10b981;">${selectedRegistrations.length}</div>
                    <div style="font-size: 12px; color: #6b7280;">Total Participantes</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">
                      ${selectedRegistrations.filter(r => parseHealthConditions(r.condicionSalud).esCeliaco === "si").length}
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">Celíacos</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #ef4444;">
                      ${selectedRegistrations.filter(r => {
                        const health = parseHealthConditions(r.condicionSalud)
                        return health.condicionesSalud && health.condicionesSalud.trim() !== ""
                      }).length}
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">Con Condiciones Médicas</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #8b5cf6;">
                      ${new Set(selectedRegistrations.map(r => r.grupoCiclistas || r.grupoBici || r.grupo_bici || r.grupobici || r.grupo).filter(Boolean)).size}
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">Grupos Diferentes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    }

    // ===== HOJA 3: GESTIÓN FINANCIERA PREMIUM =====
    if (includeExpenses && expenses.length > 0) {
      const totalExpenses = expenses.reduce((total, expense) => total + expense.monto, 0)
      const expensesByCategory = expenses.reduce((acc, expense) => {
        acc[expense.categoria] = (acc[expense.categoria] || 0) + expense.monto
        return acc
      }, {} as Record<string, number>)

      const categoryColors = {
        'logistica': '#3b82f6',
        'alimentacion': '#10b981',
        'premios': '#f59e0b',
        'marketing': '#8b5cf6',
        'equipamiento': '#ef4444',
        'servicios': '#6366f1',
        'transporte': '#f97316',
        'otros': '#6b7280'
      }

      htmlContent += `
        <div class="container">
          <div class="expenses-sheet">
            <div class="expenses-header">
              <h1 class="dashboard-title">💰 GESTIÓN FINANCIERA PREMIUM</h1>
              <p class="dashboard-subtitle">
                Control total de gastos • ${totalExpenses.toLocaleString("es-ES")} invertidos • ${expenses.length} transacciones registradas
              </p>
            </div>
            
            <div style="padding: 40px 30px;">
              <div class="section-card">
                <h3 class="section-title">📊 Análisis por Categorías</h3>
                <table class="premium-table">
                  <thead>
                    <tr>
                      <th>Ranking</th>
                      <th>Categoría</th>
                      <th>Monto Total</th>
                      <th>% del Presupuesto</th>
                      <th>Cantidad de Gastos</th>
                      <th>Promedio por Gasto</th>
                      <th>Impacto</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.entries(expensesByCategory)
                      .sort(([, a], [, b]) => b - a)
                      .map(([categoria, total], index) => {
                        const count = expenses.filter((e) => e.categoria === categoria).length
                        const percentage = ((total / totalExpenses) * 100).toFixed(1)
                        const average = (total / count).toFixed(0)
                        const categoryKey = categoria.toLowerCase().replace(/\s+/g, '')
                        const impactLevel = parseFloat(percentage) > 20 ? 'ALTO' : parseFloat(percentage) > 10 ? 'MEDIO' : 'BAJO'
                        const impactClass = impactLevel === 'ALTO' ? 'status-rejected' : impactLevel === 'MEDIO' ? 'status-pending' : 'status-confirmed'
                        
                        return `
                        <tr class="expense-${categoryKey}">
                          <td><strong style="font-size: 16px;">#${index + 1}</strong></td>
                          <td>
                            <span class="category-tag cat-${categoryKey}">
                              ${categoria.toUpperCase()}
                            </span>
                          </td>
                          <td><strong class="money">${total.toLocaleString("es-ES")}</strong></td>
                          <td>
                            <strong style="font-size: 14px;">${percentage}%</strong>
                            <div class="progress-bar">
                              <div class="progress-fill" style="width: ${percentage}%; background: ${categoryColors[categoryKey] || '#6b7280'};"></div>
                            </div>
                          </td>
                          <td><span class="status-badge status-confirmed">${count} gastos</span></td>
                          <td class="money">${parseInt(average).toLocaleString("es-ES")}</td>
                          <td><span class="status-badge ${impactClass}">${impactLevel}</span></td>
                        </tr>
                        `
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>
              
              <div class="section-card">
                <h3 class="section-title">📝 Registro Detallado de Gastos</h3>
                <table class="premium-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Concepto</th>
                      <th>Categoría</th>
                      <th>Monto</th>
                      <th>Responsable</th>
                      <th>Descripción Completa</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${expenses
                      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
                      .map((expense, index) => {
                        const categoryKey = expense.categoria.toLowerCase().replace(/\s+/g, "")
                        const isHighAmount = expense.monto > (totalExpenses / expenses.length * 2)
                        const amountClass = isHighAmount ? 'status-rejected' : 'status-confirmed'
                        
                        return `
                          <tr class="expense-${categoryKey}">
                            <td><strong>${expense.fecha.toLocaleDateString("es-ES")}</strong></td>
                            <td>
                              <div style="font-weight: 700; color: #1e293b; margin-bottom: 2px;">
                                ${expense.concepto}
                              </div>
                            </td>
                            <td>
                              <span class="category-tag cat-${categoryKey}">
                                ${expense.categoria}
                              </span>
                            </td>
                            <td>
                              <div style="display: flex; flex-direction: column; align-items: center; gap: 3px;">
                                <strong class="money" style="font-size: 14px;">${expense.monto.toLocaleString("es-ES")}</strong>
                                <span class="status-badge ${amountClass}" style="font-size: 8px;">
                                  ${isHighAmount ? 'ALTO' : 'NORMAL'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <strong style="color: #059669;">
                                ${expense.pagadoPor || '👤 No especificado'}
                              </strong>
                            </td>
                            <td style="max-width: 250px; word-wrap: break-word; font-size: 11px;">
                              ${expense.descripcion || '📝 Sin descripción adicional'}
                            </td>
                            <td>
                              <span class="status-badge status-confirmed">
                                ✅ PAGADO
                              </span>
                            </td>
                          </tr>
                        `
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; margin-top: 30px;">
                <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 25px; border-radius: 16px; border: 1px solid #fca5a5;">
                  <h4 style="color: #dc2626; margin-bottom: 15px; font-weight: 700;">💸 Total Invertido</h4>
                  <div style="font-size: 28px; font-weight: 800; color: #991b1b;">
                    ${totalExpenses.toLocaleString("es-ES")}
                  </div>
                  <div style="font-size: 12px; color: #7f1d1d; margin-top: 5px;">
                    En ${expenses.length} transacciones
                  </div>
                </div>
                
                <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 16px; border: 1px solid #93c5fd;">
                  <h4 style="color: #1d4ed8; margin-bottom: 15px; font-weight: 700;">📊 Gasto Promedio</h4>
                  <div style="font-size: 28px; font-weight: 800; color: #1e3a8a;">
                    ${Math.round(totalExpenses / expenses.length).toLocaleString("es-ES")}
                  </div>
                  <div style="font-size: 12px; color: #1e3a8a; margin-top: 5px;">
                    Por transacción
                  </div>
                </div>
                
                <div style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); padding: 25px; border-radius: 16px; border: 1px solid #c4b5fd;">
                  <h4 style="color: #7c3aed; margin-bottom: 15px; font-weight: 700;">🏆 Categoría Principal</h4>
                  <div style="font-size: 18px; font-weight: 800; color: #5b21b6; text-transform: uppercase;">
                    ${Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a)[0][0]}
                  </div>
                  <div style="font-size: 12px; color: #5b21b6; margin-top: 5px;">
                    ${((Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a)[0][1] / totalExpenses) * 100).toFixed(1)}% del total
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    }

    // FOOTER PREMIUM
    htmlContent += `
        <div class="premium-footer">
          <h3>🔒 DOCUMENTO CONFIDENCIAL PREMIUM</h3>
          <p><strong>Este reporte contiene información sensible y debe ser manejado con máxima confidencialidad.</strong></p>
          <p>📊 Generado por el Sistema Avanzado de Gestión de Inscripciones</p>
          <p>🕒 Fecha de generación: ${currentDate}</p>
          <p>🔐 Todos los datos están protegidos bajo estrictas políticas de privacidad</p>
          <p style="margin-top: 15px; font-size: 11px; opacity: 0.7;">
            © ${new Date().getFullYear()} - Sistema Premium de Gestión • Todos los derechos reservados
          </p>
        </div>
        </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `reporte-premium-completo-${new Date().toISOString().split("T")[0]}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setIsOpen(false)
  }

  const hasData = confirmedRegistrations.length > 0 || pendingRegistrations.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 text-sm h-10 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-emerald-200 text-emerald-700 hover:text-emerald-800 font-semibold"
          disabled={!hasData}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span className="hidden sm:inline">Excel Premium</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-lg mx-auto bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500">
              <FileSpreadsheet className="h-5 w-5 text-white" />
            </div>
            Exportar Reporte Premium a Excel
          </DialogTitle>
          <DialogDescription className="text-base">
            Genera un archivo Excel profesional con 3 hojas completamente personalizadas: 
            <strong className="text-blue-600">Dashboard</strong>, 
            <strong className="text-green-600">Inscripciones</strong> y 
            <strong className="text-amber-600">Gastos</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sección Dashboard */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-base flex items-center gap-3 mb-3">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              📊 Dashboard Ejecutivo
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 font-semibold">
                Métricas Premium
              </Badge>
            </h4>
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="dashboard" 
                checked={includeDashboard} 
                onCheckedChange={setIncludeDashboard}
                className="border-purple-300 data-[state=checked]:bg-purple-600"
              />
              <label htmlFor="dashboard" className="text-sm font-medium">
                Incluir estadísticas generales, métricas y análisis demográfico
              </label>
            </div>
          </div>

          {/* Sección Inscripciones */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-base flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-green-600" />
              📋 Registro de Participantes
              <Badge variant="secondary" className="bg-green-100 text-green-800 font-semibold">
                {stats.validRegistrations} válidas
              </Badge>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="confirmed" 
                    checked={includeConfirmed} 
                    onCheckedChange={setIncludeConfirmed}
                    className="border-green-300 data-[state=checked]:bg-green-600"
                  />
                  <label htmlFor="confirmed" className="text-sm font-medium">
                    ✅ Participantes Confirmados
                  </label>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 font-bold">
                  {confirmedRegistrations.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="pending" 
                    checked={includePending} 
                    onCheckedChange={setIncludePending}
                    className="border-yellow-300 data-[state=checked]:bg-yellow-500"
                  />
                  <label htmlFor="pending" className="text-sm font-medium">
                    ⏳ Participantes Pendientes
                  </label>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 font-bold">
                  {pendingRegistrations.length}
                </Badge>
              </div>
            </div>
          </div>

          {/* Sección Gastos */}
          {expenses.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-base flex items-center gap-3 mb-3">
                <DollarSign className="h-5 w-5 text-amber-600" />
                💰 Gestión Financiera
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 font-semibold">
                  {expenses.length} transacciones
                </Badge>
              </h4>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="expenses" 
                  checked={includeExpenses} 
                  onCheckedChange={setIncludeExpenses}
                  className="border-amber-300 data-[state=checked]:bg-amber-600"
                />
                <label htmlFor="expenses" className="text-sm font-medium">
                  Incluir análisis completo de gastos y categorías
                </label>
              </div>
            </div>
          )}

          {/* Opciones Avanzadas */}
          <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-base flex items-center gap-3 mb-3">
              <Settings className="h-5 w-5 text-slate-600" />
              ⚙️ Configuración Avanzada
            </h4>
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="advanced" 
                checked={includeAdvancedStyles} 
                onCheckedChange={setIncludeAdvancedStyles}
                className="border-slate-300 data-[state=checked]:bg-slate-600"
              />
              <label htmlFor="advanced" className="text-sm font-medium">
                <Palette className="h-4 w-4 inline mr-1" />
                Aplicar diseño premium con colores y filtros avanzados
              </label>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)} 
              className="flex-1 font-semibold"
            >
              Cancelar
            </Button>
            <Button
              onClick={exportToExcel}
              disabled={!includeConfirmed && !includePending}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Download className="h-4 w-4 mr-2" />
              <RefreshCw className="h-4 w-4 mr-1" />
              Generar Excel Premium
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}