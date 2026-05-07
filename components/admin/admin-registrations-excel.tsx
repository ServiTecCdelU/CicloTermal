
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