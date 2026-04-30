import type { Materia } from "../types/Materia.ts"
import { authHeaders, API_BASE } from "./api"

const API = `${API_BASE}/api/usuarios`

export const getMateriasAlumno = async (alumnoId: number): Promise<Materia[]> => {
  const res = await fetch(`${API}/${alumnoId}/materias`, { headers: authHeaders() })
  if (!res.ok) throw new Error("Error al obtener materias")
  return await res.json()
}
