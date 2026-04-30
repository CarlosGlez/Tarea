import type { Carrera, PlanEstudio, Alumno } from "../types/Carrera"
import { authHeaders, API_BASE } from "./api"

const API_URL = `${API_BASE}/api`

export interface CreateCarreraPayload {
  nombre: string
  abreviatura: string
}

export interface MateriaCatalogo {
  id: number
  codigo: string
  nombre: string
  creditos: number
  tipo_bloque: string
  modalidad: string
}

export interface PlanMateriaAsignada extends MateriaCatalogo {
  plan_id: number
  materia_id: number
  semestre: number
}

export interface CreatePlanPayload {
  nombre: string
}

export interface SavePlanMateriasPayload {
  materias: Array<{
    materia_id: number
    semestre: number
  }>
}

export interface CreateMateriaPayload {
  nombre: string
  tipo_bloque: string
  creditos: number
  modalidad?: string
}

const parseCarreraError = async (response: Response) => {
  const errorData = await response.json().catch(() => null)
  throw new Error(errorData?.message || "No se pudo completar la operación con la carrera")
}

export const getCarreras = async (): Promise<Carrera[]> => {
  const response = await fetch(`${API_URL}/carreras`, { headers: authHeaders() })
  return await response.json()
}

export const createCarrera = async (payload: CreateCarreraPayload): Promise<Carrera> => {
  const response = await fetch(`${API_URL}/carreras`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  })
  if (!response.ok) await parseCarreraError(response)
  return await response.json()
}

export const updateCarrera = async (id: number, payload: CreateCarreraPayload): Promise<Carrera> => {
  const response = await fetch(`${API_URL}/carreras/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  })
  if (!response.ok) await parseCarreraError(response)
  return await response.json()
}

export const deleteCarrera = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/carreras/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  if (!response.ok) await parseCarreraError(response)
}

export const getPlanesByCarrera = async (carreraId: number): Promise<PlanEstudio[]> => {
  const response = await fetch(`${API_URL}/carreras/planes?carrera_id=${carreraId}`, { headers: authHeaders() })
  return await response.json()
}

export const getPlanesByCarreraId = async (carreraId: number): Promise<PlanEstudio[]> => {
  const response = await fetch(`${API_URL}/carreras/${carreraId}/planes`, { headers: authHeaders() })
  if (!response.ok) await parseCarreraError(response)
  return await response.json()
}

export const createPlanByCarrera = async (carreraId: number, payload: CreatePlanPayload): Promise<PlanEstudio> => {
  const response = await fetch(`${API_URL}/carreras/${carreraId}/planes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  })
  if (!response.ok) await parseCarreraError(response)
  return await response.json()
}

export const getMateriasCatalogo = async (): Promise<MateriaCatalogo[]> => {
  const response = await fetch(`${API_URL}/carreras/materias-catalogo`, { headers: authHeaders() })
  if (!response.ok) await parseCarreraError(response)
  return await response.json()
}

export const getPlanMaterias = async (planId: number): Promise<PlanMateriaAsignada[]> => {
  const response = await fetch(`${API_URL}/carreras/planes/${planId}/materias`, { headers: authHeaders() })
  if (!response.ok) await parseCarreraError(response)
  return await response.json()
}

export const savePlanMaterias = async (planId: number, payload: SavePlanMateriasPayload): Promise<void> => {
  const response = await fetch(`${API_URL}/carreras/planes/${planId}/materias`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  })
  if (!response.ok) await parseCarreraError(response)
}

export const createMateria = async (payload: CreateMateriaPayload): Promise<MateriaCatalogo> => {
  const response = await fetch(`${API_URL}/carreras/materias-catalogo`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  })
  if (!response.ok) await parseCarreraError(response)
  return await response.json()
}

export const getAlumnosByCarrera = async (carreraId: number): Promise<Alumno[]> => {
  const response = await fetch(`${API_URL}/carreras/alumnos?carrera_id=${carreraId}`, { headers: authHeaders() })
  return await response.json()
}