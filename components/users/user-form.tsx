"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createUser, updateUser, changePassword } from "@/app/actions/users"
import { useToast } from "@/hooks/use-toast"

interface UserFormProps {
  user?: {
    uid: string
    email: string
    displayName: string
    role: string
    disabled: boolean
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export default function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(!user)

  const isEditMode = !!user

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)

      let result
      if (isEditMode) {
        result = await updateUser(formData)
      } else {
        result = await createUser(formData)
      }

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })
        if (onSuccess) onSuccess()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      if (user) {
        formData.append("uid", user.uid)
      }

      const result = await changePassword(formData)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })
        setShowPasswordForm(false)
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {isEditMode && <input type="hidden" name="uid" value={user.uid} />}

        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" name="email" type="email" defaultValue={user?.email || ""} required disabled={isEditMode} />
        </div>

        {!isEditMode && (
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required={!isEditMode} minLength={6} />
            <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="displayName">Nombre completo</Label>
          <Input id="displayName" name="displayName" defaultValue={user?.displayName || ""} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <Select name="role" defaultValue={user?.role || "invitado"} required>
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
          <p className="text-xs text-gray-500">
            <strong>Administrador:</strong> Acceso completo al sistema
            <br />
            <strong>Supervisor:</strong> Gestión de mantenimiento y reportes
            <br />
            <strong>Técnico:</strong> Registro de mantenimientos y uso
            <br />
            <strong>Operador:</strong> Registro de uso y consulta
            <br />
            <strong>Invitado:</strong> Solo consulta
          </p>
        </div>

        {isEditMode && (
          <div className="flex items-center space-x-2">
            <Switch id="disabled" name="disabled" defaultChecked={user?.disabled} />
            <Label htmlFor="disabled">Cuenta desactivada</Label>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : isEditMode ? "Actualizar usuario" : "Crear usuario"}
          </Button>
        </div>
      </form>

      {isEditMode && (
        <div className="border-t pt-4">
          {showPasswordForm ? (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <Input id="newPassword" name="password" type="password" required minLength={6} />
                <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowPasswordForm(false)} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Cambiando..." : "Cambiar contraseña"}
                </Button>
              </div>
            </form>
          ) : (
            <Button type="button" variant="outline" onClick={() => setShowPasswordForm(true)}>
              Cambiar contraseña
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
