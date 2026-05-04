
// Hook personalizado para manejar autenticación
import { useState } from "react"
import { loginRequest, registerRequest } from "../data/authService"

export const useAuth = () => {

  const [loading, setLoading] = useState(false)

  // Función principal de login
  const login = async (nombre_usuario: string, password: string) => {
    setLoading(true)  // Activar estado de carga

    try {
      // Llamar servicio de autenticación
      const data = await loginRequest(nombre_usuario, password)

      // Guardar datos en localStorage
      sessionStorage.setItem("token", data.token)
      localStorage.setItem("rol", data.usuario.rol)
      localStorage.setItem("nombre", data.usuario.nombre_usuario)
      localStorage.setItem("userId", String(data.usuario.id))
      // también podemos guardar nombre real y correo si vienen en la respuesta
      if (data.usuario.nombre) localStorage.setItem("nombre_real", data.usuario.nombre)
      if (data.usuario.apellido) localStorage.setItem("apellido", data.usuario.apellido)
      if (data.usuario.correo) localStorage.setItem("correo", data.usuario.correo)

      // Si es coordinador, guardar información de su carrera
      if (data.usuario.rol === 'coordinador') {
        localStorage.setItem("carrera_id", String(data.usuario.carrera_id || ""))
        localStorage.setItem("carrera_nombre", data.usuario.carrera_nombre || "")
        localStorage.setItem("carrera_abreviatura", data.usuario.carrera_abreviatura || "")
        localStorage.setItem("rol_cargo", data.usuario.rol_cargo || "coordinador")
      }

      // Retornar rol para redirección
      return data.usuario.rol

    } finally {
      setLoading(false)  // Desactivar estado de carga
    }
  }

  const register = async (nombre_completo: string, correo: string, password: string, escuela_procedencia: string, carrera_id?: number, plan_id?: number) => {
    setLoading(true)

    try {
      return await registerRequest({
        nombre_completo,
        correo,
        password,
        escuela_procedencia,
        carrera_id,
        plan_id
      })
    } finally {
      setLoading(false)
    }
  }

  // Retornar funciones y estado del hook
  return { login, register, loading }
}
