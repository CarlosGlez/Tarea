import { useState } from "react"
import { useUsuarios } from "../hooks/useUsuarios"
import type { Usuario } from "../types/Usuario"
import styles from "../pages/AdminDashboard.module.css"

export const UsuariosList = () => {
  const { usuarios, loading, addUsuario, editUsuario, removeUsuario } = useUsuarios()
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    correo: '',
    contrasena: '',
    rol: 'alumno'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingUser) {
      await editUsuario(editingUser.id, {
        nombre_usuario: formData.nombre_usuario,
        correo: formData.correo,
        rol: formData.rol,
        ...(formData.contrasena && { contrasena: formData.contrasena })
      })
      setEditingUser(null)
    } else {
      await addUsuario(formData)
    }
    setFormData({ nombre_usuario: '', correo: '', contrasena: '', rol: 'alumno' })
  }

  const handleEdit = (user: Usuario) => {
    setEditingUser(user)
    setFormData({
      nombre_usuario: user.nombre_usuario,
      correo: user.correo,
      contrasena: '',
      rol: user.rol
    })
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      await removeUsuario(id)
    }
  }

  if (loading) return <p>Cargando usuarios...</p>

  return (
    <div>
      {/* Formulario para crear/editar usuario */}
      <div className={styles.formularioUsuario}>
        <h3>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
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

          <div className={styles.botonesForm}>
            <button type="submit" className={`${styles.btn} ${styles.primary}`}>
              {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
            </button>
            {editingUser && (
              <button
                type="button"
                className={`${styles.btn} ${styles.secondary}`}
                onClick={() => setEditingUser(null)}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista de usuarios */}
      <div className={styles.usuariosList}>
        {usuarios.map(u => (
          <div key={u.id} className={styles.usuarioCard}>
            <div className={styles.usuarioHeader}>
              <h3>{u.nombre_usuario}</h3>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                backgroundColor: u.rol === 'admin' ? '#ff5800' : u.rol === 'coordinador' ? '#007bff' : '#28a745',
                color: 'white'
              }}>
                {u.rol}
              </span>
            </div>

            <div className={styles.usuarioInfo}>
              <p><strong>Correo:</strong> {u.correo}</p>
              <p><strong>Fecha de creación:</strong> {new Date(u.fecha_creacion).toLocaleDateString('es-ES')}</p>
            </div>

            <div className={styles.usuarioActions}>
              <button
                className={`${styles.btn} ${styles.primary}`}
                onClick={() => handleEdit(u)}
              >
                <i className="fas fa-edit"></i> Editar
              </button>
              <button
                className={`${styles.btn} ${styles.danger}`}
                onClick={() => handleDelete(u.id)}
              >
                <i className="fas fa-trash"></i> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
