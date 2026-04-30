import type { Usuario } from "../types/Usuario"
import { authHeaders, API_BASE } from "./api"

const API_URL = `${API_BASE}/api/usuarios`

// interfaz para los datos extendidos que devuelve el endpoint alumno-datos
export interface AlumnoDatos extends Usuario {
  matricula?: string
  imagen_url?: string
  numero_telefono?: string
  numero_identificacion?: string
  fecha_nacimiento?: string | null
  fecha_alta?: string | null
  escuela_procedencia?: string
  generacion?: string
  estatus_academico?: string
  carrera_nombre?: string
  plan_estudios?: string
}

export const getUsuarios = async (): Promise<Usuario[]> => {
  const response = await fetch(API_URL, { headers: authHeaders() })
  return await response.json()
}

export const createUsuario = async (usuario: (Omit<Usuario, 'id' | 'fecha_creacion'> & { contrasena: string }) | any): Promise<{ id: number }> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(usuario),
  })
  return await response.json()
}

export const updateUsuario = async (id: number, usuario: Partial<Omit<Usuario, 'id' | 'fecha_creacion'> & { contrasena?: string }>): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(usuario),
  })
  if (!response.ok) throw new Error('Error updating user')
}

export const deleteUsuario = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || 'Error deleting user')
  }
}

export const updateAlumnoPrograma = async (
  id: number,
  payload: { carrera_id: number; plan_id: number }
): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}/alumno-programa`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || 'Error updating alumno programa')
  }
}

export const getAlumnoDatos = async (id: number): Promise<AlumnoDatos> => {
  const response = await fetch(`${API_URL}/${id}/alumno-datos`, { headers: authHeaders() })
  if (!response.ok) throw new Error('Error fetching alumno datos')
  return await response.json()
}

export const updateAlumnoDatos = async (id: number, datos: any): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}/alumno-datos`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(datos),
  })
  if (!response.ok) throw new Error('Error updating alumno datos')
}

export const getCoordinadorDatos = async (id: number): Promise<any> => {
  const response = await fetch(`${API_URL}/${id}/coordinador-datos`, { headers: authHeaders() })
  if (!response.ok) throw new Error('Error fetching coordinador datos')
  return await response.json()
}

export const updateCoordinadorDatos = async (id: number, datos: any): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}/coordinador-datos`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(datos),
  })
  if (!response.ok) throw new Error('Error updating coordinador datos')
}
