"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { UserFormData, UserRole } from "@/types/users"
import { ROLE_DESCRIPTIONS } from "@/types/users"
import { createUser, updateUser } from "@/app/actions/users"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface UserFormProps {
  user?: UserFormData
  isEditing?: boolean
  onClose?: () => void
  onSuccess?: () => void
}

export function UserForm({ user, isEditing = false, onClose, onSuccess }: UserFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<UserFormData>({
    email: user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    role: user?.role || "operador",
    isActive: user?.isActive ?? true,
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validar campos requeridos
    if (!formData.email) newErrors.email = "El correo electrónico es requerido"

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "El formato del correo electrónico no es válido"
    }

    // Validar contraseñas
    if (!isEditing && !formData.password) {
      newErrors.password = "La contraseña es requerida para nuevos usuarios"
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Limpiar error cuando el usuario comienza a escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Limpiar error cuando el usuario selecciona un valor
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Error de validación",
        description: "Por favor, corrija los errores en el formulario",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const formDataToSend = new FormData()
    if (isEditing && user?.uid) {
      formDataToSend.append("uid", user.uid)
    }
    formDataToSend.append("email", formData.email)
    formDataToSend.append("firstName", formData.firstName || "")
    formDataToSend.append("lastName", formData.lastName || "")
    formDataToSend.append("role", formData.role)
    formDataToSend.append("isActive", formData.isActive.toString())

    if (formData.password) {
      formDataToSend.append("password", formData.password)
    }

    try {
      const result = isEditing ? await updateUser(formDataToSend) : await createUser(formDataToSend)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })

        if (onSuccess) {
          onSuccess()
        }

        if (onClose) {
          onClose()
        } else {
          router.push("/dashboard/users")
        }
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al procesar la solicitud.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="usuario@ejemplo.com"
            disabled={isSubmitting || (isEditing && user?.uid === "admin")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-500">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <Select
            name="role"
            value={formData.role}
            onValueChange={(value) => handleSelectChange("role", value)}
            disabled={isSubmitting || (isEditing && user?.uid === "admin")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="tecnico">Técnico</SelectItem>
              <SelectItem value="operador">Operador</SelectItem>
              <SelectItem value="invitado">Invitado</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">{ROLE_DESCRIPTIONS[formData.role as UserRole]}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName">Nombre</Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Nombre"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido</Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Apellido"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex items-center space-x-2 pt-6">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => handleSwitchChange("isActive", checked)}
            disabled={isSubmitting || (isEditing && user?.uid === "admin")}
          />
          <Label htmlFor="isActive">Usuario Activo</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">{isEditing ? "Nueva Contraseña (opcional)" : "Contraseña"}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={isEditing ? "Dejar en blanco para mantener" : "Contraseña"}
            disabled={isSubmitting}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-red-500">
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirmar contraseña"
            disabled={isSubmitting || !formData.password}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
          />
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="text-sm text-red-500">
              {errors.confirmPassword}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (onClose) {
              onClose()
            } else {
              router.push("/dashboard/users")
            }
          }}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" className="bg-optilab-blue hover:bg-optilab-blue/90" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar Usuario" : "Crear Usuario"}
        </Button>
      </div>
    </form>
  )
}
