import type{ Usuario } from "../types/Usuario"

const API_URL = "http://localhost:3000/api/usuarios"

export const getUsuarios = async (): Promise<Usuario[]> => {
  const response = await fetch(API_URL)
  return await response.json()
}

export const createUsuario = async (usuario: Omit<Usuario, 'id' | 'fecha_creacion'> & { contrasena: string }): Promise<{ id: number }> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usuario)
  })
  return await response.json()
}

export const updateUsuario = async (id: number, usuario: Partial<Omit<Usuario, 'id' | 'fecha_creacion'> & { contrasena?: string }>): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usuario)
  })
  if (!response.ok) throw new Error('Error updating user')
}

export const deleteUsuario = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) throw new Error('Error deleting user')
}
