import type { Carrera, PlanEstudio, Alumno } from "../types/Carrera"

const API_URL = "http://localhost:3000/api"

export const getCarreras = async (): Promise<Carrera[]> => {
  const response = await fetch(`${API_URL}/carreras`)
  return await response.json()
}

export const getPlanesByCarrera = async (carreraId: number): Promise<PlanEstudio[]> => {
  const response = await fetch(`${API_URL}/carreras/planes?carrera_id=${carreraId}`)
  return await response.json()
}

export const getAlumnosByCarrera = async (carreraId: number): Promise<Alumno[]> => {
  const response = await fetch(`${API_URL}/carreras/alumnos?carrera_id=${carreraId}`)
  return await response.json()
}