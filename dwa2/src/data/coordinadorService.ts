import type { Alumno } from "../types/Carrera"

interface Materia {
  id: number
  nombre: string
  codigo: string
  creditos: number
  semestre: number
  estatus: boolean
}

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

const API_URL = "http://localhost:3000/api"

// Obtener alumnos de la carrera del coordinador
export const getAlumnosByCarrera = async (carreraId: number): Promise<Alumno[]> => {
  try {
    const response = await fetch(`${API_URL}/coordinador/alumnos?carrera_id=${carreraId}`)
    if (!response.ok) throw new Error("Error fetching alumnos")
    return await response.json()
  } catch (error) {
    console.error("Error en getAlumnosByCarrera:", error)
    return []
  }
}

// Obtener materias de la carrera del coordinador
export const getMateriasByCarrera = async (carreraId: number): Promise<Materia[]> => {
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
): Promise<any> => {
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
): Promise<any> => {
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
): Promise<any> => {
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
): Promise<any> => {
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
