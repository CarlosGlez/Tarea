// Servicio para manejar peticiones de autenticación
// Tipos TypeScript para las respuestas de la API
interface LoginResponse {
  token: string
  usuario: {
    id: number
    nombre_usuario: string
    rol: string
  }
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
