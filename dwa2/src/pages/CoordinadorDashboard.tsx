import { useEffect, useState } from "react"
import { Sidebar } from "../components/Sidebar"
import { UsuariosList } from "../components/UsuariosList"
import { useAlumnosByCarrera, useMateriasByCarrera, useHorariosByCarrera, useEstadisticasByCarrera } from "../hooks/useCoordinador"
import * as coordinadorService from "../data/coordinadorService"
import { getAlumnoDatos, type AlumnoDatos } from "../data/usuariosService"
import { getMateriasAlumno } from "../data/materiasService"
import type { Alumno } from "../types/Carrera"
import type { Materia } from "../types/Materia"
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
  const [usuario] = useState<CoordinadorInfo | null>(() => {
    const nombre = localStorage.getItem("nombre")
    const rol = localStorage.getItem("rol")
    const carreraId = localStorage.getItem("carrera_id")
    const carreraNombre = localStorage.getItem("carrera_nombre")

    const id = parseInt(localStorage.getItem("userId") || "0")
    if (!id) return null

    return {
      id,
      nombre_usuario: nombre || "",
      carrera_id: parseInt(carreraId || "0"),
      carrera_nombre: carreraNombre || "Carrera",
      rol: rol || "coordinador",
    }
  })
  // Estado para controlar qué sección se muestra
  const [seccionActual, setSeccionActual] = useState("inicio")
  // Estados para filtros de reportes
  const [filtroSemestre, setFiltroSemestre] = useState("todos")
  const [filtroPeriodo, setFiltroPeriodo] = useState("2024-2025")
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<Alumno | null>(null)
  const [datosAlumnoDetalle, setDatosAlumnoDetalle] = useState<AlumnoDatos | null>(null)
  const [materiasAlumnoDetalle, setMateriasAlumnoDetalle] = useState<Materia[]>([])
  const [cargandoDetalleAlumno, setCargandoDetalleAlumno] = useState(false)
  const [vistaDetalleAlumno, setVistaDetalleAlumno] = useState<"plan" | "kardex">("plan")

  // Usar hooks de coordinador
  const { alumnos, cargando: cargandoAlumnos, refetch: refetchAlumnos } = useAlumnosByCarrera(
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

  useEffect(() => {
    if (!alumnoSeleccionado) return

    Promise.all([
      getAlumnoDatos(alumnoSeleccionado.id),
      getMateriasAlumno(alumnoSeleccionado.id),
    ])
      .then(([datos, materias]) => {
        setDatosAlumnoDetalle(datos)
        setMateriasAlumnoDetalle(materias)
      })
      .catch((err) => {
        console.error("Error cargando detalle del alumno:", err)
        setDatosAlumnoDetalle(null)
        setMateriasAlumnoDetalle([])
      })
      .finally(() => setCargandoDetalleAlumno(false))
  }, [alumnoSeleccionado])

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

  const abrirDetalleAlumno = (alumno: Alumno) => {
    setCargandoDetalleAlumno(true)
    setAlumnoSeleccionado(alumno)
    setVistaDetalleAlumno("plan")
    setSeccionActual("alumno_detalle")
  }

  const volverAAlumnos = () => {
    setSeccionActual("alumnos")
  }

  const totalCreditosPlan = materiasAlumnoDetalle.reduce((acc, materia) => acc + materia.creditos, 0)
  const creditosAprobados = materiasAlumnoDetalle
    .filter((materia) => materia.estatus === "aprobada" || materia.estatus === "revalidar")
    .reduce((acc, materia) => acc + materia.creditos, 0)
  const porcentajeAvance = totalCreditosPlan > 0 ? Math.round((creditosAprobados / totalCreditosPlan) * 100) : 0

  const materiasPorSemestre = materiasAlumnoDetalle.reduce<Record<number, Materia[]>>((acc, materia) => {
    const semestre = materia.semestre || 0
    if (!acc[semestre]) acc[semestre] = []
    acc[semestre].push(materia)
    return acc
  }, {})

  const materiasCursadas = materiasAlumnoDetalle.filter((materia) => materia.estatus === "aprobada" || materia.estatus === "revalidar")
  const materiasPorCursar = materiasAlumnoDetalle.filter((materia) => materia.estatus === "no_cursada")
  const materiasReprobadas = materiasAlumnoDetalle.filter((materia) => materia.estatus === "no_aprobada")

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

            <h2 className={styles.tituloConEspacio}>Acciones Rapidas</h2>
            <p>Utiliza el menú lateral para acceder a las diferentes funcionalidades de coordinador académico.</p>
          </div>
        )}

        {/* Sección de Gestión de Alumnos */}
        {seccionActual === "alumnos" && (
          <div className={styles.seccion}>
            <h1>Gestión de Alumnos</h1>
            <p>Visualiza y gestiona todos los alumnos inscritos en la carrera de <strong>{usuario?.carrera_nombre}</strong>.</p>
            
            {cargandoAlumnos ? (
              <div className={styles.skeletonRows}>
                <div className={styles.skeletonRow} />
                <div className={styles.skeletonRow} />
                <div className={styles.skeletonRow} />
              </div>
            ) : alumnos.length > 0 ? (
              <UsuariosList 
                carreraId={usuario?.carrera_id} 
                alumnosFiltrados={alumnos}
                onAlumnoCreated={refetchAlumnos}
                onVerDetalleAlumno={abrirDetalleAlumno}
              />
            ) : (
              <p className={styles.emptyState}>No hay alumnos registrados en esta carrera.</p>
            )}
          </div>
        )}

        {seccionActual === "alumno_detalle" && (
          <div className={styles.seccion}>
            <button className={`${styles.boton} ${styles.secundario}`} onClick={volverAAlumnos}>
              Regresar a alumnos
            </button>

            <h1 className={styles.tituloConEspacio}>Avance del alumno</h1>

            {cargandoDetalleAlumno ? (
              <div className={styles.skeletonRows}>
                <div className={styles.skeletonRow} />
                <div className={styles.skeletonRow} />
              </div>
            ) : datosAlumnoDetalle ? (
              <>
                <div className={styles.alumnoResumenCard}>
                  <h2>{`${datosAlumnoDetalle.nombre || ""} ${datosAlumnoDetalle.apellido || ""}`.trim() || datosAlumnoDetalle.nombre_usuario}</h2>
                  <p><strong>ID:</strong> {datosAlumnoDetalle.id}</p>
                  <p><strong>Carrera:</strong> {datosAlumnoDetalle.carrera_nombre || "No especificada"}</p>
                  <p><strong>Plan:</strong> {datosAlumnoDetalle.plan_estudios || "No especificado"}</p>
                  <p><strong>Creditos cursados:</strong> {creditosAprobados} / {totalCreditosPlan}</p>

                  <div className={styles.progresoTrack}>
                    <div className={styles.progresoFill} style={{ width: `${porcentajeAvance}%` }} />
                  </div>
                  <p className={styles.progresoTexto}>{porcentajeAvance}% de avance</p>

                  <div className={styles.botonesDetalle}>
                    <button
                      className={styles.boton}
                      onClick={() => setVistaDetalleAlumno("plan")}
                    >
                      Ver plan de estudio
                    </button>
                    <button
                      className={styles.boton}
                      onClick={() => setVistaDetalleAlumno("kardex")}
                    >
                      Ver kardex
                    </button>
                  </div>
                </div>

                {vistaDetalleAlumno === "plan" && (
                  <div className={styles.detalleBloque}>
                    <h2>Plan de estudio y avance</h2>
                    {Object.keys(materiasPorSemestre).length === 0 ? (
                      <p>No hay materias del plan para mostrar.</p>
                    ) : (
                      Object.keys(materiasPorSemestre)
                        .map(Number)
                        .sort((a, b) => a - b)
                        .map((semestre) => (
                          <div key={semestre} className={styles.semestreBloque}>
                            <h3>Semestre {semestre}</h3>
                            <div className={styles.listaMateriasPlan}>
                              {materiasPorSemestre[semestre].map((materia) => (
                                <article key={materia.id} className={styles.materiaPlanCard}>
                                  <p className={styles.materiaCodigo}>{materia.codigo}</p>
                                  <p className={styles.materiaNombre}>{materia.nombre}</p>
                                  <p className={styles.materiaMeta}>{materia.creditos} creditos</p>
                                  <span className={styles[`estatus_${materia.estatus}`] || styles.estatus_default}>
                                    {materia.estatus}
                                  </span>
                                </article>
                              ))}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}

                {vistaDetalleAlumno === "kardex" && (
                  <div className={styles.detalleBloque}>
                    <h2>Kardex academico</h2>

                    <div className={styles.kardexGrid}>
                      <section className={styles.kardexColumna}>
                        <h3>Cursadas</h3>
                        {materiasCursadas.length === 0 ? <p>Sin materias cursadas.</p> : materiasCursadas.map((m) => (
                          <div key={m.id} className={styles.kardexItem}>
                            <strong>{m.codigo}</strong> - {m.nombre}
                            <span> ({m.creditos} cr){typeof m.calificacion === "number" ? ` - ${m.calificacion}` : ""}</span>
                          </div>
                        ))}
                      </section>

                      <section className={styles.kardexColumna}>
                        <h3>Por cursar</h3>
                        {materiasPorCursar.length === 0 ? <p>Sin materias pendientes.</p> : materiasPorCursar.map((m) => (
                          <div key={m.id} className={styles.kardexItem}>
                            <strong>{m.codigo}</strong> - {m.nombre}
                            <span> ({m.creditos} cr)</span>
                          </div>
                        ))}
                      </section>

                      <section className={styles.kardexColumna}>
                        <h3>Reprobadas</h3>
                        {materiasReprobadas.length === 0 ? <p>Sin materias reprobadas.</p> : materiasReprobadas.map((m) => (
                          <div key={m.id} className={styles.kardexItem}>
                            <strong>{m.codigo}</strong> - {m.nombre}
                            <span> ({m.creditos} cr){typeof m.calificacion === "number" ? ` - ${m.calificacion}` : ""}</span>
                          </div>
                        ))}
                      </section>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className={styles.emptyState}>No fue posible cargar el detalle del alumno.</p>
            )}
          </div>
        )}

        {/* Sección de Gestión de Materias */}
        {seccionActual === "materias" && (
          <div className={styles.seccion}>
            <h1>Gestión de Materias</h1>
            <p>Administra las materias de la carrera y supervisa su oferta académica.</p>
            
            {cargandoMaterias ? (
              <p className={styles.loadingState}>Cargando materias...</p>
            ) : materias.length > 0 ? (
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre de la Materia</th>
                    <th>Créditos</th>
                    <th>Bloque</th>
                    <th>Semestre sugerido</th>
                    <th>Origen</th>
                    <th>Minor</th>
                  </tr>
                </thead>
                <tbody>
                  {materias.map((materia) => (
                    <tr key={`${materia.id}-${materia.origen_oferta}-${materia.minor_nombre || "base"}`}>
                      <td>{materia.codigo}</td>
                      <td>{materia.nombre}</td>
                      <td>{materia.creditos}</td>
                      <td>{materia.tipo_bloque}</td>
                      <td>{materia.semestre ?? "Sin definir"}</td>
                      <td>{materia.origen_oferta === "plan_fijo" ? "Plan fijo" : materia.origen_oferta === "minor" ? "Minor" : "Oferta carrera"}</td>
                      <td>{materia.minor_nombre || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.emptyState}>No hay materias disponibles para esta carrera.</p>
            )}
          </div>
        )}

        {/* Sección de Horarios */}
        {seccionActual === "horarios" && (
          <div className={styles.seccion}>
            <h1>Horarios y Secciones</h1>
            <p>Consulta y administra los horarios de clases y secciones de la carrera.</p>
            
            {cargandoHorarios ? (
              <p className={styles.loadingState}>Cargando horarios...</p>
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
              <p className={styles.emptyState}>No hay horarios disponibles para esta carrera.</p>
            )}
          </div>
        )}

        {/* Sección de Reportes */}
        {seccionActual === "reportes" && (
          <div className={styles.seccion}>
            <h1>Reportes Académicos</h1>
            <p>Genera y consulta reportes sobre desempeño académico, inscripciones y estadísticas de la carrera.</p>
            
            <div className={styles.reportesDisponibles}>
              <h2>Reportes Disponibles</h2>
              
              <button 
                className={`${styles.boton} ${styles.reporteBoton}`}
                onClick={() => usuario?.carrera_id && coordinadorService.getReporteInscripciones(usuario.carrera_id, filtroSemestre !== 'todos' ? filtroSemestre : undefined, filtroPeriodo)}
              >
                📊 Reporte de Inscripciones
              </button>
              <button 
                className={`${styles.boton} ${styles.reporteBoton}`}
                onClick={() => usuario?.carrera_id && coordinadorService.getReporteRendimiento(usuario.carrera_id, filtroSemestre !== 'todos' ? filtroSemestre : undefined, filtroPeriodo)}
              >
                📈 Reporte de Rendimiento
              </button>
              <button 
                className={`${styles.boton} ${styles.reporteBoton}`}
                onClick={() => usuario?.carrera_id && coordinadorService.getReporteDesercion(usuario.carrera_id, filtroSemestre !== 'todos' ? filtroSemestre : undefined, filtroPeriodo)}
              >
                📋 Reporte de Deserción
              </button>
              <button 
                className={`${styles.boton} ${styles.reporteBoton}`}
                onClick={() => usuario?.carrera_id && coordinadorService.getReporteAprobacion(usuario.carrera_id, filtroSemestre !== 'todos' ? filtroSemestre : undefined, filtroPeriodo)}
              >
                🎯 Reporte de Aprobación
              </button>
            </div>

            <h2 className={styles.filtrosTitulo}>Filtros de Reportes</h2>
            <div className={styles.filtrosGrid}>
              <div className={styles.filtroItem}>
                <label className={styles.filtroLabel}>Semestre:</label>
                <select 
                  value={filtroSemestre}
                  onChange={(e) => setFiltroSemestre(e.target.value)}
                  className={styles.filtroSelect}
                >
                  <option value="todos">Todos</option>
                  <option value="1">1er Semestre</option>
                  <option value="2">2do Semestre</option>
                  <option value="3">3er Semestre</option>
                  <option value="4">4to Semestre</option>
                </select>
              </div>
              <div className={styles.filtroItem}>
                <label className={styles.filtroLabel}>Período Académico:</label>
                <select 
                  value={filtroPeriodo}
                  onChange={(e) => setFiltroPeriodo(e.target.value)}
                  className={styles.filtroSelect}
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
