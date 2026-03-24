import { type ReactNode, useEffect, useMemo, useState } from "react"
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { useCarreras } from "../hooks/useCarreras"
import {
  createPlanByCarrera,
  getMateriasCatalogo,
  getPlanMaterias,
  getPlanesByCarreraId,
  savePlanMaterias,
  type MateriaCatalogo,
} from "../data/carrerasService"
import styles from "./PlanesBuilder.module.css"

interface PlanOption {
  id: number
  nombre: string
}

interface AsignacionMateria {
  materia_id: number
  semestre: number
}

type DragSource = "catalog" | "assigned"

interface DragMeta {
  materiaId: number
  source: DragSource
}

const SEMESTRES = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const getAssignedDropId = (materiaId: number) => `assigned-drop-${materiaId}`

const getMateriaIdFromAssignedDropId = (dropId: string) => {
  if (!dropId.startsWith("assigned-drop-")) {
    return null
  }

  const value = Number(dropId.replace("assigned-drop-", ""))
  return Number.isInteger(value) && value > 0 ? value : null
}

const getSemestreFromDropId = (dropId: string) => {
  if (!dropId.startsWith("semester-")) {
    return null
  }

  const value = Number(dropId.replace("semester-", ""))
  return SEMESTRES.includes(value) ? value : null
}

const getBloqueClassName = (tipoBloque: string) => {
  const normalized = tipoBloque.toLowerCase()

  if (normalized.includes("electivo")) {
    return styles.blockElectiva
  }

  if (normalized.includes("anahuac")) {
    return styles.blockAnahuac
  }

  return styles.blockProfesional
}

const getBloqueLabel = (tipoBloque: string) => {
  const normalized = tipoBloque.toLowerCase()

  if (normalized.includes("electivo")) {
    return "Electiva"
  }

  if (normalized.includes("anahuac")) {
    return "Bloque Anahuac"
  }

  return "Bloque Profesional"
}

interface DraggableMateriaCardProps {
  materia: MateriaCatalogo
  source: DragSource
  className: string
  dropId: string
  children: ReactNode
}

const DraggableMateriaCard = ({ materia, source, className, dropId, children }: DraggableMateriaCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${source}-${materia.id}`,
    data: {
      materiaId: materia.id,
      source,
    } satisfies DragMeta,
  })

  const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
    id: dropId,
  })

  const setRefs = (node: HTMLElement | null) => {
    setNodeRef(node)
    setDropNodeRef(node)
  }

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.55 : 1,
  }

  return (
    <article
      ref={setRefs}
      style={style}
      className={`${className} ${styles.draggableCard} ${isDragging ? styles.draggingCard : ""} ${isOver ? styles.cardDropTarget : ""}`}
    >
      <div className={styles.dragHandle} {...attributes} {...listeners}>
        Arrastrar
      </div>
      {children}
    </article>
  )
}

interface SemesterDropColumnProps {
  semestre: number
  children: ReactNode
}

const SemesterDropColumn = ({ semestre, children }: SemesterDropColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `semester-${semestre}`,
  })

  return (
    <article
      ref={setNodeRef}
      className={`${styles.semesterColumn} ${isOver ? styles.dropTargetActive : ""}`}
    >
      {children}
    </article>
  )
}

export const PlanesBuilder = () => {
  const { carreras, loading: loadingCarreras } = useCarreras()

  const [selectedCarreraId, setSelectedCarreraId] = useState<number | null>(null)
  const [planes, setPlanes] = useState<PlanOption[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)

  const [materiasCatalogo, setMateriasCatalogo] = useState<MateriaCatalogo[]>([])
  const [asignaciones, setAsignaciones] = useState<AsignacionMateria[]>([])

  const [loadingPanel, setLoadingPanel] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [planNombre, setPlanNombre] = useState("")
  const [planAnio, setPlanAnio] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [semestreDestino, setSemestreDestino] = useState<number>(1)
  const [activeMateriaId, setActiveMateriaId] = useState<number | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    })
  )

  const {
    setNodeRef: setCatalogDropRef,
    isOver: isOverCatalog,
  } = useDroppable({
    id: "catalog-drop",
  })

  const materiasById = useMemo(() => {
    const lookup = new Map<number, MateriaCatalogo>()
    materiasCatalogo.forEach((materia) => lookup.set(materia.id, materia))
    return lookup
  }, [materiasCatalogo])

  const idsAsignados = useMemo(() => new Set(asignaciones.map((item) => item.materia_id)), [asignaciones])

  const materiasDisponibles = useMemo(() => {
    const term = busqueda.trim().toLowerCase()

    return materiasCatalogo.filter((materia) => {
      if (idsAsignados.has(materia.id)) return false
      if (!term) return true

      return (
        materia.nombre.toLowerCase().includes(term) ||
        materia.codigo.toLowerCase().includes(term) ||
        materia.tipo_bloque.toLowerCase().includes(term)
      )
    })
  }, [busqueda, idsAsignados, materiasCatalogo])

  const materiasPorSemestre = useMemo(() => {
    const grouped = new Map<number, MateriaCatalogo[]>()

    SEMESTRES.forEach((semestre) => grouped.set(semestre, []))

    asignaciones.forEach((asignacion) => {
      const materia = materiasById.get(asignacion.materia_id)
      if (!materia || !grouped.has(asignacion.semestre)) return
      grouped.get(asignacion.semestre)?.push(materia)
    })

    grouped.forEach((materias) => materias.sort((a, b) => a.nombre.localeCompare(b.nombre)))

    return grouped
  }, [asignaciones, materiasById])

  const asignacionByMateriaId = useMemo(() => {
    const map = new Map<number, AsignacionMateria>()
    asignaciones.forEach((item) => map.set(item.materia_id, item))
    return map
  }, [asignaciones])

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingPanel(true)
      setError(null)

      try {
        const materias = await getMateriasCatalogo()
        setMateriasCatalogo(materias)
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el catalogo de materias")
      } finally {
        setLoadingPanel(false)
      }
    }

    fetchInitialData()
  }, [])

  useEffect(() => {
    if (!selectedCarreraId) {
      setPlanes([])
      setSelectedPlanId(null)
      setAsignaciones([])
      return
    }

    const fetchPlanes = async () => {
      setLoadingPanel(true)
      setError(null)

      try {
        const loadedPlanes = await getPlanesByCarreraId(selectedCarreraId)
        setPlanes(loadedPlanes)
        setSelectedPlanId(null)
        setAsignaciones([])
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar los planes")
      } finally {
        setLoadingPanel(false)
      }
    }

    fetchPlanes()
  }, [selectedCarreraId])

  useEffect(() => {
    if (!selectedPlanId) {
      setAsignaciones([])
      return
    }

    const fetchPlanMaterias = async () => {
      setLoadingPlan(true)
      setError(null)

      try {
        const materias = await getPlanMaterias(selectedPlanId)
        setAsignaciones(materias.map((item) => ({ materia_id: item.materia_id, semestre: item.semestre })))
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar las materias del plan")
      } finally {
        setLoadingPlan(false)
      }
    }

    fetchPlanMaterias()
  }, [selectedPlanId])

  const handleCrearPlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedCarreraId) {
      setError("Selecciona una carrera para crear el plan")
      return
    }

    const nombreBase = planNombre.trim()
    const anio = planAnio.trim()

    if (!nombreBase) {
      setError("El nombre del plan es obligatorio")
      return
    }

    const nombreCompleto = anio ? `${nombreBase} (${anio})` : nombreBase

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const planCreado = await createPlanByCarrera(selectedCarreraId, { nombre: nombreCompleto })
      const loadedPlanes = await getPlanesByCarreraId(selectedCarreraId)
      setPlanes(loadedPlanes)
      setSelectedPlanId(planCreado.id)
      setPlanNombre("")
      setPlanAnio("")
      setSuccess("Plan creado. Ahora puedes asignar materias por semestre.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el plan")
    } finally {
      setSubmitting(false)
    }
  }

  const handleAgregarMateria = (materiaId: number) => {
    if (idsAsignados.has(materiaId) || !selectedPlanId) return

    setAsignaciones((current) => [...current, { materia_id: materiaId, semestre: semestreDestino }])
    setSuccess(null)
  }

  const handleQuitarMateria = (materiaId: number) => {
    setAsignaciones((current) => current.filter((item) => item.materia_id !== materiaId))
    setSuccess(null)
  }

  const handleCambiarSemestre = (materiaId: number, semestre: number) => {
    setAsignaciones((current) =>
      current.map((item) => (item.materia_id === materiaId ? { ...item, semestre } : item))
    )
    setSuccess(null)
  }

  const handleGuardarDistribucion = async () => {
    if (!selectedPlanId) {
      setError("Selecciona un plan para guardar")
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      await savePlanMaterias(selectedPlanId, { materias: asignaciones })
      setSuccess("Distribucion guardada correctamente")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la distribucion")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragMeta | undefined

    if (!data) {
      return
    }

    setActiveMateriaId(data.materiaId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const data = event.active.data.current as DragMeta | undefined
    const overId = event.over ? String(event.over.id) : null

    setActiveMateriaId(null)

    if (!data || !overId || !selectedPlanId) {
      return
    }

    const targetSemestre = getSemestreFromDropId(overId)
    const targetMateriaId = getMateriaIdFromAssignedDropId(overId)

    const upsertAsignacion = (
      materiaId: number,
      newSemestre: number,
      beforeMateriaId: number | null = null
    ) => {
      setAsignaciones((current) => {
        const existingIndex = current.findIndex((item) => item.materia_id === materiaId)
        const existing = existingIndex >= 0 ? current[existingIndex] : null

        if (!existing && data.source === "assigned") {
          return current
        }

        const nextItem: AsignacionMateria = {
          materia_id: materiaId,
          semestre: newSemestre,
        }

        const withoutItem = existingIndex >= 0
          ? current.filter((_, idx) => idx !== existingIndex)
          : [...current]

        if (beforeMateriaId !== null) {
          const beforeIndex = withoutItem.findIndex((item) => item.materia_id === beforeMateriaId)

          if (beforeIndex >= 0) {
            const result = [...withoutItem]
            result.splice(beforeIndex, 0, nextItem)
            return result
          }
        }

        const lastInSemestre = [...withoutItem]
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => item.semestre === newSemestre)
          .pop()

        const insertIndex = lastInSemestre ? lastInSemestre.index + 1 : withoutItem.length
        const result = [...withoutItem]
        result.splice(insertIndex, 0, nextItem)
        return result
      })
    }

    if (targetSemestre !== null) {
      if (data.source === "catalog") {
        upsertAsignacion(data.materiaId, targetSemestre)
      }

      if (data.source === "assigned") {
        upsertAsignacion(data.materiaId, targetSemestre)
      }

      setSuccess(null)
      return
    }

    if (targetMateriaId !== null) {
      const targetAsignacion = asignacionByMateriaId.get(targetMateriaId)

      if (!targetAsignacion) {
        return
      }

      upsertAsignacion(data.materiaId, targetAsignacion.semestre, targetMateriaId)
      setSuccess(null)
      return
    }

    if (overId === "catalog-drop" && data.source === "assigned") {
      setAsignaciones((current) => current.filter((item) => item.materia_id !== data.materiaId))
      setSuccess(null)
    }
  }

  const handleDragCancel = () => {
    setActiveMateriaId(null)
  }

  const activeMateria = activeMateriaId !== null ? materiasById.get(activeMateriaId) : null

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Editor de Planes</h2>
        <p>Construye el plan de estudios asignando materias del catalogo a cada semestre.</p>
      </div>

      <div className={styles.topControls}>
        <div className={styles.selectorBlock}>
          <label htmlFor="carrera_select">Carrera</label>
          <select
            id="carrera_select"
            value={selectedCarreraId ?? ""}
            onChange={(event) => setSelectedCarreraId(event.target.value ? Number(event.target.value) : null)}
            disabled={loadingCarreras || loadingPanel}
          >
            <option value="">Selecciona una carrera</option>
            {carreras.map((carrera) => (
              <option key={carrera.id} value={carrera.id}>
                {carrera.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectorBlock}>
          <label htmlFor="plan_select">Plan</label>
          <select
            id="plan_select"
            value={selectedPlanId ?? ""}
            onChange={(event) => setSelectedPlanId(event.target.value ? Number(event.target.value) : null)}
            disabled={!selectedCarreraId || loadingPanel}
          >
            <option value="">Selecciona un plan</option>
            {planes.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.nombre}
              </option>
            ))}
          </select>
        </div>

        <form className={styles.createPlanForm} onSubmit={handleCrearPlan}>
          <div className={styles.inlineField}>
            <label htmlFor="plan_nombre">Nombre del plan</label>
            <input
              id="plan_nombre"
              type="text"
              value={planNombre}
              onChange={(event) => setPlanNombre(event.target.value)}
              placeholder="Ej. Plan Flexible"
              disabled={!selectedCarreraId || submitting}
            />
          </div>

          <div className={styles.inlineField}>
            <label htmlFor="plan_anio">Ano (opcional)</label>
            <input
              id="plan_anio"
              type="text"
              value={planAnio}
              onChange={(event) => setPlanAnio(event.target.value)}
              placeholder="Ej. 2026"
              disabled={!selectedCarreraId || submitting}
            />
          </div>

          <button type="submit" className={styles.createButton} disabled={!selectedCarreraId || submitting}>
            {submitting ? "Creando..." : "Crear plan"}
          </button>
        </form>
      </div>

      {error && <p className={styles.errorMessage}>{error}</p>}
      {success && <p className={styles.successMessage}>{success}</p>}

      <div className={styles.colorLegend}>
        <span className={`${styles.legendItem} ${styles.blockProfesional}`}>Bloque Profesional</span>
        <span className={`${styles.legendItem} ${styles.blockAnahuac}`}>Bloque Anahuac</span>
        <span className={`${styles.legendItem} ${styles.blockElectiva}`}>Electivas</span>
      </div>

      {!selectedPlanId ? (
        <div className={styles.emptyState}>
          Selecciona o crea un plan para comenzar a organizar materias por semestre.
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
          <div className={styles.workspace}>
            <aside className={styles.leftPanel}>
              <div className={styles.leftPanelHeader}>
                <h3>Materias del Catalogo</h3>
                <input
                  type="search"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar por nombre o codigo"
                />
                <div className={styles.semesterSelector}>
                  <label htmlFor="semestre_destino">Agregar al semestre:</label>
                  <select
                    id="semestre_destino"
                    value={semestreDestino}
                    onChange={(event) => setSemestreDestino(Number(event.target.value))}
                  >
                    {SEMESTRES.map((semestre) => (
                      <option key={semestre} value={semestre}>
                        {semestre}
                      </option>
                    ))}
                  </select>
                </div>
                <p className={styles.dragHint}>Arrastra materias al semestre deseado.</p>
              </div>

              <div
                ref={setCatalogDropRef}
                className={`${styles.materiasList} ${isOverCatalog ? styles.dropTargetActive : ""}`}
              >
                {loadingPanel ? (
                  <p className={styles.statusText}>Cargando materias...</p>
                ) : materiasDisponibles.length === 0 ? (
                  <p className={styles.statusText}>No hay materias disponibles con ese filtro.</p>
                ) : (
                  materiasDisponibles.map((materia) => (
                    <DraggableMateriaCard
                      key={materia.id}
                      materia={materia}
                      source="catalog"
                      dropId={`catalog-drop-${materia.id}`}
                      className={`${styles.materiaCard} ${getBloqueClassName(materia.tipo_bloque)}`}
                    >
                      <p className={styles.materiaCode}>{materia.codigo}</p>
                      <h4>{materia.nombre}</h4>
                      <p className={styles.blockTag}>{getBloqueLabel(materia.tipo_bloque)}</p>
                      <p className={styles.metaText}>{materia.creditos} creditos · {materia.tipo_bloque}</p>
                      <button type="button" onClick={() => handleAgregarMateria(materia.id)}>
                        Agregar
                      </button>
                    </DraggableMateriaCard>
                  ))
                )}
              </div>
            </aside>

            <section className={styles.rightPanel}>
              <div className={styles.rightHeader}>
                <h3>Cuadricula de Semestres</h3>
                <button type="button" className={styles.saveButton} onClick={handleGuardarDistribucion} disabled={submitting || loadingPlan}>
                  {submitting ? "Guardando..." : "Guardar distribucion"}
                </button>
              </div>

              {loadingPlan ? (
                <p className={styles.statusText}>Cargando distribucion actual...</p>
              ) : (
                <div className={styles.semestersGrid}>
                  {SEMESTRES.map((semestre) => {
                    const materiasSemestre = materiasPorSemestre.get(semestre) || []
                    const semestreLabel = String(semestre).padStart(2, "0")

                    return (
                      <SemesterDropColumn key={semestre} semestre={semestre}>
                        <header>
                          <div className={styles.semesterNumber}>{semestreLabel}</div>
                          <div className={styles.semesterMeta}>
                            <p>Semestre</p>
                            <span>{materiasSemestre.length} materias</span>
                          </div>
                        </header>

                        <div className={styles.semesterCards}>
                          {materiasSemestre.length === 0 ? (
                            <p className={styles.emptySemester}>Suelta materias aqui</p>
                          ) : (
                            materiasSemestre.map((materia) => (
                              <DraggableMateriaCard
                                key={materia.id}
                                materia={materia}
                                source="assigned"
                                dropId={getAssignedDropId(materia.id)}
                                className={`${styles.assignedCard} ${getBloqueClassName(materia.tipo_bloque)}`}
                              >
                                <p className={styles.materiaCode}>{materia.codigo}</p>
                                <h5>{materia.nombre}</h5>
                                <p className={styles.blockTag}>{getBloqueLabel(materia.tipo_bloque)}</p>
                                <p className={styles.metaText}>{materia.creditos} creditos</p>
                                <div className={styles.cardActions}>
                                  <select
                                    value={semestre}
                                    onChange={(event) => handleCambiarSemestre(materia.id, Number(event.target.value))}
                                  >
                                    {SEMESTRES.map((targetSemestre) => (
                                      <option key={targetSemestre} value={targetSemestre}>
                                        Sem {targetSemestre}
                                      </option>
                                    ))}
                                  </select>
                                  <button type="button" onClick={() => handleQuitarMateria(materia.id)}>
                                    Quitar
                                  </button>
                                </div>
                              </DraggableMateriaCard>
                            ))
                          )}
                        </div>
                      </SemesterDropColumn>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          <DragOverlay>
            {activeMateria ? (
              <div className={`${styles.dragOverlayCard} ${getBloqueClassName(activeMateria.tipo_bloque)}`}>
                <p className={styles.materiaCode}>{activeMateria.codigo}</p>
                <h5>{activeMateria.nombre}</h5>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
