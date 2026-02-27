import { useEffect, useState } from "react"
import type { Usuario } from "../types/Usuario"
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from "../data/usuariosService.ts"

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsuarios = async () => {
    setLoading(true)
    try {
      const data = await getUsuarios()
      setUsuarios(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const addUsuario = async (usuario: Omit<Usuario, 'id' | 'fecha_creacion'> & { contrasena: string }) => {
    await createUsuario(usuario)
    await fetchUsuarios()
  }

  const editUsuario = async (id: number, usuario: Partial<Omit<Usuario, 'id' | 'fecha_creacion'> & { contrasena?: string }>) => {
    await updateUsuario(id, usuario)
    await fetchUsuarios()
  }

  const removeUsuario = async (id: number) => {
    await deleteUsuario(id)
    await fetchUsuarios()
  }

  return { usuarios, loading, addUsuario, editUsuario, removeUsuario }
}
