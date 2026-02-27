import type { Materia } from "../types/Materia.ts"

const API = "http://localhost:3000/api/usuarios"

export const getMateriasAlumno = async (alumnoId: number): Promise<Materia[]> => {
  const res = await fetch(`${API}/${alumnoId}/materias`)
  if (!res.ok) throw new Error("Error al obtener materias")
  return await res.json()
}
