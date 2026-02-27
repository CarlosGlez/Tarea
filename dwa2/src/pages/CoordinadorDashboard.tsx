import { useEffect, useState } from "react"

export const CoordinadorDashboard = () => {
  const [usuario, setUsuario] = useState<any>(null)

  useEffect(() => {
    const nombre = localStorage.getItem("nombre")
    const rol = localStorage.getItem("rol")
    setUsuario({ nombre, rol })
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("rol")
    localStorage.removeItem("nombre")
    window.location.hash = ""
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Bienvenido, Coordinador</h1>
      {usuario && (
        <>
          <p>Nombre: {usuario.nombre_usuario}</p>
          <p>Rol: {usuario.rol}</p>
        </>
      )}
      <button onClick={handleLogout}>Cerrar Sesión</button>
    </div>
  )
}
