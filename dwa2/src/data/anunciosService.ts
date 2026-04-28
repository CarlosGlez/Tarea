const API = 'http://localhost:3000/api/anuncios'

export interface Anuncio {
  id: number
  titulo: string
  contenido: string
  carrera_id: number | null
  carrera_nombre: string | null
  coordinador_nombre: string
  coordinador_apellido: string
  creado_en: string
}

export interface CrearAnuncioPayload {
  coordinador_id: number
  titulo: string
  contenido: string
  carrera_id: number | null
}

export const getAnunciosAlumno = async (alumnoId: number): Promise<Anuncio[]> => {
  const res = await fetch(`${API}?alumno_id=${alumnoId}`)
  if (!res.ok) throw new Error('Error cargando anuncios')
  return res.json()
}

export const getAnunciosCoordinador = async (coordinadorId: number): Promise<Anuncio[]> => {
  const res = await fetch(`${API}?coordinador_id=${coordinadorId}`)
  if (!res.ok) throw new Error('Error cargando anuncios')
  return res.json()
}

export const crearAnuncio = async (payload: CrearAnuncioPayload): Promise<{ id: number }> => {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || 'Error creando anuncio')
  }
  return res.json()
}

export const getAnunciosNuevosCount = async (alumnoId: number, desde: string): Promise<number> => {
  try {
    const res = await fetch(`${API}/nuevos-count?alumno_id=${alumnoId}&desde=${encodeURIComponent(desde)}`)
    if (!res.ok) return 0
    const data = await res.json()
    return data.total ?? 0
  } catch {
    return 0
  }
}

export const eliminarAnuncio = async (id: number): Promise<void> => {
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Error eliminando anuncio')
}
