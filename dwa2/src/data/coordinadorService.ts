import type { Alumno } from "../types/Carrera"
import type { MateriaCarrera } from "../types/MateriaCarrera"

interface Horario {
  id: number
  materia_id: number
  materia_nombre: string
  seccion: string
  profesor_nombre: string
  hora_inicio: string
  hora_fin: string
  aula: string
  dias: string
}

interface Estadisticas {
  totalAlumnos: number
  totalMaterias: number
  totalSecciones: number
  alumnosActivos: number
}

export interface ReporteInscripcionItem {
  nombre: string
  apellido: string
  matricula: string
  generacion: string | null
  periodo: string | null
  fecha_inscripcion: string
}

export interface ReporteRendimientoItem {
  nombre_usuario: string
  matricula: string
  materias_cursadas: number
  materias_aprobadas: number
  promedio: number | null
  estatus_academico: string
}

export interface ReporteDesercionItem {
  nombre: string
  apellido: string
  matricula: string
  generacion: string | null
  fecha_baja: string
  motivo: string | null
  anio_baja: number
  mes_baja: number
}

interface ReporteDesercionResumen {
  anio: number
  mes: number
  cantidad_bajas: number
}

export interface ReporteDesercion {
  lista: ReporteDesercionItem[]
  resumen: ReporteDesercionResumen[]
  total: number
}

export interface ReporteAprobacionItem {
  codigo: string
  nombre: string
  estudiantes_totales: number
  estudiantes_aprobados: number
  tasa_aprobacion: number | null
}

export type EstatusMateria = "aprobada" | "no_aprobada" | "no_cursada" | "revalidar" | "cursando"

export interface ActualizarAvanceMateriaPayload {
  estatus: EstatusMateria
  calificacion?: number | null
  periodo?: string | null
}

import { authHeaders, API_BASE } from "./api"

const API_URL = `${API_BASE}/api`

export const getAlumnosByCarrera = async (carreraId: number | null): Promise<Alumno[]> => {
  try {
    const url = carreraId ? `${API_URL}/coordinador/alumnos?carrera_id=${carreraId}` : `${API_URL}/coordinador/alumnos`
    const response = await fetch(url, { headers: authHeaders() })
    if (!response.ok) throw new Error("Error fetching alumnos")
    return await response.json()
  } catch (error) {
    console.error("Error en getAlumnosByCarrera:", error)
    return []
  }
}

export const getMateriasByCarrera = async (carreraId: number): Promise<MateriaCarrera[]> => {
  try {
    const response = await fetch(`${API_URL}/coordinador/materias?carrera_id=${carreraId}`, { headers: authHeaders() })
    if (!response.ok) throw new Error("Error fetching materias")
    return await response.json()
  } catch (error) {
    console.error("Error en getMateriasByCarrera:", error)
    return []
  }
}

export const getHorariosByCarrera = async (carreraId: number): Promise<Horario[]> => {
  try {
    const response = await fetch(`${API_URL}/coordinador/horarios?carrera_id=${carreraId}`, { headers: authHeaders() })
    if (!response.ok) throw new Error("Error fetching horarios")
    return await response.json()
  } catch (error) {
    console.error("Error en getHorariosByCarrera:", error)
    return []
  }
}

export const getEstadisticasByCarrera = async (carreraId: number): Promise<Estadisticas> => {
  try {
    const response = await fetch(`${API_URL}/coordinador/estadisticas?carrera_id=${carreraId}`, { headers: authHeaders() })
    if (!response.ok) throw new Error("Error fetching estadisticas")
    return await response.json()
  } catch (error) {
    console.error("Error en getEstadisticasByCarrera:", error)
    return { totalAlumnos: 0, totalMaterias: 0, totalSecciones: 0, alumnosActivos: 0 }
  }
}

export const getReporteInscripciones = async (
  carreraId: number,
  periodo?: string
): Promise<ReporteInscripcionItem[] | null> => {
  try {
    const params = new URLSearchParams({ carrera_id: carreraId.toString(), ...(periodo && { periodo }) })
    const response = await fetch(`${API_URL}/coordinador/reportes/inscripciones?${params}`, { headers: authHeaders() })
    if (!response.ok) throw new Error("Error fetching reporte")
    return await response.json()
  } catch (error) {
    console.error("Error en getReporteInscripciones:", error)
    return null
  }
}

export const getReporteRendimiento = async (
  carreraId: number,
  semestre?: string,
  periodo?: string
): Promise<ReporteRendimientoItem[] | null> => {
  try {
    const params = new URLSearchParams({ carrera_id: carreraId.toString(), ...(semestre && { semestre }), ...(periodo && { periodo }) })
    const response = await fetch(`${API_URL}/coordinador/reportes/rendimiento?${params}`, { headers: authHeaders() })
    if (!response.ok) throw new Error("Error fetching reporte")
    return await response.json()
  } catch (error) {
    console.error("Error en getReporteRendimiento:", error)
    return null
  }
}

export const getReporteDesercion = async (
  carreraId: number,
  anio?: string
): Promise<ReporteDesercion | null> => {
  try {
    const params = new URLSearchParams({ carrera_id: carreraId.toString(), ...(anio && { anio }) })
    const response = await fetch(`${API_URL}/coordinador/reportes/desercion?${params}`, { headers: authHeaders() })
    if (!response.ok) throw new Error("Error fetching reporte")
    return await response.json()
  } catch (error) {
    console.error("Error en getReporteDesercion:", error)
    return null
  }
}

export const getReporteAprobacion = async (
  carreraId: number,
  semestre?: string,
  periodo?: string
): Promise<ReporteAprobacionItem[] | null> => {
  try {
    const params = new URLSearchParams({ carrera_id: carreraId.toString(), ...(semestre && { semestre }), ...(periodo && { periodo }) })
    const response = await fetch(`${API_URL}/coordinador/reportes/aprobacion?${params}`, { headers: authHeaders() })
    if (!response.ok) throw new Error("Error fetching reporte")
    return await response.json()
  } catch (error) {
    console.error("Error en getReporteAprobacion:", error)
    return null
  }
}

export const registrarBaja = async (
  alumnoId: number,
  carreraId: number,
  registradoPor: number,
  motivo?: string
): Promise<void> => {
  const response = await fetch(`${API_URL}/coordinador/alumnos/${alumnoId}/baja`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ carrera_id: carreraId, registrado_por: registradoPor, motivo }),
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || "No se pudo registrar la baja")
  }
}

export const registrarReinscripcion = async (
  alumnoId: number,
  carreraId: number,
  registradoPor: number,
  periodo?: string
): Promise<void> => {
  const response = await fetch(`${API_URL}/coordinador/alumnos/${alumnoId}/reinscripcion`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ carrera_id: carreraId, registrado_por: registradoPor, periodo }),
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || "No se pudo registrar la reinscripción")
  }
}

export const updateAvanceMateriaAlumno = async (
  carreraId: number,
  alumnoId: number,
  materiaId: number,
  payload: ActualizarAvanceMateriaPayload
): Promise<void> => {
  const response = await fetch(`${API_URL}/coordinador/alumnos/${alumnoId}/materias/${materiaId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      carrera_id: carreraId,
      estatus: payload.estatus,
      calificacion: payload.calificacion ?? null,
      periodo: payload.periodo ?? null,
    }),
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || "No se pudo actualizar el avance de la materia")
  }
}
