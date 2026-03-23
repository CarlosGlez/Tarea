import { useMateriasAlumno } from "../hooks/useMateriasAlumno"
import type { Materia } from "../types/Materia"
import styles from "./MateriasListAlumno.module.css"

export const MateriasListAlumno = ({ alumnoId }: { alumnoId: number | null }) => {
  const { materias, loading } = useMateriasAlumno(alumnoId)

  if (loading) return <p className={styles.loading}>Cargando materias...</p>
  if (!materias || materias.length === 0) return <p className={styles.loading}>No hay materias para mostrar.</p>

  // Agrupar por estatus
  const agrupadas = materias.reduce<Record<string, Materia[]>>((acc, m) => {
    const key = m.estatus
    acc[key] = acc[key] || []
    acc[key].push(m)
    return acc
  }, {})

  const renderSeccion = (titulo: string, items: Materia[], mostrarCalificacion = false) => (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{titulo}</h2>
      {items.length === 0 ? (
        <p className={styles.emptyState}>Sin materias en esta categoria.</p>
      ) : (
        <div className={styles.list}>
          {items.map((m) => (
            <article key={m.id} className={styles.itemCard}>
              <p className={styles.itemTop}>
                <span>{m.codigo} - {m.nombre}</span>
              </p>
              <p className={styles.itemMeta}>
                {m.creditos} cr{mostrarCalificacion && typeof m.calificacion === "number" ? ` - Calificacion: ${m.calificacion}` : ""}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )

  return (
    <div className={styles.wrapper}>
      {renderSeccion("En curso", agrupadas["cursando"] || [])}
      {renderSeccion("Cursadas", agrupadas["aprobada"] || [], true)}
      {renderSeccion("Por cursar", agrupadas["no_cursada"] || [])}
      {renderSeccion("Reprobadas", agrupadas["no_aprobada"] || [], true)}
    </div>
  )
}
