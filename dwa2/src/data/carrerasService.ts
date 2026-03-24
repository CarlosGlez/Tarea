import type { Carrera, PlanEstudio, Alumno } from "../types/Carrera"

const API_URL = "http://localhost:3000/api"

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

const parseCarreraError = async (response: Response) => {
  const errorData = await response.json().catch(() => null)
  throw new Error(errorData?.message || "No se pudo completar la operación con la carrera")
}

export const getCarreras = async (): Promise<Carrera[]> => {
  const response = await fetch(`${API_URL}/carreras`)
  return await response.json()
}

export const createCarrera = async (payload: CreateCarreraPayload): Promise<Carrera> => {
  const response = await fetch(`${API_URL}/carreras`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    await parseCarreraError(response)
  }

  return await response.json()
}

export const updateCarrera = async (id: number, payload: CreateCarreraPayload): Promise<Carrera> => {
  const response = await fetch(`${API_URL}/carreras/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    await parseCarreraError(response)
  }

  return await response.json()
}

export const deleteCarrera = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/carreras/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    await parseCarreraError(response)
  }
}

export const getPlanesByCarrera = async (carreraId: number): Promise<PlanEstudio[]> => {
  const response = await fetch(`${API_URL}/carreras/planes?carrera_id=${carreraId}`)
  return await response.json()
}

export const getPlanesByCarreraId = async (carreraId: number): Promise<PlanEstudio[]> => {
  const response = await fetch(`${API_URL}/carreras/${carreraId}/planes`)

  if (!response.ok) {
    await parseCarreraError(response)
  }

  return await response.json()
}

export const createPlanByCarrera = async (carreraId: number, payload: CreatePlanPayload): Promise<PlanEstudio> => {
  const response = await fetch(`${API_URL}/carreras/${carreraId}/planes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    await parseCarreraError(response)
  }

  return await response.json()
}

export const getMateriasCatalogo = async (): Promise<MateriaCatalogo[]> => {
  const response = await fetch(`${API_URL}/carreras/materias-catalogo`)

  if (!response.ok) {
    await parseCarreraError(response)
  }

  return await response.json()
}

export const getPlanMaterias = async (planId: number): Promise<PlanMateriaAsignada[]> => {
  const response = await fetch(`${API_URL}/carreras/planes/${planId}/materias`)

  if (!response.ok) {
    await parseCarreraError(response)
  }

  return await response.json()
}

export const savePlanMaterias = async (planId: number, payload: SavePlanMateriasPayload): Promise<void> => {
  const response = await fetch(`${API_URL}/carreras/planes/${planId}/materias`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    await parseCarreraError(response)
  }
}

export const getAlumnosByCarrera = async (carreraId: number): Promise<Alumno[]> => {
  const response = await fetch(`${API_URL}/carreras/alumnos?carrera_id=${carreraId}`)
  return await response.json()
}