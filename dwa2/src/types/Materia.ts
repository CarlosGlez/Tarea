export interface Materia {
  id: number
  codigo: string
  nombre: string
  creditos: number
  tipo_bloque: string
  modalidad: string
  semestre: number
  estatus: string
  calificacion?: number | null
  periodo?: string | null
}
