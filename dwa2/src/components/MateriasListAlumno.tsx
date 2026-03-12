import { useMateriasAlumno } from "../hooks/useMateriasAlumno"
import type { Materia } from "../types/Materia"

export const MateriasListAlumno = ({ alumnoId }: { alumnoId: number | null }) => {
  const { materias, loading } = useMateriasAlumno(alumnoId)

  if (loading) return <p style={{ color: "#374151" }}>Cargando materias...</p>
  if (!materias || materias.length === 0) return <p style={{ color: "#374151" }}>No hay materias para mostrar.</p>

  // Agrupar por estatus
  const agrupadas = materias.reduce<Record<string, Materia[]>>((acc, m) => {
    const key = m.estatus
    acc[key] = acc[key] || []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <div style={{ color: "#1f2937" }}>
      <h2 style={{ color: "#111827", marginTop: 0 }}>En curso</h2>
      {(agrupadas['cursando'] || []).map((m) => (
        <div key={m.id} style={{ marginBottom: "8px" }}>
          <strong>{m.codigo} - {m.nombre}</strong> <span>({m.creditos} cr)</span>
        </div>
      ))}

      <h2 style={{ color: "#111827", marginTop: "16px" }}>Cursadas</h2>
      {(agrupadas['aprobada'] || []).map((m) => (
        <div key={m.id} style={{ marginBottom: "8px" }}>
          <strong>{m.codigo} - {m.nombre}</strong> <span>({m.creditos} cr) - {m.calificacion}</span>
        </div>
      ))}

      <h2 style={{ color: "#111827", marginTop: "16px" }}>Por cursar</h2>
      {(agrupadas['no_cursada'] || []).map((m) => (
        <div key={m.id} style={{ marginBottom: "8px" }}>
          <strong>{m.codigo} - {m.nombre}</strong> <span>({m.creditos} cr)</span>
        </div>
      ))}

      <h2 style={{ color: "#111827", marginTop: "16px" }}>Reprobadas</h2>
      {(agrupadas['no_aprobada'] || []).map((m) => (
        <div key={m.id} style={{ marginBottom: "8px" }}>
          <strong>{m.codigo} - {m.nombre}</strong> <span>({m.creditos} cr){typeof m.calificacion === "number" ? ` - ${m.calificacion}` : ""}</span>
        </div>
      ))}
    </div>
  )
}
