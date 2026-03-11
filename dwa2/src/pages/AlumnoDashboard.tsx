import { useEffect, useState } from "react"
import { Sidebar } from "../components/Sidebar"
import { MateriasListAlumno } from "../components/MateriasListAlumno"
import { getAlumnoDatos, type AlumnoDatos } from "../data/usuariosService"
import styles from "./AlumnoDashboard.module.css"

export const AlumnoDashboard = () => {
  // Estado para guardar datos del usuario (incluye nombre completo, correo, etc.)
  const [usuario, setUsuario] = useState<AlumnoDatos | null>(null)
  // Estado para controlar qué sección se muestra
  const [seccionActual, setSeccionActual] = useState("inicio")

  // Cargar datos del usuario desde el backend usando el ID almacenado
  useEffect(() => {
    const id = Number(localStorage.getItem("userId"))
    if (!id) return

    // set initial info from localStorage if available (login may have provided nombre/apellido)
    const nombreReal = localStorage.getItem("nombre_real") || ''
    const apellido = localStorage.getItem("apellido") || ''
    const correo = localStorage.getItem("correo") || ''
    // crear un objeto mínimo con los campos obligatorios para evitar errores de tipo
    setUsuario({
      id,
      nombre_usuario: '',
      nombre: nombreReal,
      apellido,
      correo,
      rol: '',
      fecha_creacion: ''
    })

    // then fetch full datos from servidor
    getAlumnoDatos(id)
      .then((data) => {
        setUsuario(data)
      })
      .catch((err) => {
        console.error("Error al obtener datos de alumno:", err)
      })
  }, [])

  // Función para logout
  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("rol")
    localStorage.removeItem("nombre")
    localStorage.removeItem("nombre_real")
    localStorage.removeItem("apellido")
    localStorage.removeItem("correo")
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
            <h1>Bienvenido, {usuario ? `${usuario.nombre} ${usuario.apellido}` : '...'}</h1>
            <p>Este es tu panel de control como alumno.</p>
            {usuario && (
              <div className={styles.datosUsuario}>
                <img
                  src={usuario.imagen_url || 'https://via.placeholder.com/150'}
                  alt="Foto del alumno"
                  className={styles.avatar}
                />
                <p><strong>Nombre completo:</strong> {usuario.nombre} {usuario.apellido}</p>
                <p><strong>Correo:</strong> {usuario.correo}</p>
                <p>
                  <strong>Fecha de nacimiento:</strong>{' '}
                  {usuario && usuario.fecha_nacimiento
                    ? new Date(usuario.fecha_nacimiento).toLocaleDateString()
                    : 'No especificada'}
                </p>
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
