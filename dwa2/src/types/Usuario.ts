export interface Usuario {
  id: number
  nombre_usuario: string
  nombre?: string
  apellido?: string
  correo: string
  rol: string
  fecha_creacion: string
  fecha_nacimiento?: string | null
  // otros campos adicionales que puedan venir en respuestas de la API
}
