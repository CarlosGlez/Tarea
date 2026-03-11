import { useEffect, useState } from "react"
import { Sidebar } from "../components/Sidebar"
import { UsuariosList } from "../components/UsuariosList"
import { useAlumnosByCarrera, useMateriasByCarrera, useHorariosByCarrera, useEstadisticasByCarrera } from "../hooks/useCoordinador"
import * as coordinadorService from "../data/coordinadorService"
import styles from "./CoordinadorDashboard.module.css"

// Interfaz para materialización del coordinador
interface CoordinadorInfo {
  id: number
  nombre_usuario: string
  carrera_id: number
  carrera_nombre: string
  rol: string
}

export const CoordinadorDashboard = () => {
  // Estado para guardar datos del usuario
  const [usuario, setUsuario] = useState<CoordinadorInfo | null>(null)
  // Estado para controlar qué sección se muestra
  const [seccionActual, setSeccionActual] = useState("inicio")
  // Estados para filtros de reportes
  const [filtroSemestre, setFiltroSemestre] = useState("todos")
  const [filtroPeriodo, setFiltroPeriodo] = useState("2024-2025")

  // Usar hooks de coordinador
  const { alumnos, cargando: cargandoAlumnos } = useAlumnosByCarrera(
    usuario?.carrera_id || null
  )
  const { materias, cargando: cargandoMaterias } = useMateriasByCarrera(
    usuario?.carrera_id || null
  )
  const { horarios, cargando: cargandoHorarios } = useHorariosByCarrera(
    usuario?.carrera_id || null
  )
  const { estadisticas, cargando: cargandoEstadisticas } = useEstadisticasByCarrera(
    usuario?.carrera_id || null
  )

  // Cargar datos del usuario desde localStorage
  useEffect(() => {
    const nombre = localStorage.getItem("nombre")
    const rol = localStorage.getItem("rol")
    const carreraId = localStorage.getItem("carrera_id")
    const carreraNombre = localStorage.getItem("carrera_nombre")
    
    // Para ahora, asumiendo que el backend devuelve estos datos
    setUsuario({
      id: parseInt(localStorage.getItem("userId") || "0"),
      nombre_usuario: nombre || "",
      carrera_id: parseInt(carreraId || "0"),
      carrera_nombre: carreraNombre || "Carrera",
      rol: rol || "coordinador",
    })
  }, [])

  // Función para logout
  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("rol")
    localStorage.removeItem("nombre")
    localStorage.removeItem("userId")
    localStorage.removeItem("carrera_id")
    localStorage.removeItem("carrera_nombre")
    window.location.hash = ""
  }

  // Elementos del menú de la sidebar
  const menuItems = [
    { label: "Inicio", icon: "fa-home", onClick: () => setSeccionActual("inicio") },
    { label: "Alumnos", icon: "fa-users", onClick: () => setSeccionActual("alumnos") },
    { label: "Materias", icon: "fa-book", onClick: () => setSeccionActual("materias") },
    { label: "Horarios", icon: "fa-calendar", onClick: () => setSeccionActual("horarios") },
    { label: "Reportes", icon: "fa-chart-bar", onClick: () => setSeccionActual("reportes") },
    { label: "Cerrar sesión", icon: "fa-sign-out-alt", onClick: handleLogout },
  ]

  return (
    <div className={styles.container}>
      {/* Sidebar reutilizable */}
      <Sidebar title="MiKardex - Coordinador" menuItems={menuItems} />

      {/* Contenido principal */}
      <div className={styles.contenido}>
        {/* Sección de Inicio */}
        {seccionActual === "inicio" && (
          <div className={styles.seccion}>
            <h1>Bienvenido, {usuario?.nombre_usuario}</h1>
            <p>Panel de coordinador académico - Gestión de carrera: <strong>{usuario?.carrera_nombre}</strong></p>
            
            {usuario && (
              <div className={styles.datosUsuario}>
                <p><strong>Nombre:</strong> {usuario.nombre_usuario}</p>
                <p><strong>Rol:</strong> {usuario.rol}</p>
                <p><strong>Carrera:</strong> {usuario.carrera_nombre}</p>
              </div>
            )}

            {/* Tarjetas de estadísticas */}
            {!cargandoEstadisticas && (
              <div className={styles.tarjetas}>
                <div className={styles.tarjeta}>
                  <h3>Alumnos Activos</h3>
                  <div className={styles.numero}>{estadisticas.totalAlumnos}</div>
                  <div className={styles.label}>En la carrera</div>
                </div>
                <div className={styles.tarjeta}>
                  <h3>Materias</h3>
                  <div className={styles.numero}>{estadisticas.totalMaterias}</div>
                  <div className={styles.label}>Total de materias</div>
                </div>
                <div className={styles.tarjeta}>
                  <h3>Secciones</h3>
                  <div className={styles.numero}>{estadisticas.totalSecciones}</div>
                  <div className={styles.label}>En operación</div>
                </div>
              </div>
            )}

            <h2 style={{ marginTop: "40px" }}>Acciones Rápidas</h2>
            <p>Utiliza el menú lateral para acceder a las diferentes funcionalidades de coordinador académico.</p>
          </div>
        )}

        {/* Sección de Gestión de Alumnos */}
        {seccionActual === "alumnos" && (
          <div className={styles.seccion}>
            <h1>Gestión de Alumnos</h1>
            <p>Visualiza y gestiona todos los alumnos inscritos en la carrera de <strong>{usuario?.carrera_nombre}</strong>.</p>
            <UsuariosList />
            {/* TODO: Filtrar solo alumnos de la carrera del coordinador */}
          </div>
        )}

        {/* Sección de Gestión de Materias */}
        {seccionActual === "materias" && (
          <div className={styles.seccion}>
            <h1>Gestión de Materias</h1>
            <p>Administra las materias de la carrera y supervisa su oferta académica.</p>
            
            {cargandoMaterias ? (
              <p>Cargando materias...</p>
            ) : materias.length > 0 ? (
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre de la Materia</th>
                    <th>Créditos</th>
                    <th>Semestre</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {materias.map((materia) => (
                    <tr key={materia.id}>
                      <td>{materia.codigo}</td>
                      <td>{materia.nombre}</td>
                      <td>{materia.creditos}</td>
                      <td>{materia.semestre}</td>
                      <td>
                        <span className={materia.estatus ? styles.estadoActivo : styles.estadoInactivo}>
                          {materia.estatus ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td>
                        <button className={styles.boton} style={{ marginRight: "5px" }}>
                          Editar
                        </button>
                        <button className={styles.boton}>Ver Secciones</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No hay materias disponibles para esta carrera.</p>
            )}
          </div>
        )}

        {/* Sección de Horarios */}
        {seccionActual === "horarios" && (
          <div className={styles.seccion}>
            <h1>Horarios y Secciones</h1>
            <p>Consulta y administra los horarios de clases y secciones de la carrera.</p>
            
            {cargandoHorarios ? (
              <p>Cargando horarios...</p>
            ) : horarios.length > 0 ? (
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>Materia</th>
                    <th>Sección</th>
                    <th>Profesor</th>
                    <th>Hora Inicio</th>
                    <th>Hora Fin</th>
                    <th>Aula</th>
                    <th>Días</th>
                  </tr>
                </thead>
                <tbody>
                  {horarios.map((horario) => (
                    <tr key={horario.id}>
                      <td>{horario.materia_nombre}</td>
                      <td>{horario.seccion}</td>
                      <td>{horario.profesor_nombre}</td>
                      <td>{horario.hora_inicio}</td>
                      <td>{horario.hora_fin}</td>
                      <td>{horario.aula}</td>
                      <td>{horario.dias}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No hay horarios disponibles para esta carrera.</p>
            )}
          </div>
        )}

        {/* Sección de Reportes */}
        {seccionActual === "reportes" && (
          <div className={styles.seccion}>
            <h1>Reportes Académicos</h1>
            <p>Genera y consulta reportes sobre desempeño académico, inscripciones y estadísticas de la carrera.</p>
            
            <div style={{ marginTop: "20px" }}>
              <h2>Reportes Disponibles</h2>
              
              <button 
                className={styles.boton} 
                style={{ marginRight: "10px", marginBottom: "10px" }}
                onClick={() => usuario?.carrera_id && coordinadorService.getReporteInscripciones(usuario.carrera_id, filtroSemestre !== 'todos' ? filtroSemestre : undefined, filtroPeriodo)}
              >
                📊 Reporte de Inscripciones
              </button>
              <button 
                className={styles.boton} 
                style={{ marginRight: "10px", marginBottom: "10px" }}
                onClick={() => usuario?.carrera_id && coordinadorService.getReporteRendimiento(usuario.carrera_id, filtroSemestre !== 'todos' ? filtroSemestre : undefined, filtroPeriodo)}
              >
                📈 Reporte de Rendimiento
              </button>
              <button 
                className={styles.boton} 
                style={{ marginRight: "10px", marginBottom: "10px" }}
                onClick={() => usuario?.carrera_id && coordinadorService.getReporteDesercion(usuario.carrera_id, filtroSemestre !== 'todos' ? filtroSemestre : undefined, filtroPeriodo)}
              >
                📋 Reporte de Deserción
              </button>
              <button 
                className={styles.boton} 
                style={{ marginRight: "10px", marginBottom: "10px" }}
                onClick={() => usuario?.carrera_id && coordinadorService.getReporteAprobacion(usuario.carrera_id, filtroSemestre !== 'todos' ? filtroSemestre : undefined, filtroPeriodo)}
              >
                🎯 Reporte de Aprobación
              </button>
            </div>

            <h2 style={{ marginTop: "40px" }}>Filtros de Reportes</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "15px" }}>
              <div>
                <label style={{ fontWeight: "600", display: "block", marginBottom: "5px" }}>Semestre:</label>
                <select 
                  value={filtroSemestre}
                  onChange={(e) => setFiltroSemestre(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ddd" }}
                >
                  <option value="todos">Todos</option>
                  <option value="1">1er Semestre</option>
                  <option value="2">2do Semestre</option>
                  <option value="3">3er Semestre</option>
                  <option value="4">4to Semestre</option>
                </select>
              </div>
              <div>
                <label style={{ fontWeight: "600", display: "block", marginBottom: "5px" }}>Período Académico:</label>
                <select 
                  value={filtroPeriodo}
                  onChange={(e) => setFiltroPeriodo(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ddd" }}
                >
                  <option value="2024-2025">2024-2025</option>
                  <option value="2023-2024">2023-2024</option>
                  <option value="2022-2023">2022-2023</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
