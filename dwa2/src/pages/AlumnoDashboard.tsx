import { useEffect, useState } from "react"
import { Sidebar } from "../components/Sidebar"
import { MateriasListAlumno } from "../components/MateriasListAlumno"
import { getAlumnoDatos, type AlumnoDatos } from "../data/usuariosService"
import styles from "./AlumnoDashboard.module.css"
import { Plan2020, Pomeranio } from "../assets"

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) return 'No especificada'
  return new Date(fecha).toLocaleDateString()
}

const formatearEstatus = (estatus?: string) => {
  if (!estatus) return 'No especificado'
  return estatus.charAt(0).toUpperCase() + estatus.slice(1)
}

export const AlumnoDashboard = () => {
  // Estado para guardar datos del usuario (incluye nombre completo, correo, etc.)
  const [usuario, setUsuario] = useState<AlumnoDatos | null>(() => {
    const id = Number(localStorage.getItem("userId"))
    if (!id) return null

    const nombreReal = localStorage.getItem("nombre_real") || ''
    const apellido = localStorage.getItem("apellido") || ''
    const correo = localStorage.getItem("correo") || ''

    return {
      id,
      nombre_usuario: '',
      nombre: nombreReal,
      apellido,
      correo,
      rol: '',
      fecha_creacion: ''
    }
  })
  // Estado para controlar qué sección se muestra
  const [seccionActual, setSeccionActual] = useState("inicio")

  // Cargar datos del usuario desde el backend usando el ID almacenado
  useEffect(() => {
    const id = Number(localStorage.getItem("userId"))
    if (!id) return

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
                  src={usuario.imagen_url || Pomeranio}
                  alt="Foto del alumno"
                  className={styles.avatar}
                />
                <p><strong>Nombre completo:</strong> {usuario.nombre} {usuario.apellido}</p>
                <p><strong>Correo:</strong> {usuario.correo}</p>
                <p>
                  <strong>Fecha de nacimiento:</strong>{' '}
                  {formatearFecha(usuario.fecha_nacimiento)}
                </p>

                <div className={styles.resumenGrid}>
                  <article className={styles.datoCard}>
                    <p className={styles.datoLabel}>ID de alumno</p>
                    <p className={styles.datoValor}>{usuario.id}</p>
                  </article>

                  <article className={styles.datoCard}>
                    <p className={styles.datoLabel}>Estatus academico</p>
                    <p className={`${styles.datoValor} ${styles.estatusBadge}`}>
                      {formatearEstatus(usuario.estatus_academico)}
                    </p>
                  </article>

                  <article className={styles.datoCard}>
                    <p className={styles.datoLabel}>Carrera</p>
                    <p className={styles.datoValor}>{usuario.carrera_nombre || 'No especificada'}</p>
                  </article>

                  <article className={styles.datoCard}>
                    <p className={styles.datoLabel}>Plan de estudios</p>
                    <p className={styles.datoValor}>{usuario.plan_estudios || 'No especificado'}</p>
                  </article>

                  <article className={styles.datoCard}>
                    <p className={styles.datoLabel}>Fecha de alta</p>
                    <p className={styles.datoValor}>{formatearFecha(usuario.fecha_alta || usuario.fecha_creacion)}</p>
                  </article>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sección de Kardex */}
        {seccionActual === "kardex" && (
          <div className={styles.seccion}>
            <h1>Mi Kardex</h1>
            <p>Aquí estarán tus calificaciones históricas.</p>
            <img src={Plan2020} alt="Kardex placeholder" className={styles.kardexPlaceholder} />
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
