"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import UserForm from "@/components/users/user-form"
import { getUsers, deleteUser } from "@/app/actions/users"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Search, Trash2, Edit, UserCog } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface User {
  uid: string
  email: string
  displayName: string
  role: string
  disabled: boolean
  creationTime?: string
  lastSignInTime?: string
}

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Verificar si el usuario es administrador
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch("/api/auth/check-admin")
        const data = await response.json()

        setIsAdmin(data.isAdmin)

        if (!data.isAdmin) {
          toast({
            title: "Acceso denegado",
            description: "No tienes permisos para acceder a esta página",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error al verificar permisos:", error)
        setIsAdmin(false)
      }
    }

    checkAdmin()
  }, [toast])

  // Cargar usuarios
  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const result = await getUsers()
      if (result.success) {
        setUsers(result.users || [])
        setFilteredUsers(result.users || [])
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudieron cargar los usuarios",
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

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    }
  }, [isAdmin])

  // Filtrar usuarios
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredUsers(
        users.filter(
          (user) =>
            user.displayName.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term) ||
            user.role.toLowerCase().includes(term),
        ),
      )
    }
  }, [searchTerm, users])

  // Manejar eliminación de usuario
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const formData = new FormData()
      formData.append("uid", selectedUser.uid)

      const result = await deleteUser(formData)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message || "Usuario eliminado correctamente",
        })
        loadUsers()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar el usuario",
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
      setShowDeleteDialog(false)
      setSelectedUser(null)
    }
  }

  // Renderizar badge de rol
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500">Administrador</Badge>
      case "supervisor":
        return <Badge className="bg-orange-500">Supervisor</Badge>
      case "tecnico":
        return <Badge className="bg-blue-500">Técnico</Badge>
      case "operador":
        return <Badge className="bg-green-500">Operador</Badge>
      default:
        return <Badge className="bg-gray-500">Invitado</Badge>
    }
  }

  // Si no es administrador, mostrar mensaje de acceso denegado
  if (!isAdmin && !isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <UserCog className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="mt-2 text-lg font-medium">Acceso denegado</h2>
              <p className="mt-1 text-sm text-gray-500">No tienes permisos para acceder a esta página.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestión de Usuarios</CardTitle>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar usuarios..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No se encontraron usuarios</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Correo</th>
                    <th className="px-4 py-3 text-left">Rol</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{user.displayName}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">{renderRoleBadge(user.role)}</td>
                      <td className="px-4 py-3">
                        {user.disabled ? (
                          <Badge variant="outline" className="text-red-500 border-red-500">
                            Desactivado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-500 border-green-500">
                            Activo
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowEditModal(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para crear usuario */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Crear nuevo usuario">
        <UserForm
          onSuccess={() => {
            setShowCreateModal(false)
            loadUsers()
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Modal para editar usuario */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar usuario">
        {selectedUser && (
          <UserForm
            user={selectedUser}
            onSuccess={() => {
              setShowEditModal(false)
              loadUsers()
              setSelectedUser(null)
            }}
            onCancel={() => {
              setShowEditModal(false)
              setSelectedUser(null)
            }}
          />
        )}
      </Modal>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setSelectedUser(null)
        }}
        onConfirm={handleDeleteUser}
        title="Eliminar usuario"
        description={`¿Estás seguro de que deseas eliminar al usuario ${selectedUser?.displayName}? Esta acción no se puede deshacer.`}
      />
    </div>
  )
}
