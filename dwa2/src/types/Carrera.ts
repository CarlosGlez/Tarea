export interface Carrera {
  id: number
  nombre: string
  abreviatura: string
}

export interface PlanEstudio {
  id: number
  nombre: string
  carrera_id: number
  estatus: boolean
}

export interface Alumno {
  id: number
  nombre_usuario: string
  correo: string
  rol: string
  fecha_creacion: string
  matricula: string
  carrera_id?: number
  plan_id: number
  estatus_academico: string
  generacion: string
  escuela_procedencia: string
}