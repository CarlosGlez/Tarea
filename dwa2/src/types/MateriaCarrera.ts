export interface MateriaCarrera {
  id: number
  codigo: string
  nombre: string
  creditos: number
  tipo_bloque: string
  modalidad: string
  semestre: number | null
  origen_oferta: "plan_fijo" | "oferta_carrera" | "minor"
  obligatoria_en_plan: number
  minor_nombre: string | null
}