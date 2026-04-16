import { type CSSProperties, type ReactNode, useMemo, useState } from "react"
import type { Materia } from "../types/Materia"
import styles from "./StudyPlanProgress.module.css"

interface StudyPlanStudentInfo {
  nombre?: string
  identificador?: string | number
  carrera?: string | null
  plan?: string | null
  estatus?: string | null
  avatarUrl?: string | null
}

interface StudyPlanProgressProps {
  materias: Materia[]
  loading?: boolean
  title?: string
  subtitle?: string
  student?: StudyPlanStudentInfo
  emptyMessage?: string
  renderMateriaActions?: (materia: Materia) => ReactNode
  enableMateriaQuickView?: boolean
}

type StatusKey = "aprobada" | "revalidar" | "no_aprobada" | "cursando" | "no_cursada" | "default"

const STATUS_LABELS: Record<StatusKey, string> = {
  aprobada: "Aprobada",
  revalidar: "Revalidada",
  no_aprobada: "Reprobada",
  cursando: "Cursando",
  no_cursada: "Por cursar",
  default: "Sin estatus",
}

const getStatusKey = (estatus?: string | null): StatusKey => {
  switch ((estatus || "").toLowerCase()) {
    case "aprobada":
      return "aprobada"
    case "revalidar":
      return "revalidar"
    case "no_aprobada":
      return "no_aprobada"
    case "cursando":
      return "cursando"
    case "no_cursada":
      return "no_cursada"
    default:
      return "default"
  }
}

const getStatusClassName = (status: StatusKey) => {
  switch (status) {
    case "aprobada":
    case "revalidar":
      return styles.subjectApproved
    case "no_aprobada":
      return styles.subjectFailed
    case "cursando":
      return styles.subjectInProgress
    case "no_cursada":
      return styles.subjectPending
    default:
      return styles.subjectDefault
  }
}

const getAvatarFallback = (nombre?: string) => {
  if (!nombre) return "AL"

  const partes = nombre
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2)

  if (partes.length === 0) return "AL"
  return partes.map((item) => item[0]?.toUpperCase() || "").join("")
}

const getCalificacionValue = (calificacion: unknown) => {
  if (typeof calificacion === "number" && !Number.isNaN(calificacion)) {
    return calificacion
  }

  if (typeof calificacion === "string") {
    const texto = calificacion.trim()
    if (!texto) return null

    const numero = Number(texto)
    return Number.isNaN(numero) ? null : numero
  }

  return null
}

export const StudyPlanProgress = ({
  materias,
  loading = false,
  title = "Plan de estudios",
  subtitle = "Vista del avance academico por semestre.",
  student,
  emptyMessage = "No hay materias del plan para mostrar.",
  renderMateriaActions,
  enableMateriaQuickView = false,
}: StudyPlanProgressProps) => {
  const [materiaActivaId, setMateriaActivaId] = useState<number | null>(null)

  const materiasOrdenadas = useMemo(
    () => [...materias].sort((left, right) => left.semestre - right.semestre || left.nombre.localeCompare(right.nombre)),
    [materias]
  )

  const semestres = useMemo(() => {
    const valores = Array.from(
      new Set(
        materiasOrdenadas
          .map((materia) => materia.semestre)
          .filter((semestre) => Number.isFinite(semestre) && semestre > 0)
      )
    ).sort((left, right) => left - right)

    return valores
  }, [materiasOrdenadas])

  const materiasPorSemestre = useMemo(() => {
    const grouped = new Map<number, Materia[]>()

    semestres.forEach((semestre) => grouped.set(semestre, []))

    materiasOrdenadas.forEach((materia) => {
      if (!grouped.has(materia.semestre)) return
      grouped.get(materia.semestre)?.push(materia)
    })

    return grouped
  }, [materiasOrdenadas, semestres])

  const totalCreditosPlan = materias.reduce((acc, materia) => acc + materia.creditos, 0)
  const creditosAprobados = materias
    .filter((materia) => {
      const status = getStatusKey(materia.estatus)
      return status === "aprobada" || status === "revalidar"
    })
    .reduce((acc, materia) => acc + materia.creditos, 0)
  const porcentajeAvance = totalCreditosPlan > 0 ? Math.round((creditosAprobados / totalCreditosPlan) * 100) : 0

  const resumen = materias.reduce(
    (acc, materia) => {
      const status = getStatusKey(materia.estatus)
      acc[status] += 1
      return acc
    },
    {
      aprobada: 0,
      revalidar: 0,
      no_aprobada: 0,
      cursando: 0,
      no_cursada: 0,
      default: 0,
    } satisfies Record<StatusKey, number>
  )

  const ringStyle = {
    "--progress-value": `${porcentajeAvance}%`,
  } as CSSProperties

  const materiaActiva = useMemo(
    () => materiasOrdenadas.find((materia) => materia.id === materiaActivaId) || null,
    [materiasOrdenadas, materiaActivaId]
  )

  const quickViewEnabled = enableMateriaQuickView && !renderMateriaActions

  const onClickMateria = (materiaId: number) => {
    setMateriaActivaId((currentId) => (currentId === materiaId ? null : materiaId))
  }

  if (loading) {
    return <div className={styles.loadingState}>Cargando plan de estudios...</div>
  }

  if (materias.length === 0 || semestres.length === 0) {
    return <div className={styles.emptyState}>{emptyMessage}</div>
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.titleBlock}>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className={styles.topGrid}>
        <article className={styles.progressPanel}>
          <div>
            <p className={styles.panelEyebrow}>Progreso</p>
            <h3>Avance del plan</h3>
            <p className={styles.panelText}>Creditos aprobados sobre el total del programa.</p>
          </div>

          <div className={styles.progressContent}>
            <div className={styles.progressRing} style={ringStyle}>
              <div className={styles.progressRingInner}>
                <strong>{porcentajeAvance}%</strong>
                <span>completado</span>
              </div>
            </div>

            <div className={styles.progressMetrics}>
              <div className={styles.metricCard}>
                <span>Creditos</span>
                <strong>{creditosAprobados} / {totalCreditosPlan}</strong>
              </div>
              <div className={styles.metricCard}>
                <span>Materias terminadas</span>
                <strong>{resumen.aprobada + resumen.revalidar}</strong>
              </div>
              <div className={styles.metricCard}>
                <span>En curso</span>
                <strong>{resumen.cursando}</strong>
              </div>
            </div>
          </div>
        </article>

        <article className={styles.studentPanel}>
          <div className={styles.studentIdentity}>
            {student?.avatarUrl ? (
              <img src={student.avatarUrl} alt={student.nombre || "Alumno"} className={styles.studentAvatar} />
            ) : (
              <div className={styles.studentAvatarFallback}>{getAvatarFallback(student?.nombre)}</div>
            )}

            <div>
              <p className={styles.panelEyebrow}>Alumno</p>
              <h3>{student?.nombre || "Alumno"}</h3>
              <p className={styles.panelText}>{student?.carrera || "Carrera no especificada"}</p>
            </div>
          </div>

          <div className={styles.studentInfoGrid}>
            <div className={styles.studentInfoItem}>
              <span>ID</span>
              <strong>{student?.identificador || "-"}</strong>
            </div>
            <div className={styles.studentInfoItem}>
              <span>Plan</span>
              <strong>{student?.plan || "No especificado"}</strong>
            </div>
            <div className={styles.studentInfoItem}>
              <span>Estatus</span>
              <strong>{student?.estatus || "No especificado"}</strong>
            </div>
            <div className={styles.studentInfoItem}>
              <span>Total de materias</span>
              <strong>{materias.length}</strong>
            </div>
          </div>
        </article>
      </div>

      <div className={styles.legend}>
        <span className={`${styles.legendItem} ${styles.subjectApproved}`}>Aprobada</span>
        <span className={`${styles.legendItem} ${styles.subjectFailed}`}>Reprobada</span>
        <span className={`${styles.legendItem} ${styles.subjectInProgress}`}>Cursando</span>
        <span className={`${styles.legendItem} ${styles.subjectPending}`}>Por cursar</span>
      </div>

      {quickViewEnabled && (
        <div className={styles.quickViewHint}>Haz clic en una materia para ver su detalle academico.</div>
      )}

      <div className={styles.planScroller}>
        <div className={styles.semestersGrid} style={{ "--columns": semestres.length } as CSSProperties}>
          {semestres.map((semestre) => {
            const materiasSemestre = materiasPorSemestre.get(semestre) || []
            const creditosSemestre = materiasSemestre.reduce((acc, materia) => acc + materia.creditos, 0)

            return (
              <section key={semestre} className={styles.semesterColumn}>
                <header className={styles.semesterHeader}>
                  <span className={styles.semesterNumber}>{semestre}</span>
                  <div>
                    <h3>Semestre {semestre}</h3>
                    <p>{creditosSemestre} creditos</p>
                  </div>
                </header>

                <div className={styles.subjectsList}>
                  {materiasSemestre.map((materia) => {
                    const statusKey = getStatusKey(materia.estatus)
                    const isActiva = materia.id === materiaActivaId

                    return (
                      <article
                        key={materia.id}
                        className={`${styles.subjectCard} ${getStatusClassName(statusKey)} ${
                          isActiva ? styles.subjectCardActive : ""
                        } ${quickViewEnabled ? styles.subjectCardInteractive : ""}`}
                        onClick={quickViewEnabled ? () => onClickMateria(materia.id) : undefined}
                        role={quickViewEnabled ? "button" : undefined}
                        tabIndex={quickViewEnabled ? 0 : undefined}
                        onKeyDown={
                          quickViewEnabled
                            ? (event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault()
                                  onClickMateria(materia.id)
                                }
                              }
                            : undefined
                        }
                      >
                        <div className={styles.subjectTopRow}>
                          <p className={styles.subjectCode}>{materia.codigo}</p>
                          <span className={styles.statusPill}>{STATUS_LABELS[statusKey]}</span>
                        </div>

                        <p className={styles.subjectName}>{materia.nombre}</p>
                        <p className={styles.subjectMeta}>{materia.creditos} creditos</p>

                        {!quickViewEnabled && (getCalificacionValue(materia.calificacion) !== null || materia.periodo) && (
                          <div className={styles.subjectDetails}>
                            {getCalificacionValue(materia.calificacion) !== null && (
                              <span>Calificacion: {getCalificacionValue(materia.calificacion)}</span>
                            )}
                            {materia.periodo && <span>Periodo: {materia.periodo}</span>}
                          </div>
                        )}

                        {renderMateriaActions && <div className={styles.actionSlot}>{renderMateriaActions(materia)}</div>}
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      {quickViewEnabled && materiaActiva && (
        <section className={styles.quickViewPanel}>
          <header className={styles.quickViewHeader}>
            <p className={styles.quickViewCode}>{materiaActiva.codigo}</p>
            <span className={`${styles.statusPill} ${getStatusClassName(getStatusKey(materiaActiva.estatus))}`}>
              {STATUS_LABELS[getStatusKey(materiaActiva.estatus)]}
            </span>
          </header>

          <h3 className={styles.quickViewName}>{materiaActiva.nombre}</h3>
          <p className={styles.quickViewMeta}>{materiaActiva.creditos} creditos - Semestre {materiaActiva.semestre}</p>

          <div className={styles.quickViewGrid}>
            <article className={styles.quickViewItem}>
              <span>Calificacion</span>
              <strong>
                {getCalificacionValue(materiaActiva.calificacion) !== null
                  ? getCalificacionValue(materiaActiva.calificacion)
                  : "Sin registro"}
              </strong>
            </article>
            <article className={styles.quickViewItem}>
              <span>Periodo cursado</span>
              <strong>{materiaActiva.periodo || "Sin registro"}</strong>
            </article>
          </div>
        </section>
      )}
    </section>
  )
}