import { useEffect, useState, useCallback } from "react"
import * as coordinadorService from "../data/coordinadorService"
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

// Hook para obtener alumnos de la carrera
export const useAlumnosByCarrera = (carreraId: number | null) => {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarAlumnos = useCallback(async () => {
    if (!carreraId) {
      setAlumnos([])
      setCargando(false)
      return
    }
    try {
      setCargando(true)
      const datos = await coordinadorService.getAlumnosByCarrera(carreraId)
      setAlumnos(datos)
      setError(null)
    } catch (err) {
      setError("Error al cargar alumnos")
      console.error(err)
      setAlumnos([])
    } finally {
      setCargando(false)
    }
  }, [carreraId])

  useEffect(() => {
    cargarAlumnos()
  }, [cargarAlumnos])

  const refetch = useCallback(() => {
    cargarAlumnos()
  }, [cargarAlumnos])

  return { alumnos, cargando, error, refetch }
}

// Hook para obtener materias de la carrera
export const useMateriasByCarrera = (carreraId: number | null) => {
  const [materias, setMaterias] = useState<Materia[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarMaterias = async () => {
      if (!carreraId) {
        setCargando(false)
        return
      }
      try {
        setCargando(true)
        const datos = await coordinadorService.getMateriasByCarrera(carreraId)
        setMaterias(datos)
        setError(null)
      } catch (err) {
        setError("Error al cargar materias")
        console.error(err)
      } finally {
        setCargando(false)
      }
    }

    cargarMaterias()
  }, [carreraId])

  return { materias, cargando, error }
}

// Hook para obtener horarios de la carrera
export const useHorariosByCarrera = (carreraId: number | null) => {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarHorarios = async () => {
      if (!carreraId) {
        setCargando(false)
        return
      }
      try {
        setCargando(true)
        const datos = await coordinadorService.getHorariosByCarrera(carreraId)
        setHorarios(datos)
        setError(null)
      } catch (err) {
        setError("Error al cargar horarios")
        console.error(err)
      } finally {
        setCargando(false)
      }
    }

    cargarHorarios()
  }, [carreraId])

  return { horarios, cargando, error }
}

// Hook para obtener estadísticas de la carrera
export const useEstadisticasByCarrera = (carreraId: number | null) => {
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    totalAlumnos: 0,
    totalMaterias: 0,
    totalSecciones: 0,
    alumnosActivos: 0,
  })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarEstadisticas = async () => {
      if (!carreraId) {
        setCargando(false)
        return
      }
      try {
        setCargando(true)
        const datos = await coordinadorService.getEstadisticasByCarrera(carreraId)
        setEstadisticas(datos)
        setError(null)
      } catch (err) {
        setError("Error al cargar estadísticas")
        console.error(err)
      } finally {
        setCargando(false)
      }
    }

    cargarEstadisticas()
  }, [carreraId])

  return { estadisticas, cargando, error }
}
