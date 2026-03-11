import { useEffect, useState } from "react"
import { Sidebar } from "../components/Sidebar"
import { UsuariosList } from "../components/UsuariosList"
import { CarrerasList } from "../components/CarrerasList"
import styles from "./AdminDashboard.module.css"

export const AdminDashboard = () => {
  // Estado para guardar datos del usuario
  const [usuario, setUsuario] = useState<any>(null)
  // Estado para controlar qué sección se muestra
  const [seccionActual, setSeccionActual] = useState("inicio")

  // Cargar datos del usuario desde localStorage
  useEffect(() => {
    const nombre = localStorage.getItem("nombre")
    const rol = localStorage.getItem("rol")
    setUsuario({ nombre, rol })
  }, [])

  // Función para logout
  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("rol")
    localStorage.removeItem("nombre")
    window.location.hash = ""
  }

  // Elementos del menú de la sidebar
  const menuItems = [
    { label: "Inicio", icon: "fa-home", onClick: () => setSeccionActual("inicio") },
    { label: "Gestión de Usuarios", icon: "fa-users", onClick: () => setSeccionActual("usuarios") },
    { label: "Gestión de Carreras", icon: "fa-graduation-cap", onClick: () => setSeccionActual("carreras") },
    { label: "Cerrar sesión", icon: "fa-sign-out-alt", onClick: handleLogout },
  ]

  return (
    <div className={styles.container}>
      {/* Sidebar reutilizable */}
      <Sidebar title="MiKardex - Admin" menuItems={menuItems} />

      {/* Contenido principal */}
      <div className={styles.contenido}>
        {/* Sección de Inicio */}
        {seccionActual === "inicio" && (
          <div className={styles.seccion}>
            <h1>Bienvenido, Administrador</h1>
            <p>Este es tu panel de control como administrador del sistema.</p>
            {usuario && (
              <div className={styles.datosUsuario}>
                <p><strong>Nombre:</strong> {usuario.nombre}</p>
                <p><strong>Rol:</strong> {usuario.rol}</p>
              </div>
            )}
          </div>
        )}

        {/* Sección de Gestión de Usuarios */}
        {seccionActual === "usuarios" && (
          <div className={styles.seccion}>
            <h1>Gestión de Usuarios</h1>
            <p>Administra los usuarios del sistema: crea nuevos usuarios, edita información existente y elimina usuarios cuando sea necesario.</p>
            <UsuariosList />
          </div>
        )}

        {/* Sección de Gestión de Carreras */}
        {seccionActual === "carreras" && (
          <div className={styles.seccion}>
            <h1>Gestión de Carreras</h1>
            <p>Visualiza todas las carreras, sus planes de estudio y los alumnos inscritos.</p>
            <CarrerasList />
          </div>
        )}
      </div>
    </div>
  )
}
