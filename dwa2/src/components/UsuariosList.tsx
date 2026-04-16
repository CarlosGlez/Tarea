import { useState, useEffect } from "react"
import { useUsuarios } from "../hooks/useUsuarios"
import type { Usuario } from "../types/Usuario"
import type { Alumno, Carrera, PlanEstudio } from "../types/Carrera"
import styles from "../pages/AdminDashboard.module.css"
import {
  getAlumnoDatos,
  updateAlumnoDatos,
  getCoordinadorDatos,
  updateCoordinadorDatos,
  updateAlumnoPrograma,
} from "../data/usuariosService"
import * as carrerasService from "../data/carrerasService"

interface UsuariosListProps {
  carreraId?: number | null
  alumnosFiltrados?: Alumno[]
  soloVisualizacion?: boolean
  onAlumnoCreated?: () => void
  onAlumnosChanged?: () => void
  onVerDetalleAlumno?: (alumno: Alumno) => void
}

export const UsuariosList = ({
  carreraId,
  alumnosFiltrados,
  soloVisualizacion = false,
  onAlumnoCreated,
  onAlumnosChanged,
  onVerDetalleAlumno,
}: UsuariosListProps) => {
  const { usuarios, loading, addUsuario, editUsuario, removeUsuario } = useUsuarios()
  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [planes, setPlanes] = useState<PlanEstudio[]>([])
  const [loadingCarreras, setLoadingCarreras] = useState(false)
  
  // Usar alumnos filtrados si se proporcionan, de lo contrario usar todos los usuarios
  const usuariosAMostrar = alumnosFiltrados && carreraId ? alumnosFiltrados : usuarios
  const [modalOpen, setModalOpen] = useState(false)
  const [datosPersonalesOpen, setDatosPersonalesOpen] = useState(false)
  const [programaOpen, setProgramaOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [loadingDatos, setLoadingDatos] = useState(false)
  const [guardandoPrograma, setGuardandoPrograma] = useState(false)
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    correo: '',
    contrasena: '',
    rol: 'alumno',
    carrera_id: '',
    plan_id: ''
  })
  const [datosPersonalesForm, setDatosPersonalesForm] = useState<Record<string, string | number | undefined>>({})
  const [programaForm, setProgramaForm] = useState({
    carrera_id: "",
    plan_id: "",
  })
  
  // Cargar carreras al montar
  useEffect(() => {
    const cargarCarreras = async () => {
      setLoadingCarreras(true)
      try {
        const datos = await carrerasService.getCarreras()
        setCarreras(datos)
      } catch (error) {
        console.error('Error cargando carreras:', error)
      } finally {
        setLoadingCarreras(false)
      }
    }
    cargarCarreras()
  }, [])
  
  // Cargar planes cuando cambia la carrera seleccionada
  useEffect(() => {
    const cargarPlanes = async () => {
      if (!formData.carrera_id) {
        setPlanes([])
        return
      }
      try {
        const datos = await carrerasService.getPlanesByCarrera(parseInt(formData.carrera_id))
        setPlanes(datos)
      } catch (error) {
        console.error('Error cargando planes:', error)
        setPlanes([])
      }
    }
    cargarPlanes()
  }, [formData.carrera_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingUser) {
      await editUsuario(editingUser.id, {
        nombre_usuario: formData.nombre_usuario,
        correo: formData.correo,
        rol: formData.rol,
        ...(formData.contrasena && { contrasena: formData.contrasena })
      })
    } else {
      // Validar que si es alumno o coordinador, tenga carrera asignada
      if ((formData.rol === 'alumno' || formData.rol === 'coordinador') && !formData.carrera_id) {
        alert('Debes seleccionar una carrera')
        return
      }
      
      if (formData.rol === 'alumno' && !formData.plan_id) {
        alert('Debes seleccionar un plan de estudio')
        return
      }
      
      await addUsuario({
        ...formData,
        carrera_id: formData.carrera_id ? parseInt(formData.carrera_id) : undefined,
        plan_id: formData.plan_id ? parseInt(formData.plan_id) : undefined
      })
      
      // Si se creó un alumno y hay callback, ejecutarlo
      if (formData.rol === 'alumno' && onAlumnoCreated) {
        onAlumnoCreated()
      }
    }
    closeModal()
  }

  const handleEdit = (user: Usuario | Alumno) => {
    const alumnoEdit = user as Alumno
    const carreraActual = alumnoEdit.carrera_id ? String(alumnoEdit.carrera_id) : (carreraId ? String(carreraId) : "")
    const planActual = alumnoEdit.plan_id ? String(alumnoEdit.plan_id) : ""

    setEditingUser(user as Usuario)
    setFormData({
      nombre_usuario: user.nombre_usuario,
      correo: user.correo || '',
      contrasena: '',
      rol: user.rol,
      carrera_id: '',
      plan_id: ''
    })
    setProgramaForm({
      carrera_id: carreraActual,
      plan_id: planActual,
    })
    setModalOpen(true)
  }

  const handleCreateNew = () => {
    setEditingUser(null)
    setFormData({ 
      nombre_usuario: '', 
      correo: '', 
      contrasena: '', 
      rol: 'alumno',
      carrera_id: '',
      plan_id: ''
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await removeUsuario(id)
        onAlumnosChanged?.()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'No se pudo eliminar el usuario'
        alert(errorMessage)
      }
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingUser(null)
    setFormData({ nombre_usuario: '', correo: '', contrasena: '', rol: 'alumno', carrera_id: '', plan_id: '' })
  }

  const closeDatosPersonalesModal = () => {
    setDatosPersonalesOpen(false)
    setDatosPersonalesForm({})
  }

  const closeProgramaModal = () => {
    setProgramaOpen(false)
    setProgramaForm({ carrera_id: '', plan_id: '' })
  }

  const handleOpenProgramaModal = async () => {
    if (!editingUser || editingUser.rol !== 'alumno') return

    const carreraActual = programaForm.carrera_id || (carreraId ? String(carreraId) : '')
    if (carreraActual) {
      try {
        const planesCarrera = await carrerasService.getPlanesByCarrera(parseInt(carreraActual, 10))
        setPlanes(planesCarrera)
      } catch (error) {
        console.error('Error cargando planes para programa:', error)
      }
    }

    setProgramaOpen(true)
    setModalOpen(false)
  }

  const handleSavePrograma = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser || editingUser.rol !== 'alumno') return

    if (!programaForm.carrera_id || !programaForm.plan_id) {
      alert('Debes seleccionar carrera y plan')
      return
    }

    try {
      setGuardandoPrograma(true)
      await updateAlumnoPrograma(editingUser.id, {
        carrera_id: parseInt(programaForm.carrera_id, 10),
        plan_id: parseInt(programaForm.plan_id, 10),
      })
      alert('Carrera y plan actualizados exitosamente')
      onAlumnosChanged?.()
      closeProgramaModal()
    } catch (error) {
      console.error('Error actualizando programa del alumno:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert(`Error al actualizar carrera/plan: ${errorMessage}`)
    } finally {
      setGuardandoPrograma(false)
    }
  }

  const handleOpenDatosPersonales = async () => {
    if (!editingUser) return
    
    setLoadingDatos(true)
    try {
      let datos
      if (editingUser.rol === 'alumno') {
        datos = await getAlumnoDatos(editingUser.id)
      } else if (editingUser.rol === 'coordinador') {
        datos = await getCoordinadorDatos(editingUser.id)
      } else {
        alert('Solo se pueden editar datos personales de alumnos y coordinadores')
        setLoadingDatos(false)
        return
      }
      
      setDatosPersonalesForm({
        nombre: datos.nombre || '',
        apellido: datos.apellido || '',
        ...(editingUser.rol === 'alumno' && {
          numero_telefono: datos.numero_telefono || '',
          numero_identificacion: datos.numero_identificacion || '',
          fecha_nacimiento: datos.fecha_nacimiento ? datos.fecha_nacimiento.split('T')[0] : '',
        }),
        ...(editingUser.rol === 'coordinador' && {
          telefono: datos.telefono || '',
          numero_identificacion: datos.numero_identificacion || '',
          oficina: datos.oficina || '',
          horario_atencion: datos.horario_atencion || '',
          especialidad: datos.especialidad || '',
          fecha_nacimiento: datos.fecha_nacimiento ? datos.fecha_nacimiento.split('T')[0] : '',
        })
      })
      setDatosPersonalesOpen(true)
      setModalOpen(false)
    } catch (error) {
      console.error('Error cargando datos personales:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert(`Error al cargar los datos personales: ${errorMessage}`)
    } finally {
      setLoadingDatos(false)
    }
  }

  const handleSaveDatosPersonales = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      if (editingUser.rol === 'alumno') {
        await updateAlumnoDatos(editingUser.id, datosPersonalesForm)
      } else if (editingUser.rol === 'coordinador') {
        await updateCoordinadorDatos(editingUser.id, datosPersonalesForm)
      }
      
      alert('Datos personales actualizados exitosamente')
      closeDatosPersonalesModal()
      closeModal()
    } catch (error) {
      console.error('Error actualizando datos personales:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert(`Error al actualizar los datos personales: ${errorMessage}`)
    }
  }

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'admin':
        return '#ff5800'
      case 'coordinador':
        return '#007bff'
      case 'alumno':
        return '#28a745'
      default:
        return '#6c757d'
    }
  }

  if (loading) return <p>Cargando usuarios...</p>

  return (
    <div>
      {/* Botón para crear nuevo usuario - solo si es vista de admin */}
      {!soloVisualizacion && (
        <div className={styles.createButtonContainer}>
          <button
            className={`${styles.btn} ${styles.primary}`}
            onClick={handleCreateNew}
          >
            <i className="fas fa-plus"></i> Crear Nuevo Usuario
          </button>
        </div>
      )}

      {/* Modal para crear o editar usuario */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
              <button className={styles.closeButton} onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="nombre_usuario">Nombre de Usuario:</label>
                <input
                  id="nombre_usuario"
                  type="text"
                  placeholder="Ingresa el nombre de usuario"
                  value={formData.nombre_usuario}
                  onChange={(e) => setFormData({ ...formData, nombre_usuario: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="correo">Correo Electrónico:</label>
                <input
                  id="correo"
                  type="email"
                  placeholder="Ingresa el correo electrónico"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="contrasena">Contraseña:</label>
                <input
                  id="contrasena"
                  type="password"
                  placeholder={editingUser ? "Deja vacío para mantener la actual" : "Ingresa la contraseña"}
                  value={formData.contrasena}
                  onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                  required={!editingUser}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="rol">Rol:</label>
                <select
                  id="rol"
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                >
                  <option value="alumno">Alumno</option>
                  <option value="coordinador">Coordinador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {!editingUser && (formData.rol === 'alumno' || formData.rol === 'coordinador') && (
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="carrera_id">Carrera:</label>
                    <select
                      id="carrera_id"
                      value={formData.carrera_id}
                      onChange={(e) => setFormData({ ...formData, carrera_id: e.target.value, plan_id: '' })}
                      required={!editingUser && (formData.rol === 'alumno' || formData.rol === 'coordinador')}
                    >
                      <option value="">Selecciona una carrera</option>
                      {loadingCarreras ? (
                        <option>Cargando...</option>
                      ) : (
                        carreras.map((carrera) => (
                          <option key={carrera.id} value={carrera.id}>
                            {carrera.nombre}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {formData.rol === 'alumno' && (
                    <div className={styles.formGroup}>
                      <label htmlFor="plan_id">Plan de Estudio:</label>
                      <select
                        id="plan_id"
                        value={formData.plan_id}
                        onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                        required={!editingUser && formData.rol === 'alumno'}
                      >
                        <option value="">Selecciona un plan</option>
                        {formData.carrera_id ? (
                          planes.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.nombre}
                            </option>
                          ))
                        ) : (
                          <option disabled>Selecciona una carrera primero</option>
                        )}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className={styles.botonesForm}>
                <button type="submit" className={`${styles.btn} ${styles.primary}`}>
                  <i className="fas fa-save"></i> {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
                {editingUser && editingUser.rol !== 'admin' && (
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.warning}`}
                    onClick={handleOpenDatosPersonales}
                    disabled={loadingDatos}
                  >
                    <i className="fas fa-user-edit"></i> Datos Personales
                  </button>
                )}
                {editingUser?.rol === 'alumno' && (
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.warning}`}
                    onClick={handleOpenProgramaModal}
                  >
                    <i className="fas fa-graduation-cap"></i> Carrera y Plan
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles.btn} ${styles.secondary}`}
                  onClick={closeModal}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para cambiar carrera/plan del alumno */}
      {programaOpen && editingUser?.rol === 'alumno' && (
        <div className={styles.modalOverlay} onClick={closeProgramaModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Cambiar Carrera y Plan</h2>
              <button className={styles.closeButton} onClick={closeProgramaModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSavePrograma}>
              <div className={styles.formGroup}>
                <label htmlFor="programa_carrera_id">Carrera:</label>
                <select
                  id="programa_carrera_id"
                  value={programaForm.carrera_id}
                  onChange={async (e) => {
                    const nuevaCarreraId = e.target.value
                    setProgramaForm({ carrera_id: nuevaCarreraId, plan_id: '' })

                    if (!nuevaCarreraId) {
                      setPlanes([])
                      return
                    }

                    try {
                      const planesCarrera = await carrerasService.getPlanesByCarrera(parseInt(nuevaCarreraId, 10))
                      setPlanes(planesCarrera)
                    } catch (error) {
                      console.error('Error cargando planes:', error)
                      setPlanes([])
                    }
                  }}
                  required
                >
                  <option value="">Selecciona una carrera</option>
                  {loadingCarreras ? (
                    <option>Cargando...</option>
                  ) : (
                    carreras.map((carrera) => (
                      <option key={carrera.id} value={carrera.id}>
                        {carrera.nombre}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="programa_plan_id">Plan de Estudio:</label>
                <select
                  id="programa_plan_id"
                  value={programaForm.plan_id}
                  onChange={(e) => setProgramaForm({ ...programaForm, plan_id: e.target.value })}
                  required
                >
                  <option value="">Selecciona un plan</option>
                  {programaForm.carrera_id ? (
                    planes.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.nombre}
                      </option>
                    ))
                  ) : (
                    <option disabled>Selecciona una carrera primero</option>
                  )}
                </select>
              </div>

              <div className={styles.botonesForm}>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.primary}`}
                  disabled={guardandoPrograma}
                >
                  <i className="fas fa-save"></i> {guardandoPrograma ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.secondary}`}
                  onClick={closeProgramaModal}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar datos personales */}
      {datosPersonalesOpen && editingUser && (
        <div className={styles.modalOverlay} onClick={closeDatosPersonalesModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {editingUser.rol === 'alumno' ? 'Datos del Alumno' : 'Datos del Coordinador'}
              </h2>
              <button className={styles.closeButton} onClick={closeDatosPersonalesModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSaveDatosPersonales}>
              <div className={styles.formGroup}>
                <label htmlFor="nombre">Nombre:</label>
                <input
                  id="nombre"
                  type="text"
                  placeholder="Nombre"
                  value={datosPersonalesForm.nombre || ''}
                  onChange={(e) => setDatosPersonalesForm({ ...datosPersonalesForm, nombre: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="apellido">Apellido:</label>
                <input
                  id="apellido"
                  type="text"
                  placeholder="Apellido"
                  value={datosPersonalesForm.apellido || ''}
                  onChange={(e) => setDatosPersonalesForm({ ...datosPersonalesForm, apellido: e.target.value })}
                  required
                />
              </div>

              {editingUser.rol === 'alumno' && (
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="numero_telefono">Teléfono:</label>
                    <input
                      id="numero_telefono"
                      type="tel"
                      placeholder="Número de teléfono"
                      value={datosPersonalesForm.numero_telefono || ''}
                      onChange={(e) => setDatosPersonalesForm({ ...datosPersonalesForm, numero_telefono: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="numero_identificacion">Número de Identificación:</label>
                    <input
                      id="numero_identificacion"
                      type="text"
                      placeholder="Cédula o DNI"
                      value={datosPersonalesForm.numero_identificacion || ''}
                      onChange={(e) => setDatosPersonalesForm({ ...datosPersonalesForm, numero_identificacion: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="fecha_nacimiento">Fecha de Nacimiento:</label>
                    <input
                      id="fecha_nacimiento"
                      type="date"
                      value={datosPersonalesForm.fecha_nacimiento || ''}
                      onChange={(e) => setDatosPersonalesForm({ ...datosPersonalesForm, fecha_nacimiento: e.target.value })}
                    />
                  </div>
                </>
              )}

              {editingUser.rol === 'coordinador' && (
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="telefono">Teléfono:</label>
                    <input
                      id="telefono"
                      type="tel"
                      placeholder="Número de teléfono"
                      value={datosPersonalesForm.telefono || ''}
                      onChange={(e) => setDatosPersonalesForm({ ...datosPersonalesForm, telefono: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="numero_identificacion_coord">Número de Identificación:</label>
                    <input
                      id="numero_identificacion_coord"
                      type="text"
                      placeholder="Cédula o DNI"
                      value={datosPersonalesForm.numero_identificacion || ''}
                      onChange={(e) => setDatosPersonalesForm({ ...datosPersonalesForm, numero_identificacion: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="oficina">Oficina:</label>
                    <input
                      id="oficina"
                      type="text"
                      placeholder="Ubicación de oficina"
                      value={datosPersonalesForm.oficina || ''}
                      onChange={(e) => setDatosPersonalesForm({ ...datosPersonalesForm, oficina: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="horario_atencion">Horario de Atención:</label>
                    <input
                      id="horario_atencion"
                      type="text"
                      placeholder="Ej: Lunes a Viernes 9:00-17:00"
                      value={datosPersonalesForm.horario_atencion || ''}
                      onChange={(e) => setDatosPersonalesForm({ ...datosPersonalesForm, horario_atencion: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="especialidad">Especialidad:</label>
                    <input
                      id="especialidad"
                      type="text"
                      placeholder="Especialidad académica"
                      value={datosPersonalesForm.especialidad || ''}
                      onChange={(e) => setDatosPersonalesForm({ ...datosPersonalesForm, especialidad: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="fecha_nacimiento_coord">Fecha de Nacimiento:</label>
                    <input
                      id="fecha_nacimiento_coord"
                      type="date"
                      value={datosPersonalesForm.fecha_nacimiento || ''}
                      onChange={(e) => setDatosPersonalesForm({ ...datosPersonalesForm, fecha_nacimiento: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className={styles.botonesForm}>
                <button type="submit" className={`${styles.btn} ${styles.primary}`}>
                  <i className="fas fa-save"></i> Guardar Datos
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.secondary}`}
                  onClick={closeDatosPersonalesModal}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className={styles.tableContainer}>
        <table className={styles.usuariosTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre de Usuario</th>
              <th>Tipo de Usuario</th>
              <th>Correo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosAMostrar.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.nombre_usuario}</td>
                <td>
                  <span
                    className={styles.rolBadge}
                    style={{ backgroundColor: getRolColor(u.rol) }}
                  >
                    {u.rol.charAt(0).toUpperCase() + u.rol.slice(1)}
                  </span>
                </td>
                <td>{u.correo}</td>
                <td>
                  <div className={styles.tableActions}>
                    {onVerDetalleAlumno && u.rol === 'alumno' && (
                      <button
                        className={`${styles.btn} ${styles.secondary} ${styles.btnSmall}`}
                        onClick={() => onVerDetalleAlumno(u as Alumno)}
                        title="Ver avance académico"
                      >
                        <i className="fas fa-chart-line"></i>
                      </button>
                    )}
                    <button
                      className={`${styles.btn} ${styles.primary} ${styles.btnSmall}`}
                      onClick={() => handleEdit(u)}
                      title="Editar usuario"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className={`${styles.btn} ${styles.danger} ${styles.btnSmall}`}
                      onClick={() => handleDelete(u.id)}
                      title="Eliminar usuario"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
