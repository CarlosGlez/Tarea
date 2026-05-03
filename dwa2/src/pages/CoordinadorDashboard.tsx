import { useEffect, useState } from "react"
import { Sidebar } from "../components/Sidebar"
import { SectionTransition } from "../components/SectionTransition"
import { UsuariosList } from "../components/UsuariosList"
import { CarrerasList } from "../components/CarrerasList"
import { PlanesBuilder } from "../components/PlanesBuilder"
import { StudyPlanProgress } from "../components/StudyPlanProgress"
import { Chat } from "../components/Chat"
import { Anuncios } from "../components/Anuncios"
import { useAlumnosByCarrera, useMateriasByCarrera, useHorariosByCarrera, useEstadisticasByCarrera } from "../hooks/useCoordinador"
import { Reportes } from "../components/Reportes"
import * as coordinadorService from "../data/coordinadorService"
import type { EstatusMateria, ReporteInscripcionItem, ReporteRendimientoItem, ReporteDesercion, ReporteAprobacionItem } from "../data/coordinadorService"
import { getAlumnoDatos, type AlumnoDatos } from "../data/usuariosService"
import { getMateriasAlumno } from "../data/materiasService"
import { getChatSinLeerTotal } from "../data/chatService"
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
  // Estados para reportes
  type TipoReporte = "inscripciones" | "rendimiento" | "desercion" | "aprobacion"
  const [reporteActivo, setReporteActivo] = useState<TipoReporte | null>(null)
  const [cargandoReporte, setCargandoReporte] = useState(false)
  const [errorReporte, setErrorReporte] = useState<string | null>(null)
  const [datosInscripciones, setDatosInscripciones] = useState<ReporteInscripcionItem[]>([])
  const [datosRendimiento, setDatosRendimiento] = useState<ReporteRendimientoItem[]>([])
  const [datosDesercion, setDatosDesercion] = useState<ReporteDesercion | null>(null)
  const [datosAprobacion, setDatosAprobacion] = useState<ReporteAprobacionItem[]>([])
  // Filtros de reportes
  const [filtroSemestre, setFiltroSemestre] = useState("todos")
  const [filtroPeriodo, setFiltroPeriodo] = useState("")
  const [filtroAnio, setFiltroAnio] = useState("")
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
  const [chatBadge, setChatBadge] = useState(0)

  // Polling badge de chat cada 30s
  useEffect(() => {
    if (!usuario?.id) return
    const fetchChatBadge = async () => {
      const total = await getChatSinLeerTotal(usuario.id, 'coordinador')
      setChatBadge(total)
    }
    fetchChatBadge()
    const interval = setInterval(fetchChatBadge, 30000)
    return () => clearInterval(interval)
  }, [usuario?.id])

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
    let cancelled = false
    setCargandoDetalleAlumno(true)

    Promise.all([
      getAlumnoDatos(alumnoSeleccionado.id),
      getMateriasAlumno(alumnoSeleccionado.id),
    ])
      .then(([datos, materias]) => {
        if (cancelled) return
        setDatosAlumnoDetalle(datos)
        setMateriasAlumnoDetalle(materias)
      })
      .catch((err) => {
        if (cancelled) return
        console.error("Error cargando detalle del alumno:", err)
        setDatosAlumnoDetalle(null)
        setMateriasAlumnoDetalle([])
        setEdicionesMateria({})
      })
      .finally(() => { if (!cancelled) setCargandoDetalleAlumno(false) })

    return () => { cancelled = true }
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
    setAlumnoSeleccionado(alumno)
    setVistaDetalleAlumno("plan")
    setSeccionActual("alumno_detalle")
  }

  const volverAAlumnos = () => {
    setSeccionActual("alumnos")
  }

  const cargarReporte = async (tipo: TipoReporte) => {
    if (!usuario?.carrera_id) return
    setReporteActivo(tipo)
    setCargandoReporte(true)
    setErrorReporte(null)

    try {
      if (tipo === "inscripciones") {
        const data = await coordinadorService.getReporteInscripciones(usuario.carrera_id, filtroPeriodo || undefined)
        setDatosInscripciones(data ?? [])
      } else if (tipo === "rendimiento") {
        const data = await coordinadorService.getReporteRendimiento(usuario.carrera_id, filtroSemestre !== "todos" ? filtroSemestre : undefined)
        setDatosRendimiento(data ?? [])
      } else if (tipo === "desercion") {
        const data = await coordinadorService.getReporteDesercion(usuario.carrera_id, filtroAnio || undefined)
        setDatosDesercion(data)
      } else if (tipo === "aprobacion") {
        const data = await coordinadorService.getReporteAprobacion(usuario.carrera_id, filtroSemestre !== "todos" ? filtroSemestre : undefined)
        setDatosAprobacion(data ?? [])
      }
    } catch {
      setErrorReporte("No se pudo cargar el reporte")
    } finally {
      setCargandoReporte(false)
    }
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
    { label: "Anuncios", icon: "fa-bullhorn", onClick: () => setSeccionActual("anuncios") },
    { label: "Chat", icon: "fa-comments", badge: chatBadge, onClick: () => { setSeccionActual("chat"); setChatBadge(0) } },
    { label: "Cerrar sesión", icon: "fa-sign-out-alt", onClick: handleLogout },
  ]

  const menuSecciones = ["inicio", "alumnos", "carreras", "materias", "horarios", "reportes", "anuncios", "chat"]
  const seccionParaMenu = seccionActual === "alumno_detalle" ? "alumnos" : seccionActual
  const activeMenuIndex = menuSecciones.indexOf(seccionParaMenu)

  return (
    <div className={styles.container}>
      {/* Sidebar reutilizable */}
      <Sidebar title="MiKardex - Coordinador" menuItems={menuItems} activeIndex={activeMenuIndex} />

      {/* Contenido principal */}
      <div className={styles.contenido}>
        <SectionTransition key={`${seccionActual}-${subseccionCarreras}-${vistaDetalleAlumno}`}>
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
              <div className={styles.tablaScroll}>
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
              </div>
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
            <div className={styles.enDesarrolloContainer}>
              <div className={styles.enDesarrolloBadge}>
                <i className="fas fa-tools" style={{ marginRight: "0.5rem" }}></i>
                En Desarrollo
              </div>
              <p className={styles.enDesarrolloMsg}>
                Esta sección se encuentra actualmente en desarrollo. Próximamente podrás consultar y administrar los horarios de clases desde aquí.
              </p>
            </div>
          </div>
        )}

        {/* Sección de Anuncios */}
        {seccionActual === "anuncios" && usuario && (
          <div className={styles.seccion}>
            <h1>Anuncios</h1>
            <p>Publica comunicados para los alumnos de una carrera específica o de todas las carreras.</p>
            <Anuncios usuarioId={usuario.id} rol="coordinador" />
          </div>
        )}

        {/* Sección de Reportes */}
        {seccionActual === "reportes" && (
          <div className={styles.seccion}>
            <h1>Reportes Académicos</h1>
            <p>Selecciona un tipo de reporte para generarlo.</p>

            {/* Selector de tipo de reporte */}
            <div className={styles.submenuTabs}>
              {(["inscripciones", "rendimiento", "desercion", "aprobacion"] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  className={`${styles.submenuTabButton} ${reporteActivo === tipo ? styles.activeSubmenuTab : ""}`}
                  onClick={() => cargarReporte(tipo)}
                >
                  {tipo === "inscripciones" && "Inscripciones"}
                  {tipo === "rendimiento" && "Rendimiento"}
                  {tipo === "desercion" && "Desercion"}
                  {tipo === "aprobacion" && "Aprobacion"}
                </button>
              ))}
            </div>

            {/* Filtros contextuales */}
            {reporteActivo && (
              <div className={styles.filtrosGrid}>
                {(reporteActivo === "rendimiento" || reporteActivo === "aprobacion") && (
                  <div className={styles.filtroItem}>
                    <label className={styles.filtroLabel}>Semestre:</label>
                    <select
                      value={filtroSemestre}
                      onChange={(e) => setFiltroSemestre(e.target.value)}
                      className={styles.filtroSelect}
                    >
                      <option value="todos">Todos</option>
                      {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                        <option key={s} value={String(s)}>{s}° Semestre</option>
                      ))}
                    </select>
                  </div>
                )}
                {reporteActivo === "inscripciones" && (
                  <div className={styles.filtroItem}>
                    <label className={styles.filtroLabel}>Periodo:</label>
                    <input
                      className={styles.filtroSelect}
                      type="text"
                      placeholder="Ej: 2026-A (opcional)"
                      value={filtroPeriodo}
                      onChange={(e) => setFiltroPeriodo(e.target.value)}
                    />
                  </div>
                )}
                {reporteActivo === "desercion" && (
                  <div className={styles.filtroItem}>
                    <label className={styles.filtroLabel}>Año:</label>
                    <select
                      value={filtroAnio}
                      onChange={(e) => setFiltroAnio(e.target.value)}
                      className={styles.filtroSelect}
                    >
                      <option value="">Todos los años</option>
                      {["2026", "2025", "2024", "2023"].map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className={styles.filtroItem}>
                  <label className={styles.filtroLabel}>&nbsp;</label>
                  <button
                    type="button"
                    className={styles.boton}
                    onClick={() => cargarReporte(reporteActivo)}
                  >
                    Actualizar reporte
                  </button>
                </div>
              </div>
            )}

            {/* Stat de desercion */}
            {reporteActivo === "desercion" && datosDesercion && !cargandoReporte && (
              <div className={styles.datosUsuario}>
                <p><strong>Total de bajas registradas:</strong> {datosDesercion.total}</p>
              </div>
            )}

            {/* Tablas de resultados */}
            {reporteActivo === "inscripciones" && (
              <Reportes
                titulo="Reporte de Inscripciones"
                columnas={[
                  { clave: "nombre", etiqueta: "Nombre" },
                  { clave: "apellido", etiqueta: "Apellido" },
                  { clave: "matricula", etiqueta: "Matricula" },
                  { clave: "generacion", etiqueta: "Generacion" },
                  { clave: "periodo", etiqueta: "Periodo" },
                  { clave: "fecha_inscripcion", etiqueta: "Fecha de Inscripcion" },
                ]}
                datos={datosInscripciones.map((item, i) => ({ ...item, id: i }))}
                cargando={cargandoReporte}
                error={errorReporte}
                paginacion
              />
            )}

            {reporteActivo === "rendimiento" && (
              <Reportes
                titulo="Reporte de Rendimiento Academico"
                columnas={[
                  { clave: "nombre_usuario", etiqueta: "Alumno" },
                  { clave: "matricula", etiqueta: "Matricula" },
                  { clave: "materias_cursadas", etiqueta: "Cursadas", tipo: "numero" },
                  { clave: "materias_aprobadas", etiqueta: "Aprobadas", tipo: "numero" },
                  { clave: "promedio", etiqueta: "Promedio", tipo: "numero" },
                  { clave: "estatus_academico", etiqueta: "Estatus" },
                ]}
                datos={datosRendimiento.map((item, i) => ({ ...item, id: i }))}
                cargando={cargandoReporte}
                error={errorReporte}
                paginacion
              />
            )}

            {reporteActivo === "desercion" && (
              <Reportes
                titulo="Historial de Bajas"
                columnas={[
                  { clave: "nombre", etiqueta: "Nombre" },
                  { clave: "apellido", etiqueta: "Apellido" },
                  { clave: "matricula", etiqueta: "Matricula" },
                  { clave: "generacion", etiqueta: "Generacion" },
                  { clave: "fecha_baja", etiqueta: "Fecha de Baja" },
                  { clave: "motivo", etiqueta: "Motivo" },
                ]}
                datos={(datosDesercion?.lista ?? []).map((item, i) => ({ ...item, id: i }))}
                cargando={cargandoReporte}
                error={errorReporte}
                paginacion
              />
            )}

            {reporteActivo === "aprobacion" && (
              <Reportes
                titulo="Reporte de Tasas de Aprobacion"
                columnas={[
                  { clave: "codigo", etiqueta: "Codigo" },
                  { clave: "nombre", etiqueta: "Materia" },
                  { clave: "estudiantes_totales", etiqueta: "Total", tipo: "numero" },
                  { clave: "estudiantes_aprobados", etiqueta: "Aprobados", tipo: "numero" },
                  { clave: "tasa_aprobacion", etiqueta: "Tasa %", tipo: "porcentaje" },
                ]}
                datos={datosAprobacion.map((item, i) => ({ ...item, id: i }))}
                cargando={cargandoReporte}
                error={errorReporte}
                paginacion
              />
            )}
          </div>
        )}
        </SectionTransition>

        {/* Chat siempre montado para no perder estado de conversación ni polling */}
        {usuario && (
          <div className={styles.seccion} style={{ display: seccionActual === "chat" ? undefined : "none" }}>
            <h1>Chat con Alumnos</h1>
            <p>Revisa y responde los mensajes de los alumnos de tu carrera.</p>
            <Chat usuarioId={usuario.id} rol="coordinador" />
          </div>
        )}
      </div>
    </div>
  )
}
