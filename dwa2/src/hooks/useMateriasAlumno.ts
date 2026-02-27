import { useEffect, useState } from "react"
import type { Materia } from "../types/Materia"
import { getMateriasAlumno } from "../data/materiasService"

export const useMateriasAlumno = (alumnoId: number | null) => {
  const [materias, setMaterias] = useState<Materia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!alumnoId) {
      setMaterias([])
      setLoading(false)
      return
    }

    setLoading(true)
    getMateriasAlumno(alumnoId)
      .then(data => setMaterias(data))
      .catch(() => setMaterias([]))
      .finally(() => setLoading(false))
  }, [alumnoId])

  return { materias, loading }
}
