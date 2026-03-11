import { useState } from "react"
import { useCarreras, usePlanesByCarrera, useAlumnosByCarrera } from "../hooks/useCarreras"
import type { Carrera } from "../types/Carrera"
import styles from "./CarrerasList.module.css"

export const CarrerasList = () => {
  const { carreras, loading, error } = useCarreras()
  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | null>(null)

  if (loading) return <p>Cargando carreras...</p>
  if (error) return <p>{error}</p>
  if (carreras.length === 0) return <p>No hay carreras disponibles.</p>

  return (
    <div className={styles.container}>
      <h2>Carreras</h2>
      <ul className={styles.carrerasList}>
        {carreras.map((carrera) => (
          <li key={carrera.id} className={styles.carreraItem}>
            <button
              onClick={() => setSelectedCarrera(selectedCarrera?.id === carrera.id ? null : carrera)}
              className={styles.carreraButton}
            >
              {carrera.nombre} ({carrera.abreviatura})
            </button>
            {selectedCarrera?.id === carrera.id && (
              <div className={styles.details}>
                <PlanesList carreraId={carrera.id} />
                <AlumnosList carreraId={carrera.id} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

const PlanesList = ({ carreraId }: { carreraId: number }) => {
  const { planes, loading, error } = usePlanesByCarrera(carreraId)

  if (loading) return <p>Cargando planes...</p>
  if (error) return <p>{error}</p>

  return (
    <div className={styles.section}>
      <h3>Planes de Estudio</h3>
      {planes.length === 0 ? (
        <p>No hay planes para esta carrera.</p>
      ) : (
        <ul className={styles.planesList}>
          {planes.map((plan) => (
            <li key={plan.id} className={styles.planItem}>
              <span className={styles.planName}>{plan.nombre}</span>
              <span className={plan.estatus ? styles.active : styles.inactive}>
                {plan.estatus ? "Activo" : "Inactivo"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const AlumnosList = ({ carreraId }: { carreraId: number }) => {
  const { alumnos, loading, error } = useAlumnosByCarrera(carreraId)

  if (loading) return <p>Cargando alumnos...</p>
  if (error) return <p>{error}</p>

  return (
    <div className={styles.section}>
      <h3>Alumnos ({alumnos.length})</h3>
      {alumnos.length === 0 ? (
        <p>No hay alumnos en esta carrera.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Estatus</th>
              <th>Generación</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((alumno) => (
              <tr key={alumno.id}>
                <td>{alumno.matricula}</td>
                <td>{alumno.nombre_usuario}</td>
                <td>{alumno.correo}</td>
                <td>{alumno.estatus_academico}</td>
                <td>{alumno.generacion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}