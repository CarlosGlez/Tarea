// Servicio para manejar peticiones de autenticación
// Tipos TypeScript para las respuestas de la API
interface LoginResponse {
  token: string
  usuario: {
    id: number
    nombre_usuario: string
    rol: string
    nombre?: string
    apellido?: string
    correo?: string
    carrera_id?: number
    carrera_nombre?: string
    carrera_abreviatura?: string
    rol_cargo?: string
  }
}

interface RegisterPayload {
  nombre_completo: string
  correo: string
  password: string
  escuela_procedencia: string
}

// Función para hacer login
export const loginRequest = async (
  nombre_usuario: string,
  password: string
): Promise<LoginResponse> => {

  // Hacer petición POST a la API
  const response = await fetch(
    "http://localhost:3000/api/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nombre_usuario, password })
    }
  )

  // Verificar si la respuesta es exitosa
  if (!response.ok) {
    throw new Error("Credenciales incorrectas")
  }

  // Parsear respuesta JSON
  return await response.json()
}

export const registerRequest = async (payload: RegisterPayload): Promise<{ message: string; id: number }> => {
  const response = await fetch(
    "http://localhost:3000/api/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  )

  if (!response.ok) {
    let message = `No se pudo crear la cuenta (HTTP ${response.status})`
    try {
      const error = await response.json()
      if (error?.message) {
        message = error.message
      }
    } catch {
      if (response.status === 404) {
        message = "El endpoint de registro no está disponible. Reinicia el servidor backend."
      }
    }
    throw new Error(message)
  }

  return await response.json()
}
