import { useState } from "react"
import { createCarrera, deleteCarrera, updateCarrera } from "../data/carrerasService"
import { useCarreras, usePlanesByCarrera, useAlumnosByCarrera } from "../hooks/useCarreras"
import type { Carrera } from "../types/Carrera"
import styles from "./CarrerasList.module.css"

export const CarrerasList = () => {
  const { carreras, loading, error, refetchCarreras } = useCarreras()
  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | null>(null)
  const [editingCarrera, setEditingCarrera] = useState<Carrera | null>(null)
  const [formData, setFormData] = useState({ nombre: "", abreviatura: "" })
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setEditingCarrera(null)
    setFormData({ nombre: "", abreviatura: "" })
  }

  const handleEdit = (carrera: Carrera) => {
    setEditingCarrera(carrera)
    setFormData({ nombre: carrera.nombre, abreviatura: carrera.abreviatura })
    setFormError(null)
    setFormSuccess(null)
  }

  const handleCancelEdit = () => {
    resetForm()
    setFormError(null)
    setFormSuccess(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nombre = formData.nombre.trim()
    const abreviatura = formData.abreviatura.trim().toUpperCase()

    if (!nombre || !abreviatura) {
      setFormError("Completa el nombre y la abreviatura de la carrera.")
      setFormSuccess(null)
      return
    }

    setSubmitting(true)
    setFormError(null)
    setFormSuccess(null)

    try {
      const carreraGuardada = editingCarrera
        ? await updateCarrera(editingCarrera.id, { nombre, abreviatura })
        : await createCarrera({ nombre, abreviatura })

      resetForm()
      setSelectedCarrera(carreraGuardada)
      setFormSuccess(editingCarrera ? "Carrera actualizada correctamente." : "Carrera creada correctamente.")
      await refetchCarreras()
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear la carrera"
      setFormError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (carrera: Carrera) => {
    const confirmed = window.confirm(`¿Quieres eliminar la carrera ${carrera.nombre}?`)

    if (!confirmed) {
      return
    }

    setFormError(null)
    setFormSuccess(null)

    try {
      await deleteCarrera(carrera.id)

      if (selectedCarrera?.id === carrera.id) {
        setSelectedCarrera(null)
      }

      if (editingCarrera?.id === carrera.id) {
        resetForm()
      }

      setFormSuccess("Carrera eliminada correctamente.")
      await refetchCarreras()
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo eliminar la carrera"
      setFormError(message)
    }
  }

  if (loading) return <p className={styles.statusMessage}>Cargando carreras...</p>
  if (error) return <p className={styles.statusMessage}>{error}</p>

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Carreras</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formHeader}>
          <h3>{editingCarrera ? "Editar carrera" : "Crear carrera"}</h3>
          {editingCarrera && (
            <button type="button" className={styles.secondaryButton} onClick={handleCancelEdit}>
              Cancelar edición
            </button>
          )}
        </div>

        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              value={formData.nombre}
              onChange={(event) => setFormData((current) => ({ ...current, nombre: event.target.value }))}
              placeholder="Ej. Ingeniería en Sistemas"
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="abreviatura">Abreviatura</label>
            <input
              id="abreviatura"
              type="text"
              value={formData.abreviatura}
              onChange={(event) => setFormData((current) => ({ ...current, abreviatura: event.target.value.toUpperCase() }))}
              placeholder="Ej. ISND"
              maxLength={10}
              required
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.createButton} disabled={submitting}>
            {submitting ? (editingCarrera ? "Guardando..." : "Creando...") : (editingCarrera ? "Guardar cambios" : "Crear carrera")}
          </button>
          {formError && <p className={styles.errorMessage}>{formError}</p>}
          {formSuccess && <p className={styles.successMessage}>{formSuccess}</p>}
        </div>
      </form>

      {carreras.length === 0 ? (
        <p className={styles.statusMessage}>No hay carreras disponibles.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.managementTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Abreviatura</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {carreras.map((carrera) => {
                const isSelected = selectedCarrera?.id === carrera.id

                return (
                  <tr key={carrera.id} className={isSelected ? styles.selectedRow : undefined}>
                    <td>{carrera.id}</td>
                    <td>{carrera.nombre}</td>
                    <td>{carrera.abreviatura}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => setSelectedCarrera(isSelected ? null : carrera)}
                        >
                          {isSelected ? "Ocultar detalle" : "Ver detalle"}
                        </button>
                        <button type="button" className={styles.editButton} onClick={() => handleEdit(carrera)}>
                          Editar
                        </button>
                        <button type="button" className={styles.deleteButton} onClick={() => handleDelete(carrera)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedCarrera && (
        <div className={styles.details}>
          <div className={styles.detailsHeader}>
            <h3>{selectedCarrera.nombre}</h3>
            <span className={styles.badge}>{selectedCarrera.abreviatura}</span>
          </div>
          <PlanesList carreraId={selectedCarrera.id} />
          <AlumnosList carreraId={selectedCarrera.id} />
        </div>
      )}
    </div>
  )
}

const PlanesList = ({ carreraId }: { carreraId: number }) => {
  const { planes, loading, error } = usePlanesByCarrera(carreraId)

  if (loading) return <p className={styles.statusMessage}>Cargando planes...</p>
  if (error) return <p className={styles.statusMessage}>{error}</p>

  return (
    <div className={styles.section}>
      <h3>Planes de Estudio</h3>
      {planes.length === 0 ? (
        <p className={styles.statusMessage}>No hay planes para esta carrera.</p>
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

  if (loading) return <p className={styles.statusMessage}>Cargando alumnos...</p>
  if (error) return <p className={styles.statusMessage}>{error}</p>

  return (
    <div className={styles.section}>
      <h3>Alumnos ({alumnos.length})</h3>
      {alumnos.length === 0 ? (
        <p className={styles.statusMessage}>No hay alumnos en esta carrera.</p>
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