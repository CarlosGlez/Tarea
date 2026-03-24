import { useState, useEffect } from "react"
import { getCarreras, getPlanesByCarrera, getAlumnosByCarrera } from "../data/carrerasService"
import type { Carrera, PlanEstudio, Alumno } from "../types/Carrera"

export const useCarreras = () => {
  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCarreras = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getCarreras()
      setCarreras(data)
    } catch (err) {
      setError("Error al cargar carreras")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCarreras()
  }, [])

  return { carreras, loading, error, refetchCarreras: fetchCarreras }
}

export const usePlanesByCarrera = (carreraId: number) => {
  const [planes, setPlanes] = useState<PlanEstudio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (carreraId) {
      const fetchPlanes = async () => {
        try {
          const data = await getPlanesByCarrera(carreraId)
          setPlanes(data)
        } catch (err) {
          setError("Error al cargar planes")
        } finally {
          setLoading(false)
        }
      }
      fetchPlanes()
    }
  }, [carreraId])

  return { planes, loading, error }
}

export const useAlumnosByCarrera = (carreraId: number) => {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (carreraId) {
      const fetchAlumnos = async () => {
        try {
          const data = await getAlumnosByCarrera(carreraId)
          setAlumnos(data)
        } catch (err) {
          setError("Error al cargar alumnos")
        } finally {
          setLoading(false)
        }
      }
      fetchAlumnos()
    }
  }, [carreraId])

  return { alumnos, loading, error }
}