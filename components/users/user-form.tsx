"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { User, UserFormData, UserRole } from "@/types/users"
import { ROLE_DESCRIPTIONS } from "@/types/users"
import { createUser, updateUser } from "@/app/actions/users"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface UserFormProps {
  user?: User
  isEditing?: boolean
  onClose?: () => void
  onSuccess?: () => void
}

export function UserForm({ user, isEditing = false, onClose, onSuccess }: UserFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<UserFormData>({
    id: user?.id,
    username: user?.username || "",
    email: user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    role: user?.role || "operador",
    password: "",
    confirmPassword: "",
    isActive: user?.isActive ?? true,
  })

  const [passwordError, setPasswordError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Limpiar error de contraseña si se está modificando alguno de los campos de contraseña
    if (name === "password" || name === "confirmPassword") {
      setPasswordError("")
    }
  }

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value as UserRole }))
  }

  const handleActiveChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }))
  }

  const validateForm = (): boolean => {
    // Validar que las contraseñas coincidan si se está creando un usuario o si se está cambiando la contraseña
    if (!isEditing || (isEditing && formData.password)) {
      if (formData.password !== formData.confirmPassword) {
        setPasswordError("Las contraseñas no coinciden")
        return false
      }

      if (!isEditing && (!formData.password || formData.password.length < 6)) {
        setPasswordError("La contraseña debe tener al menos 6 caracteres")
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    const formDataObj = new FormData()
    if (isEditing && user?.id) {
      formDataObj.append("id", user.id.toString())
    }
    formDataObj.append("username", formData.username)
    formDataObj.append("email", formData.email)
    formDataObj.append("firstName", formData.firstName)
    formDataObj.append("lastName", formData.lastName)
    formDataObj.append("role", formData.role)
    formDataObj.append("isActive", formData.isActive.toString())

    if (formData.password) {
      formDataObj.append("password", formData.password)
      formDataObj.append("confirmPassword", formData.confirmPassword || "")
    }

    try {
      const result = isEditing ? await updateUser(formDataObj) : await createUser(formDataObj)

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
          <Label htmlFor="username">Nombre de Usuario</Label>
          <Input
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Ej: usuario1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Ej: usuario@ejemplo.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName">Nombre</Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            placeholder="Ej: Juan"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido</Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            placeholder="Ej: Pérez"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <Select value={formData.role} onValueChange={handleRoleChange}>
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
          <p className="text-xs text-gray-500">{ROLE_DESCRIPTIONS[formData.role]}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Estado de la Cuenta</Label>
            <Switch id="isActive" checked={formData.isActive} onCheckedChange={handleActiveChange} />
          </div>
          <p className="text-xs text-gray-500">
            {formData.isActive ? "Usuario activo en el sistema" : "Usuario desactivado"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            {isEditing ? "Nueva Contraseña (dejar en blanco para mantener)" : "Contraseña"}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required={!isEditing}
            placeholder={isEditing ? "••••••••" : "Mínimo 6 caracteres"}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required={!isEditing || !!formData.password}
            placeholder="••••••••"
          />
          {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose || (() => router.push("/dashboard/users"))}
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
