import type { Usuario } from "../types/Usuario"

const API_URL = "http://localhost:3000/api/usuarios"

// interfaz para los datos extendidos que devuelve el endpoint alumno-datos
export interface AlumnoDatos extends Usuario {
  matricula?: string
  numero_telefono?: string
  numero_identificacion?: string
  fecha_nacimiento?: string | null
  escuela_procedencia?: string
  generacion?: string
  estatus_academico?: string
}

export const getUsuarios = async (): Promise<Usuario[]> => {
  const response = await fetch(API_URL)
  return await response.json()
}

export const createUsuario = async (usuario: (Omit<Usuario, 'id' | 'fecha_creacion'> & { contrasena: string }) | any): Promise<{ id: number }> => {
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

// Obtener datos personales del alumno
export const getAlumnoDatos = async (id: number): Promise<AlumnoDatos> => {
  const response = await fetch(`${API_URL}/${id}/alumno-datos`)
  if (!response.ok) throw new Error('Error fetching alumno datos')
  return await response.json()
}

// Actualizar datos personales del alumno
export const updateAlumnoDatos = async (id: number, datos: any): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}/alumno-datos`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  })
  if (!response.ok) throw new Error('Error updating alumno datos')
}

// Obtener datos personales del coordinador
export const getCoordinadorDatos = async (id: number): Promise<any> => {
  const response = await fetch(`${API_URL}/${id}/coordinador-datos`)
  if (!response.ok) throw new Error('Error fetching coordinador datos')
  return await response.json()
}

// Actualizar datos personales del coordinador
export const updateCoordinadorDatos = async (id: number, datos: any): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}/coordinador-datos`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  })
  if (!response.ok) throw new Error('Error updating coordinador datos')
}
