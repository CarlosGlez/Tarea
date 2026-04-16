import { useEffect, useState } from "react"
import { Sidebar } from "../components/Sidebar"
import { UsuariosList } from "../components/UsuariosList"
import { CarrerasList } from "../components/CarrerasList"
import { PlanesBuilder } from "../components/PlanesBuilder"
import { StudyPlanProgress } from "../components/StudyPlanProgress"
import { useAlumnosByCarrera, useMateriasByCarrera, useHorariosByCarrera, useEstadisticasByCarrera } from "../hooks/useCoordinador"
import * as coordinadorService from "../data/coordinadorService"
import type { EstatusMateria } from "../data/coordinadorService"
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

interface EdicionMateriaForm {
  estatus: EstatusMateria
  calificacion: string
  periodo: string
}

const estatusCalificables: EstatusMateria[] = ["aprobada", "no_aprobada", "revalidar"]

const etiquetasEstatus: Record<EstatusMateria, string> = {
  aprobada: "Aprobada",
  no_aprobada: "Reprobada",
  no_cursada: "Por cursar",
  revalidar: "Revalidada",
  cursando: "Cursando",
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
  const [subseccionCarreras, setSubseccionCarreras] = useState<"carreras" | "planes">("carreras")
  // Estados para filtros de reportes
  const [filtroSemestre, setFiltroSemestre] = useState("todos")
  const [filtroPeriodo, setFiltroPeriodo] = useState("2024-2025")
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<Alumno | null>(null)
  const [datosAlumnoDetalle, setDatosAlumnoDetalle] = useState<AlumnoDatos | null>(null)
  const [materiasAlumnoDetalle, setMateriasAlumnoDetalle] = useState<Materia[]>([])
  const [cargandoDetalleAlumno, setCargandoDetalleAlumno] = useState(false)
  const [vistaDetalleAlumno, setVistaDetalleAlumno] = useState<"plan" | "kardex">("plan")
  const [edicionesMateria, setEdicionesMateria] = useState<Record<number, EdicionMateriaForm>>({})
  const [guardandoMateriaId, setGuardandoMateriaId] = useState<number | null>(null)
  const [mensajeMateria, setMensajeMateria] = useState<string | null>(null)
  const [errorMateria, setErrorMateria] = useState<string | null>(null)

  // Usar hooks de coordinador
  const { alumnos, cargando: cargandoAlumnos, refetch: refetchAlumnos } = useAlumnosByCarrera(null)
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
        setEdicionesMateria({})
      })
      .finally(() => setCargandoDetalleAlumno(false))
  }, [alumnoSeleccionado])

  useEffect(() => {
    const siguienteEdicion: Record<number, EdicionMateriaForm> = {}

    materiasAlumnoDetalle.forEach((materia) => {
      const estatus = (materia.estatus || "no_cursada") as EstatusMateria
      siguienteEdicion[materia.id] = {
        estatus,
        calificacion: typeof materia.calificacion === "number" ? String(materia.calificacion) : "",
        periodo: materia.periodo || "",
      }
    })

    setEdicionesMateria(siguienteEdicion)
    setMensajeMateria(null)
    setErrorMateria(null)
  }, [materiasAlumnoDetalle])

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

  const actualizarEdicionMateria = (
    materiaId: number,
    campo: keyof EdicionMateriaForm,
    valor: string
  ) => {
    setEdicionesMateria((prev) => ({
      ...prev,
      [materiaId]: {
        estatus: (prev[materiaId]?.estatus || "no_cursada") as EstatusMateria,
        calificacion: prev[materiaId]?.calificacion || "",
        periodo: prev[materiaId]?.periodo || "",
        [campo]: valor,
      },
    }))
  }

  const guardarAvanceMateria = async (materia: Materia) => {
    if (!usuario?.carrera_id || !alumnoSeleccionado) {
      setErrorMateria("No se pudo identificar la carrera o alumno para guardar cambios.")
      return
    }

    const edicion = edicionesMateria[materia.id]
    const estatus = (edicion?.estatus || "no_cursada") as EstatusMateria
    const requiereCalificacion = estatusCalificables.includes(estatus)
    let calificacion: number | null = null

    if (requiereCalificacion) {
      const textoCalificacion = (edicion?.calificacion || "").trim()
      if (!textoCalificacion) {
        setErrorMateria(`La materia ${materia.codigo} requiere calificacion para el estatus seleccionado.`)
        setMensajeMateria(null)
        return
      }

      calificacion = Number(textoCalificacion)
      if (Number.isNaN(calificacion) || calificacion < 0 || calificacion > 100) {
        setErrorMateria(`La calificacion de ${materia.codigo} debe estar entre 0 y 100.`)
        setMensajeMateria(null)
        return
      }
    }

    try {
      setGuardandoMateriaId(materia.id)
      setErrorMateria(null)
      setMensajeMateria(null)

      await coordinadorService.updateAvanceMateriaAlumno(usuario.carrera_id, alumnoSeleccionado.id, materia.id, {
        estatus,
        calificacion,
        periodo: (edicion?.periodo || "").trim() || null,
      })

      const materiasActualizadas = await getMateriasAlumno(alumnoSeleccionado.id)
      setMateriasAlumnoDetalle(materiasActualizadas)
      setMensajeMateria(`Se actualizo ${materia.codigo} correctamente.`)
    } catch (err) {
      console.error("Error actualizando avance de materia:", err)
      setErrorMateria(`No fue posible actualizar ${materia.codigo}.`)
      setMensajeMateria(null)
    } finally {
      setGuardandoMateriaId(null)
    }
  }

  const materiasCursadas = materiasAlumnoDetalle.filter((materia) => materia.estatus === "aprobada" || materia.estatus === "revalidar")
  const materiasEnCurso = materiasAlumnoDetalle.filter((materia) => materia.estatus === "cursando")
  const materiasPorCursar = materiasAlumnoDetalle.filter((materia) => materia.estatus === "no_cursada")
  const materiasReprobadas = materiasAlumnoDetalle.filter((materia) => materia.estatus === "no_aprobada")

  // Elementos del menú de la sidebar
  const menuItems = [
    { label: "Inicio", icon: "fa-home", onClick: () => setSeccionActual("inicio") },
    { label: "Alumnos", icon: "fa-users", onClick: () => setSeccionActual("alumnos") },
    { label: "Gestión de Carreras", icon: "fa-graduation-cap", onClick: () => setSeccionActual("carreras") },
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
            <h1>Alumnos</h1>
            <p>Visualiza y gestiona los alumnos de todas las carreras.</p>
            
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
                onAlumnosChanged={refetchAlumnos}
                onVerDetalleAlumno={abrirDetalleAlumno}
              />
            ) : (
              <p className={styles.emptyState}>No hay alumnos registrados.</p>
            )}
          </div>
        )}

        {/* Sección de Gestión de Carreras */}
        {seccionActual === "carreras" && (
          <div className={styles.seccion}>
            <h1>Gestión de Carreras</h1>
            <p>Administra carreras y diseña planes de estudio por semestre desde un editor interactivo.</p>

            <div className={styles.submenuTabs}>
              <button
                className={`${styles.submenuTabButton} ${subseccionCarreras === "carreras" ? styles.activeSubmenuTab : ""}`}
                onClick={() => setSubseccionCarreras("carreras")}
                type="button"
              >
                Carreras
              </button>
              <button
                className={`${styles.submenuTabButton} ${subseccionCarreras === "planes" ? styles.activeSubmenuTab : ""}`}
                onClick={() => setSubseccionCarreras("planes")}
                type="button"
              >
                Planes Interactivos
              </button>
            </div>

            {subseccionCarreras === "carreras" ? (
              <CarrerasList soloLectura />
            ) : (
              <PlanesBuilder carreraFijaId={usuario?.carrera_id || null} />
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

                {vistaDetalleAlumno === "plan" && (
                  <div className={styles.detalleBloque}>
                    {mensajeMateria && <p className={styles.mensajeExito}>{mensajeMateria}</p>}
                    {errorMateria && <p className={styles.mensajeError}>{errorMateria}</p>}
                    <StudyPlanProgress
                      materias={materiasAlumnoDetalle}
                      title="Plan de estudio y avance"
                      subtitle="Actualiza el estatus de cada materia directamente desde esta vista."
                      student={{
                        nombre: `${datosAlumnoDetalle.nombre || ""} ${datosAlumnoDetalle.apellido || ""}`.trim() || datosAlumnoDetalle.nombre_usuario,
                        identificador: datosAlumnoDetalle.matricula || datosAlumnoDetalle.id,
                        carrera: datosAlumnoDetalle.carrera_nombre || "No especificada",
                        plan: datosAlumnoDetalle.plan_estudios || "No especificado",
                        estatus: datosAlumnoDetalle.estatus_academico || "No especificado",
                        avatarUrl: datosAlumnoDetalle.imagen_url || null,
                      }}
                      emptyMessage="No hay materias del plan para mostrar."
                      renderMateriaActions={(materia) => (
                        <div className={styles.editorMateria}>
                          <label className={styles.editorLabel} htmlFor={`estatus-${materia.id}`}>
                            Estatus
                          </label>
                          <select
                            id={`estatus-${materia.id}`}
                            className={styles.editorSelect}
                            value={edicionesMateria[materia.id]?.estatus || "no_cursada"}
                            onChange={(e) => actualizarEdicionMateria(materia.id, "estatus", e.target.value)}
                          >
                            {Object.entries(etiquetasEstatus).map(([valor, etiqueta]) => (
                              <option key={valor} value={valor}>
                                {etiqueta}
                              </option>
                            ))}
                          </select>

                          <label className={styles.editorLabel} htmlFor={`periodo-${materia.id}`}>
                            Periodo
                          </label>
                          <input
                            id={`periodo-${materia.id}`}
                            className={styles.editorInput}
                            type="text"
                            placeholder="Ej: AGO-DIC 2026"
                            value={edicionesMateria[materia.id]?.periodo || ""}
                            onChange={(e) => actualizarEdicionMateria(materia.id, "periodo", e.target.value)}
                          />

                          {estatusCalificables.includes(
                            (edicionesMateria[materia.id]?.estatus || "no_cursada") as EstatusMateria
                          ) && (
                            <>
                              <label className={styles.editorLabel} htmlFor={`calificacion-${materia.id}`}>
                                Calificacion
                              </label>
                              <input
                                id={`calificacion-${materia.id}`}
                                className={styles.editorInput}
                                type="number"
                                min={0}
                                max={100}
                                step="0.01"
                                placeholder="0 - 100"
                                value={edicionesMateria[materia.id]?.calificacion || ""}
                                onChange={(e) => actualizarEdicionMateria(materia.id, "calificacion", e.target.value)}
                              />
                            </>
                          )}

                          <button
                            className={`${styles.boton} ${styles.botonGuardarMateria}`}
                            type="button"
                            disabled={guardandoMateriaId === materia.id}
                            onClick={() => {
                              guardarAvanceMateria(materia)
                            }}
                          >
                            {guardandoMateriaId === materia.id ? "Guardando..." : "Guardar cambios"}
                          </button>
                        </div>
                      )}
                    />
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
                        <h3>En curso</h3>
                        {materiasEnCurso.length === 0 ? <p>Sin materias en curso.</p> : materiasEnCurso.map((m) => (
                          <div key={m.id} className={styles.kardexItem}>
                            <strong>{m.codigo}</strong> - {m.nombre}
                            <span> ({m.creditos} cr){m.periodo ? ` - ${m.periodo}` : ""}</span>
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
