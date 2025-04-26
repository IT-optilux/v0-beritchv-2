"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, ToggleLeft } from "lucide-react"
import type { User } from "@/types/users"
import { getUsers, deleteUser, toggleUserStatus } from "@/app/actions/users"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { UserForm } from "@/components/users/user-form"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers()
        setUsers(data)
        setFilteredUsers(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [toast])

  useEffect(() => {
    let result = users

    // Aplicar filtro de búsqueda
    if (searchQuery) {
      result = result.filter(
        (user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Aplicar filtro de rol
    if (roleFilter) {
      result = result.filter((user) => user.role === roleFilter)
    }

    // Aplicar filtro de estado
    if (statusFilter) {
      result = result.filter((user) => {
        if (statusFilter === "active") return user.isActive
        if (statusFilter === "inactive") return !user.isActive
        return true
      })
    }

    setFilteredUsers(result)
  }, [users, searchQuery, roleFilter, statusFilter])

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  const handleDelete = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleToggleStatus = async (user: User) => {
    setIsProcessing(true)
    try {
      const result = await toggleUserStatus(user.id)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })
        // Actualizar el usuario en la lista local
        setUsers(users.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)))
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
        description: "Ha ocurrido un error al cambiar el estado del usuario.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      const result = await deleteUser(selectedUser.id)

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })
        setUsers(users.filter((u) => u.id !== selectedUser.id))
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
        description: "Ha ocurrido un error al eliminar el usuario.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
    }
  }

  const refreshData = async () => {
    try {
      const data = await getUsers()
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos.",
        variant: "destructive",
      })
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "border-purple-500 bg-purple-50 text-purple-700"
      case "supervisor":
        return "border-blue-500 bg-blue-50 text-blue-700"
      case "tecnico":
        return "border-green-500 bg-green-50 text-green-700"
      case "operador":
        return "border-amber-500 bg-amber-50 text-amber-700"
      default:
        return "border-gray-500 bg-gray-50 text-gray-700"
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "supervisor":
        return "Supervisor"
      case "tecnico":
        return "Técnico"
      case "operador":
        return "Operador"
      case "invitado":
        return "Invitado"
      default:
        return role
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-optilab-blue">Gestión de Usuarios</h1>
        <Button className="bg-optilab-blue hover:bg-optilab-blue/90" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>Administre los usuarios y sus permisos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar usuarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="supervisor">Supervisor</option>
              <option value="tecnico">Técnico</option>
              <option value="operador">Operador</option>
              <option value="invitado">Invitado</option>
            </select>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-optilab-blue border-t-transparent"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Correo Electrónico</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {users.length === 0
                        ? "No hay usuarios registrados."
                        : "No se encontraron usuarios que coincidan con los filtros."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.isActive
                              ? "border-green-500 bg-green-50 text-green-700"
                              : "border-red-500 bg-red-50 text-red-700"
                          }
                        >
                          {user.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Nunca"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} className="h-8 w-8 p-0">
                            <Pencil className="h-4 w-4 text-optilab-blue" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(user)}
                            className="h-8 w-8 p-0"
                            disabled={isProcessing || user.id === 1}
                          >
                            <ToggleLeft className="h-4 w-4 text-amber-500" />
                            <span className="sr-only">Cambiar estado</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user)}
                            className="h-8 w-8 p-0"
                            disabled={user.id === 1}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal para agregar usuario */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Agregar Nuevo Usuario" size="lg">
        <UserForm onClose={() => setIsAddModalOpen(false)} onSuccess={refreshData} />
      </Modal>

      {/* Modal para editar usuario */}
      {selectedUser && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedUser(null)
          }}
          title="Editar Usuario"
          size="lg"
        >
          <UserForm
            user={selectedUser}
            isEditing
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedUser(null)
            }}
            onSuccess={refreshData}
          />
        </Modal>
      )}

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setSelectedUser(null)
        }}
        onConfirm={confirmDelete}
        title="Eliminar Usuario"
        message={`¿Está seguro que desea eliminar al usuario "${selectedUser?.username}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={isProcessing}
      />
    </div>
  )
}
