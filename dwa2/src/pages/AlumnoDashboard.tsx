import { useEffect, useState } from "react"
import { Sidebar } from "../components/Sidebar"
import { SectionTransition } from "../components/SectionTransition"
import { MateriasListAlumno } from "../components/MateriasListAlumno"
import { StudyPlanProgress } from "../components/StudyPlanProgress"
import { Chat } from "../components/Chat"
import { Anuncios } from "../components/Anuncios"
import { useMateriasAlumno } from "../hooks/useMateriasAlumno"
import { getAlumnoDatos, type AlumnoDatos } from "../data/usuariosService"
import { getChatSinLeerTotal } from "../data/chatService"
import { getAnunciosNuevosCount } from "../data/anunciosService"
import styles from "./AlumnoDashboard.module.css"

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) return 'No especificada'
  const [year, month, day] = fecha.split('T')[0].split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString()
}

const formatearEstatus = (estatus?: string) => {
  if (!estatus) return 'No especificado'
  return estatus.charAt(0).toUpperCase() + estatus.slice(1)
}

export const AlumnoDashboard = () => {
  const alumnoId = Number(localStorage.getItem("userId")) || null

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
  const { materias, loading: loadingMaterias } = useMateriasAlumno(alumnoId)
  const [seccionActual, setSeccionActual] = useState("inicio")
  const [chatBadge, setChatBadge] = useState(0)
  const [anunciosBadge, setAnunciosBadge] = useState(0)

  // Polling de badges cada 30s
  useEffect(() => {
    if (!alumnoId) return
    const ANUNCIOS_KEY = `anuncios_visto_${alumnoId}`

    const fetchBadges = async () => {
      const [chat, anuncios] = await Promise.all([
        getChatSinLeerTotal(alumnoId, 'alumno'),
        getAnunciosNuevosCount(alumnoId, localStorage.getItem(ANUNCIOS_KEY) ?? new Date(0).toISOString()),
      ])
      setChatBadge(chat)
      setAnunciosBadge(anuncios)
    }

    fetchBadges()
    const interval = setInterval(fetchBadges, 30000)
    return () => clearInterval(interval)
  }, [alumnoId])

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
    sessionStorage.removeItem("token")
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
    {
      label: "Anuncios", icon: "fa-bullhorn", badge: anunciosBadge,
      onClick: () => {
        setSeccionActual("anuncios")
        setAnunciosBadge(0)
        if (alumnoId) localStorage.setItem(`anuncios_visto_${alumnoId}`, new Date().toISOString())
      }
    },
    {
      label: "Chat", icon: "fa-comments", badge: chatBadge,
      onClick: () => { setSeccionActual("chat"); setChatBadge(0) }
    },
    { label: "Cerrar sesión", icon: "fa-sign-out-alt", onClick: handleLogout },
  ]

  return (
    <div className={styles.container}>
      {/* Sidebar reutilizable */}
      <Sidebar title="MiKardex - Alumno" menuItems={menuItems} />

      {/* Contenido principal */}
      <div className={styles.contenido}>
        <SectionTransition key={seccionActual}>
        {/* Sección de Inicio */}
        {seccionActual === "inicio" && (
          <div className={styles.seccion}>
            <h1>Bienvenido, {usuario ? `${usuario.nombre} ${usuario.apellido}` : '...'}</h1>
            <p>Este es tu panel de control como alumno.</p>
            {usuario && (
              <div className={styles.datosUsuario}>
                {usuario.imagen_url
                  ? <img src={usuario.imagen_url} alt="Foto del alumno" className={styles.avatar} />
                  : <div className={styles.avatarFallback}><i className="fas fa-user" /></div>
                }
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
            <p>Consulta tu plan por semestre y el estatus actual de cada materia.</p>

            <StudyPlanProgress
              materias={materias}
              loading={loadingMaterias}
              title="Mi avance academico"
              subtitle="Las materias cambian de color segun su estatus actual en tu trayectoria."
              enableMateriaQuickView
              student={{
                nombre: usuario ? `${usuario.nombre} ${usuario.apellido}`.trim() : "Alumno",
                identificador: usuario?.matricula || usuario?.id || "-",
                carrera: usuario?.carrera_nombre || "Carrera no especificada",
                plan: usuario?.plan_estudios || "Plan no especificado",
                estatus: formatearEstatus(usuario?.estatus_academico),
                avatarUrl: usuario?.imagen_url || null,
              }}
              emptyMessage="Todavia no hay materias cargadas para mostrar tu plan de estudios."
            />
          </div>
        )}

        {/* Sección de Materias */}
        {seccionActual === "materias" && (
          <div className={styles.seccion}>
            <h1>Lista de Materias</h1>
            <p>Aquí verás todas tus materias agrupadas por estatus.</p>
            <MateriasListAlumno materias={materias} loading={loadingMaterias} />
          </div>
        )}

        {/* Sección de Anuncios */}
        {seccionActual === "anuncios" && alumnoId && (
          <div className={styles.seccion}>
            <h1>Anuncios</h1>
            <p>Comunicados y avisos publicados por tus coordinadores.</p>
            <Anuncios usuarioId={alumnoId} rol="alumno" />
          </div>
        )}

        {/* Sección de Chat */}
        {seccionActual === "chat" && alumnoId && (
          <div className={styles.seccion}>
            <h1>Chat con Coordinador</h1>
            <p>Comunícate directamente con tu coordinador académico.</p>
            <Chat usuarioId={alumnoId} rol="alumno" />
          </div>
        )}
        </SectionTransition>
      </div>
    </div>
  )
}
