import { useEffect, useState } from "react"
import { Sidebar } from "../components/Sidebar"
import { MateriasListAlumno } from "../components/MateriasListAlumno"
import styles from "./AlumnoDashboard.module.css"

export const AlumnoDashboard = () => {
  // Estado para guardar datos del usuario
  const [usuario, setUsuario] = useState<any>(null)
  // Estado para controlar qué sección se muestra
  const [seccionActual, setSeccionActual] = useState("inicio")

  // Cargar datos del usuario desde localStorage
  useEffect(() => {
    const nombre = localStorage.getItem("nombre")
    const rol = localStorage.getItem("rol")
    setUsuario({ nombre, rol })
  }, [])

  // Función para logout
  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("rol")
    localStorage.removeItem("nombre")
    window.location.hash = ""
  }

  // Elementos del menú de la sidebar
  const menuItems = [
    { label: "Inicio", icon: "fa-home", onClick: () => setSeccionActual("inicio") },
    { label: "Mi Kardex", icon: "fa-book", onClick: () => setSeccionActual("kardex") },
    { label: "Lista de materias", icon: "fa-list-ul", onClick: () => setSeccionActual("materias") },
    { label: "Cerrar sesión", icon: "fa-sign-out-alt", onClick: handleLogout },
  ]

  return (
    <div className={styles.container}>
      {/* Sidebar reutilizable */}
      <Sidebar title="MiKardex - Alumno" menuItems={menuItems} />

      {/* Contenido principal */}
      <div className={styles.contenido}>
        {/* Sección de Inicio */}
        {seccionActual === "inicio" && (
          <div className={styles.seccion}>
            <h1>Bienvenido, {usuario?.nombre_usuario}</h1>
            <p>Este es tu panel de control como alumno.</p>
            {usuario && (
              <div className={styles.datosUsuario}>
                <p><strong>Nombre:</strong> {usuario.nombre_usuario}</p>
                <p><strong>Rol:</strong> {usuario.rol}</p>
              </div>
            )}
          </div>
        )}

        {/* Sección de Kardex */}
        {seccionActual === "kardex" && (
          <div className={styles.seccion}>
            <h1>Mi Kardex</h1>
            <p>Aquí estarán tus calificaciones históricas.</p>
            {/* TODO: Cargar datos de kardex desde API */}
          </div>
        )}

        {/* Sección de Materias */}
        {seccionActual === "materias" && (
          <div className={styles.seccion}>
            <h1>Lista de Materias</h1>
            <p>Aquí verás todas tus materias inscritas.</p>
            <MateriasListAlumno alumnoId={Number(localStorage.getItem('userId')) || null} />
          </div>
        )}
      </div>
    </div>
  )
}
