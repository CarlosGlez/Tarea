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

interface ReporteInscripcionItem {
  matricula: string
  nombre_usuario: string
  correo: string
  generacion: string | null
  materias_inscritas: number
  fecha_creacion: string
}

interface ReporteRendimientoItem {
  nombre_usuario: string
  matricula: string
  materias_cursadas: number
  materias_aprobadas: number
  promedio: number | null
  estatus_academico: string
}

interface ReporteDesercion {
  total_desertores: number
  desertores_recientes: number
  desertores_por_generacion: number
}

interface ReporteAprobacionItem {
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

const API_URL = "http://localhost:3000/api"

// Obtener alumnos de la carrera del coordinador
export const getAlumnosByCarrera = async (carreraId: number | null): Promise<Alumno[]> => {
  try {
    const url = carreraId ? `${API_URL}/coordinador/alumnos?carrera_id=${carreraId}` : `${API_URL}/coordinador/alumnos`
    const response = await fetch(url)
    if (!response.ok) throw new Error("Error fetching alumnos")
    return await response.json()
  } catch (error) {
    console.error("Error en getAlumnosByCarrera:", error)
    return []
  }
}

// Obtener materias de la carrera del coordinador
export const getMateriasByCarrera = async (carreraId: number): Promise<MateriaCarrera[]> => {
  try {
    const response = await fetch(`${API_URL}/coordinador/materias?carrera_id=${carreraId}`)
    if (!response.ok) throw new Error("Error fetching materias")
    return await response.json()
  } catch (error) {
    console.error("Error en getMateriasByCarrera:", error)
    return []
  }
}

// Obtener horarios y secciones de la carrera
export const getHorariosByCarrera = async (carreraId: number): Promise<Horario[]> => {
  try {
    const response = await fetch(`${API_URL}/coordinador/horarios?carrera_id=${carreraId}`)
    if (!response.ok) throw new Error("Error fetching horarios")
    return await response.json()
  } catch (error) {
    console.error("Error en getHorariosByCarrera:", error)
    return []
  }
}

// Obtener estadísticas de la carrera
export const getEstadisticasByCarrera = async (carreraId: number): Promise<Estadisticas> => {
  try {
    const response = await fetch(`${API_URL}/coordinador/estadisticas?carrera_id=${carreraId}`)
    if (!response.ok) throw new Error("Error fetching estadisticas")
    return await response.json()
  } catch (error) {
    console.error("Error en getEstadisticasByCarrera:", error)
    return {
      totalAlumnos: 0,
      totalMaterias: 0,
      totalSecciones: 0,
      alumnosActivos: 0,
    }
  }
}

// Obtener reporte de inscripciones
export const getReporteInscripciones = async (
  carreraId: number,
  semestre?: string,
  periodo?: string
): Promise<ReporteInscripcionItem[] | null> => {
  try {
    const params = new URLSearchParams({
      carrera_id: carreraId.toString(),
      ...(semestre && { semestre }),
      ...(periodo && { periodo }),
    })
    const response = await fetch(`${API_URL}/coordinador/reportes/inscripciones?${params}`)
    if (!response.ok) throw new Error("Error fetching reporte")
    return await response.json()
  } catch (error) {
    console.error("Error en getReporteInscripciones:", error)
    return null
  }
}

// Obtener reporte de rendimiento
export const getReporteRendimiento = async (
  carreraId: number,
  semestre?: string,
  periodo?: string
): Promise<ReporteRendimientoItem[] | null> => {
  try {
    const params = new URLSearchParams({
      carrera_id: carreraId.toString(),
      ...(semestre && { semestre }),
      ...(periodo && { periodo }),
    })
    const response = await fetch(`${API_URL}/coordinador/reportes/rendimiento?${params}`)
    if (!response.ok) throw new Error("Error fetching reporte")
    return await response.json()
  } catch (error) {
    console.error("Error en getReporteRendimiento:", error)
    return null
  }
}

// Obtener reporte de deserción
export const getReporteDesercion = async (
  carreraId: number,
  semestre?: string,
  periodo?: string
): Promise<ReporteDesercion | null> => {
  try {
    const params = new URLSearchParams({
      carrera_id: carreraId.toString(),
      ...(semestre && { semestre }),
      ...(periodo && { periodo }),
    })
    const response = await fetch(`${API_URL}/coordinador/reportes/desercion?${params}`)
    if (!response.ok) throw new Error("Error fetching reporte")
    return await response.json()
  } catch (error) {
    console.error("Error en getReporteDesercion:", error)
    return null
  }
}

// Obtener reporte de aprobación
export const getReporteAprobacion = async (
  carreraId: number,
  semestre?: string,
  periodo?: string
): Promise<ReporteAprobacionItem[] | null> => {
  try {
    const params = new URLSearchParams({
      carrera_id: carreraId.toString(),
      ...(semestre && { semestre }),
      ...(periodo && { periodo }),
    })
    const response = await fetch(`${API_URL}/coordinador/reportes/aprobacion?${params}`)
    if (!response.ok) throw new Error("Error fetching reporte")
    return await response.json()
  } catch (error) {
    console.error("Error en getReporteAprobacion:", error)
    return null
  }
}

// Actualizar avance de una materia para un alumno de la carrera
export const updateAvanceMateriaAlumno = async (
  carreraId: number,
  alumnoId: number,
  materiaId: number,
  payload: ActualizarAvanceMateriaPayload
): Promise<void> => {
  const response = await fetch(`${API_URL}/coordinador/alumnos/${alumnoId}/materias/${materiaId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
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
