import { authHeaders, API_BASE } from "./api"

const API = `${API_BASE}/api/chat`

export interface Conversacion {
  id: number
  asunto: string
  estado: 'abierta' | 'cerrada'
  creado_en: string
  actualizado_en: string
  mensajes_sin_leer: number
  // Vista alumno
  coordinador_nombre?: string
  coordinador_apellido?: string
  // Vista coordinador
  alumno_nombre?: string
  alumno_apellido?: string
  matricula?: string
}

export interface Mensaje {
  id: number
  conversacion_id: number
  remitente_id: number
  contenido: string
  leido: boolean
  enviado_en: string
  remitente_nombre: string
  remitente_apellido: string
  remitente_rol: string
}

export const getConversaciones = async (
  usuarioId: number,
  rol: string
): Promise<Conversacion[]> => {
  const res = await fetch(`${API}/conversaciones?usuario_id=${usuarioId}&rol=${rol}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Error cargando conversaciones')
  return res.json()
}

export interface CoordinadorOpcion {
  id: number
  nombre: string
  apellido: string
  rol_cargo: string
}

export const getCoordinadoresCarrera = async (alumnoId: number): Promise<CoordinadorOpcion[]> => {
  const res = await fetch(`${API}/coordinadores?alumno_id=${alumnoId}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Error cargando coordinadores')
  return res.json()
}

export const crearConversacion = async (
  alumnoId: number,
  asunto: string,
  coordinadorId?: number
): Promise<{ id: number; coordinador_id: number }> => {
  const res = await fetch(`${API}/conversaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ alumno_id: alumnoId, asunto, coordinador_id: coordinadorId }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || 'Error creando conversación')
  }
  return res.json()
}

export const getMensajes = async (conversacionId: number): Promise<Mensaje[]> => {
  const res = await fetch(`${API}/mensajes/${conversacionId}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Error cargando mensajes')
  return res.json()
}

export const enviarMensaje = async (
  conversacionId: number,
  remitenteId: number,
  contenido: string
): Promise<{ id: number }> => {
  const res = await fetch(`${API}/mensajes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ conversacion_id: conversacionId, remitente_id: remitenteId, contenido }),
  })
  if (!res.ok) throw new Error('Error enviando mensaje')
  return res.json()
}

export const cambiarEstadoConversacion = async (
  id: number,
  estado: 'abierta' | 'cerrada'
): Promise<void> => {
  const res = await fetch(`${API}/conversaciones/${id}/estado`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ estado }),
  })
  if (!res.ok) throw new Error('Error actualizando estado')
}

export const eliminarConversacion = async (id: number): Promise<void> => {
  const res = await fetch(`${API}/conversaciones/${id}`, { method: 'DELETE', headers: authHeaders() })
  if (!res.ok) throw new Error('Error eliminando conversación')
}

export const getChatSinLeerTotal = async (usuarioId: number, rol: string): Promise<number> => {
  try {
    const res = await fetch(`${API}/sin-leer-total?usuario_id=${usuarioId}&rol=${rol}`, { headers: authHeaders() })
    if (!res.ok) return 0
    const data = await res.json()
    return data.total ?? 0
  } catch {
    return 0
  }
}

export const marcarLeidos = async (conversacionId: number, usuarioId: number): Promise<void> => {
  await fetch(`${API}/leer/${conversacionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ usuario_id: usuarioId }),
  })
}
