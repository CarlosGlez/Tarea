import { useMateriasAlumno } from "../hooks/useMateriasAlumno"

export const MateriasListAlumno = ({ alumnoId }: { alumnoId: number | null }) => {
  const { materias, loading } = useMateriasAlumno(alumnoId)

  if (loading) return <p>Cargando materias...</p>
  if (!materias || materias.length === 0) return <p>No hay materias para mostrar.</p>

  // Agrupar por estatus
  const agrupadas = materias.reduce((acc: any, m) => {
    const key = m.estatus
    acc[key] = acc[key] || []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <div>
      <h2>En curso</h2>
      {(agrupadas['cursando'] || []).map((m: any) => (
        <div key={m.id}>
          <strong>{m.codigo} - {m.nombre}</strong> <span>({m.creditos} cr)</span>
        </div>
      ))}

      <h2>Cursadas</h2>
      {(agrupadas['aprobada'] || []).map((m: any) => (
        <div key={m.id}>
          <strong>{m.codigo} - {m.nombre}</strong> <span>({m.creditos} cr) - {m.calificacion}</span>
        </div>
      ))}

      <h2>Por cursar</h2>
      {(agrupadas['no_cursada'] || []).map((m: any) => (
        <div key={m.id}>
          <strong>{m.codigo} - {m.nombre}</strong> <span>({m.creditos} cr)</span>
        </div>
      ))}
    </div>
  )
}
