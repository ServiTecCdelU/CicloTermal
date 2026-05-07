"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase/firebase-config"
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs } from "firebase/firestore"
import { Trash2, Plus, ArrowUp, ArrowDown, Loader2 } from "lucide-react"

export default function FormEditor() {
  const { toast } = useToast()
  const [formFields, setFormFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchFormFields = async () => {
      try {
        const formFieldsRef = collection(db, "formFields")
        const snapshot = await getDocs(formFieldsRef)
        const fields = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        // Sort by order
        fields.sort((a, b) => a.order - b.order)

        setFormFields(fields)
      } catch (error) {
        console.error("Error fetching form fields:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFormFields()
  }, [])

  const handleAddField = () => {
    setFormFields([
      ...formFields,
      {
        id: `temp-${Date.now()}`,
        label: "Nuevo campo",
        type: "text",
        required: false,
        order: formFields.length,
        options: [],
        isNew: true,
      },
    ])
  }

  const handleRemoveField = async (index, field) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este campo?")) {
      return
    }

    try {
      if (!field.isNew && field.id) {
        // Delete from Firestore
        await deleteDoc(doc(db, "formFields", field.id))
      }

      const newFields = [...formFields]
      newFields.splice(index, 1)

      // Update order for remaining fields
      const updatedFields = newFields.map((f, i) => ({
        ...f,
        order: i,
      }))

      setFormFields(updatedFields)

      toast({
        title: "Campo eliminado",
        description: "El campo ha sido eliminado correctamente",
      })
    } catch (error) {
      console.error("Error removing field:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el campo",
        variant: "destructive",
      })
    }
  }

  const handleMoveField = (index, direction) => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === formFields.length - 1)) {
      return
    }

    const newFields = [...formFields]
    const newIndex = direction === "up" ? index - 1 : index + 1

    // Swap fields
    const temp = newFields[index]
    newFields[index] = newFields[newIndex]
    newFields[newIndex] = temp

    // Update order
    const updatedFields = newFields.map((field, i) => ({
      ...field,
      order: i,
    }))

    setFormFields(updatedFields)
  }

  const handleInputChange = (index, field, value) => {
    const newFields = [...formFields]
    newFields[index] = {
      ...newFields[index],
      [field]: value,
    }
    setFormFields(newFields)
  }

  const handleSwitchChange = (index, checked) => {
    const newFields = [...formFields]
    newFields[index] = {
      ...newFields[index],
      required: checked,
    }
    setFormFields(newFields)
  }

  const handleTypeChange = (index, value) => {
    const newFields = [...formFields]
    newFields[index] = {
      ...newFields[index],
      type: value,
      // Initialize options array if type is select
      options: value === "select" ? [{ label: "Opción 1", value: "opcion-1" }] : [],
    }
    setFormFields(newFields)
  }

  const handleAddOption = (index) => {
    const newFields = [...formFields]
    const field = newFields[index]

    if (!field.options) {
      field.options = []
    }

    field.options.push({
      label: `Opción ${field.options.length + 1}`,
      value: `opcion-${field.options.length + 1}`,
    })

    setFormFields(newFields)
  }

  const handleRemoveOption = (fieldIndex, optionIndex) => {
    const newFields = [...formFields]
    newFields[fieldIndex].options.splice(optionIndex, 1)
    setFormFields(newFields)
  }

  const handleOptionChange = (fieldIndex, optionIndex, field, value) => {
    const newFields = [...formFields]
    newFields[fieldIndex].options[optionIndex] = {
      ...newFields[fieldIndex].options[optionIndex],
      [field]: value,
    }
    setFormFields(newFields)
  }

  const saveChanges = async () => {
    setSaving(true)
    try {
      for (const field of formFields) {
        const fieldData = {
          label: field.label,
          type: field.type,
          required: field.required,
          order: field.order,
          options: field.options || [],
        }

        if (field.isNew) {
          // Add new field
          await addDoc(collection(db, "formFields"), fieldData)
        } else {
          // Update existing field
          await updateDoc(doc(db, "formFields", field.id), fieldData)
        }
      }

      toast({
        title: "Cambios guardados",
        description: "Los campos del formulario han sido actualizados correctamente",
      })

      // Refresh form fields
      const formFieldsRef = collection(db, "formFields")
      const snapshot = await getDocs(formFieldsRef)
      const fields = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      // Sort by order
      fields.sort((a, b) => a.order - b.order)

      setFormFields(fields)
    } catch (error) {
      console.error("Error saving form fields:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Campos personalizados del formulario</h3>
        <Button onClick={handleAddField} className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          Agregar campo
        </Button>
      </div>

      <div className="space-y-2 p-4 bg-amber-50 rounded-md">
        <p className="text-amber-800 font-medium">Nota importante</p>
        <p className="text-amber-700 text-sm">
          Los campos básicos como Nombre, Apellido, DNI, etc. ya están incluidos en el formulario por defecto. Aquí
          puedes agregar campos adicionales según tus necesidades.
        </p>
      </div>

      {formFields.length === 0 ? (
        <div className="text-center py-8 bg-muted rounded-lg">
          <p className="text-muted-foreground">No hay campos personalizados configurados</p>
          <Button onClick={handleAddField} variant="outline" className="mt-4">
            Agregar primer campo
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {formFields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Campo {index + 1}</h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveField(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveField(index, "down")}
                    disabled={index === formFields.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveField(index, field)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`label-${index}`}>Etiqueta</Label>
                  <Input
                    id={`label-${index}`}
                    value={field.label}
                    onChange={(e) => handleInputChange(index, "label", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`type-${index}`}>Tipo de campo</Label>
                  <Select value={field.type} onValueChange={(value) => handleTypeChange(index, value)}>
                    <SelectTrigger id={`type-${index}`}>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="select">Selección</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id={`required-${index}`}
                  checked={field.required}
                  onCheckedChange={(checked) => handleSwitchChange(index, checked)}
                />
                <Label htmlFor={`required-${index}`}>Campo obligatorio</Label>
              </div>

              {field.type === "select" && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <h5 className="text-sm font-medium">Opciones</h5>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddOption(index)}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Agregar opción
                    </Button>
                  </div>

                  {field.options && field.options.length > 0 ? (
                    <div className="space-y-2">
                      {field.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <div className="flex-1">
                            <Input
                              value={option.label}
                              onChange={(e) => handleOptionChange(index, optionIndex, "label", e.target.value)}
                              placeholder="Etiqueta"
                              size="sm"
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              value={option.value}
                              onChange={(e) => handleOptionChange(index, optionIndex, "value", e.target.value)}
                              placeholder="Valor"
                              size="sm"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveOption(index, optionIndex)}
                            disabled={field.options.length <= 1}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay opciones configuradas</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={saveChanges} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </div>
  )
}
