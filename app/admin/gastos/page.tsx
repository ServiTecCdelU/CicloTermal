"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { db } from "@/lib/firebase/firebase-config"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore"
import {
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calculator,
  Home,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Receipt,
  CreditCard,
  Banknote,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface Expense {
  id: string
  concepto: string
  monto: number
  categoria: string
  fecha: Date
  descripcion?: string
  pagadoPor?: string
}

interface Registration {
  id: string
  precio?: string
  transfirio_a?: string
  [key: string]: any
}

const EXPENSE_CATEGORIES = [
  "Logística",
  "Alimentación",
  "Premios",
  "Marketing",
  "Equipamiento",
  "Servicios",
  "Transporte",
  "Otros",
]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    concepto: "",
    monto: "",
    categoria: "",
    descripcion: "",
    pagadoPor: "",
  })

  // Financial calculations
  const totalIncome = registrations.reduce((total, reg) => {
    const precio = reg.precio || "0"
    const amount = precio.replace(/[$.,]/g, "")
    return total + (Number.parseInt(amount) || 0)
  }, 0)

  const giseIncome = registrations
    .filter((reg) => reg.transfirio_a === "Gise")
    .reduce((total, reg) => {
      const precio = reg.precio || "0"
      const amount = precio.replace(/[$.,]/g, "")
      return total + (Number.parseInt(amount) || 0)
    }, 0)

  const bruniIncome = registrations
    .filter((reg) => reg.transfirio_a === "Bruni")
    .reduce((total, reg) => {
      const precio = reg.precio || "0"
      const amount = precio.replace(/[$.,]/g, "")
      return total + (Number.parseInt(amount) || 0)
    }, 0)

  const totalExpenses = expenses.reduce((total, expense) => total + expense.monto, 0)
  const remainingMoney = totalIncome - totalExpenses
  const expensePercentage = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0

  const fetchData = async () => {
    try {
      // Fetch expenses
      const expensesRef = collection(db, "gastos2025")
      const expensesSnapshot = await getDocs(expensesRef)
      const expensesData: Expense[] = expensesSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          fecha: data.fecha?.toDate() || new Date(),
        }
      })
      setExpenses(expensesData.sort((a, b) => b.fecha.getTime() - a.fecha.getTime()))

      // Fetch registrations for income calculation
      const registrationsRef = collection(db, "participantes2025")
      const currentYearRegistrations = query(registrationsRef, where("year", "==", new Date().getFullYear()))
      const registrationsSnapshot = await getDocs(currentYearRegistrations)
      const registrationsData: Registration[] = registrationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setRegistrations(registrationsData.filter((reg) => reg.estado !== "rechazado"))
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.concepto || !formData.monto || !formData.categoria) {
      return
    }

    try {
      const expenseData = {
        concepto: formData.concepto,
        monto: Number.parseFloat(formData.monto),
        categoria: formData.categoria,
        descripcion: formData.descripcion,
        pagadoPor: formData.pagadoPor,
        fecha: new Date(),
      }

      if (editingExpense) {
        // Update existing expense
        await updateDoc(doc(db, "gastos2025", editingExpense.id), expenseData)
        setIsEditModalOpen(false)
        setEditingExpense(null)
      } else {
        // Add new expense
        await addDoc(collection(db, "gastos2025"), expenseData)
        setIsAddModalOpen(false)
      }

      // Reset form
      setFormData({
        concepto: "",
        monto: "",
        categoria: "",
        descripcion: "",
        pagadoPor: "",
      })

      // Refresh data
      fetchData()
    } catch (error) {
      console.error("Error saving expense:", error)
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      concepto: expense.concepto,
      monto: expense.monto.toString(),
      categoria: expense.categoria,
      descripcion: expense.descripcion || "",
      pagadoPor: expense.pagadoPor || "",
    })
    setIsEditModalOpen(true)
  }

  const handleDelete = async (expenseId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este gasto?")) {
      try {
        await deleteDoc(doc(db, "gastos2025", expenseId))
        fetchData()
      } catch (error) {
        console.error("Error deleting expense:", error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      concepto: "",
      monto: "",
      categoria: "",
      descripcion: "",
      pagadoPor: "",
    })
    setEditingExpense(null)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Logística: "bg-blue-100 text-blue-800",
      Alimentación: "bg-green-100 text-green-800",
      Premios: "bg-yellow-100 text-yellow-800",
      Marketing: "bg-purple-100 text-purple-800",
      Equipamiento: "bg-red-100 text-red-800",
      Servicios: "bg-indigo-100 text-indigo-800",
      Transporte: "bg-orange-100 text-orange-800",
      Otros: "bg-gray-100 text-gray-800",
    }
    return colors[category] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-3"></div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col gap-3 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Gestión de Gastos
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Control financiero {new Date().getFullYear()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/dashboard" className="flex-1">
              <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm bg-transparent">
                <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Volver al Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Button>
            </Link>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Agregar Gasto</span>
                  <span className="sm:hidden">Agregar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg">Agregar Nuevo Gasto</DialogTitle>
                  <DialogDescription className="text-sm">Registra un nuevo gasto para el evento</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <Label htmlFor="concepto" className="text-sm">Concepto *</Label>
                    <Input
                      id="concepto"
                      value={formData.concepto}
                      onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                      placeholder="Ej: Compra de premios"
                      className="text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="monto" className="text-sm">Monto *</Label>
                    <Input
                      id="monto"
                      type="number"
                      value={formData.monto}
                      onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                      placeholder="0"
                      className="text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoria" className="text-sm">Categoría *</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category} className="text-sm">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="pagadoPor" className="text-sm">Pagado por</Label>
                    <Select
                      value={formData.pagadoPor}
                      onValueChange={(value) => setFormData({ ...formData, pagadoPor: value })}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="¿Quién pagó?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gise" className="text-sm">Gise</SelectItem>
                        <SelectItem value="Bruni" className="text-sm">Bruni</SelectItem>
                        <SelectItem value="Ambos" className="text-sm">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="descripcion" className="text-sm">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Detalles adicionales (opcional)"
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex gap-2 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddModalOpen(false)
                        resetForm()
                      }}
                      className="flex-1 text-sm"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1 text-sm">
                      <Save className="h-3 w-3 mr-1" />
                      Guardar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Financial Summary Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 py-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-green-800">Ingresos</CardTitle>
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              </CardHeader>
              <CardContent className="px-3 py-2">
                <div className="text-lg sm:text-2xl font-bold text-green-900">${(totalIncome).toFixed(0)}</div>
                <div className="text-[10px] sm:text-xs text-green-700 mt-1">
                  G: ${(giseIncome / 1000).toFixed(0)}k | B: ${(bruniIncome).toFixed(0)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 py-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-red-800">Gastos</CardTitle>
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
              </CardHeader>
              <CardContent className="px-3 py-2">
                <div className="text-lg sm:text-2xl font-bold text-red-900">${(totalExpenses).toFixed(0)}</div>
                <div className="text-[10px] sm:text-xs text-red-700 mt-1">{expenses.length} gastos</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card
              className={`border-${remainingMoney >= 0 ? "blue" : "orange"}-200 bg-gradient-to-br from-${remainingMoney >= 0 ? "blue" : "orange"}-50 to-${remainingMoney >= 0 ? "blue" : "orange"}-100`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 py-2">
                <CardTitle className={`text-xs sm:text-sm font-medium text-${remainingMoney >= 0 ? "blue" : "orange"}-800`}>
                  {remainingMoney >= 0 ? "Disponible" : "Déficit"}
                </CardTitle>
                {remainingMoney >= 0 ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                ) : (
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                )}
              </CardHeader>
              <CardContent className="px-3 py-2">
                <div className={`text-lg sm:text-2xl font-bold text-${remainingMoney >= 0 ? "blue" : "orange"}-900`}>
                  ${Math.abs(remainingMoney).toLocaleString()}
                </div>
                <div className={`text-[10px] sm:text-xs text-${remainingMoney >= 0 ? "blue" : "orange"}-700 mt-1`}>
                  {remainingMoney >= 0 ? "Sobra" : "Falta"}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 py-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-purple-800">% Gastado</CardTitle>
                <Calculator className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
              </CardHeader>
              <CardContent className="px-3 py-2">
                <div className="text-lg sm:text-2xl font-bold text-purple-900">{expensePercentage}%</div>
                <div className="mt-1">
                  <Progress
                    value={expensePercentage}
                    className="h-1 sm:h-2"
                    indicatorClassName="bg-gradient-to-r from-purple-500 to-purple-600"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Expenses List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader className="px-3 py-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
                Lista de Gastos
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Todos los gastos del evento</CardDescription>
            </CardHeader>
            <CardContent className="px-3 py-3">
              {expenses.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-3 text-sm">No hay gastos registrados</p>
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-sm"
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Agregar Primer Gasto
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{expense.concepto}</h3>
                          <Badge className={`${getCategoryColor(expense.categoria)} text-xs px-2 py-0`}>{expense.categoria}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 flex-wrap">
                          <span className="flex items-center gap-1 font-medium">
                            <Banknote className="h-3 w-3" />${expense.monto.toLocaleString()}
                          </span>
                          <span>{expense.fecha.toLocaleDateString()}</span>
                          {expense.pagadoPor && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {expense.pagadoPor}
                            </Badge>
                          )}
                        </div>
                        {expense.descripcion && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{expense.descripcion}</p>}
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(expense)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 sm:p-2"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 sm:p-2"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">Editar Gasto</DialogTitle>
              <DialogDescription className="text-sm">Modifica los detalles del gasto</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="edit-concepto" className="text-sm">Concepto *</Label>
                <Input
                  id="edit-concepto"
                  value={formData.concepto}
                  onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                  placeholder="Ej: Compra de premios"
                  className="text-sm"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-monto" className="text-sm">Monto *</Label>
                <Input
                  id="edit-monto"
                  type="number"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  placeholder="0"
                  className="text-sm"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-categoria" className="text-sm">Categoría *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category} className="text-sm">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-pagadoPor" className="text-sm">Pagado por</Label>
                <Select
                  value={formData.pagadoPor}
                  onValueChange={(value) => setFormData({ ...formData, pagadoPor: value })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="¿Quién pagó?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gise" className="text-sm">Gise</SelectItem>
                    <SelectItem value="Bruni" className="text-sm">Bruni</SelectItem>
                    <SelectItem value="Ambos" className="text-sm">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-descripcion" className="text-sm">Descripción</Label>
                <Textarea
                  id="edit-descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Detalles adicionales (opcional)"
                  rows={2}
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    resetForm()
                  }}
                  className="flex-1 text-sm"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 text-sm">
                  <Save className="h-3 w-3 mr-1" />
                  Guardar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}