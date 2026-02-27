// Hook personalizado para manejar autenticación
import { useState } from "react"
import { loginRequest } from "../data/authService"

export const useAuth = () => {

  const [loading, setLoading] = useState(false)

  // Función principal de login
  const login = async (nombre_usuario: string, password: string) => {
    setLoading(true)  // Activar estado de carga

    try {
      // Llamar servicio de autenticación
      const data = await loginRequest(nombre_usuario, password)

      // Guardar datos en localStorage
      localStorage.setItem("token", data.token)
      localStorage.setItem("rol", data.usuario.rol)
      localStorage.setItem("nombre", data.usuario.nombre_usuario)
      localStorage.setItem("userId", String(data.usuario.id))

      // Retornar rol para redirección
      return data.usuario.rol

    } finally {
      setLoading(false)  // Desactivar estado de carga
    }
  }

  // Retornar funciones y estado del hook
  return { login, loading }
}
