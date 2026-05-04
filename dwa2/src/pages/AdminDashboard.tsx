import { useState } from "react"
import { Sidebar } from "../components/Sidebar"
import { SectionTransition } from "../components/SectionTransition"
import { UsuariosList } from "../components/UsuariosList"
import { CarrerasList } from "../components/CarrerasList"
import { PlanesBuilder } from "../components/PlanesBuilder"
import styles from "./AdminDashboard.module.css"

interface UsuarioDashboard {
  nombre: string | null
  rol: string | null
}

export const AdminDashboard = () => {
  // Estado para guardar datos del usuario
  const [usuario] = useState<UsuarioDashboard>(() => ({
    nombre: localStorage.getItem("nombre"),
    rol: localStorage.getItem("rol"),
  }))
  // Estado para controlar qué sección se muestra
  const [seccionActual, setSeccionActual] = useState("inicio")
  const [subseccionCarreras, setSubseccionCarreras] = useState<"carreras" | "planes">("carreras")

  // Función para logout
  const handleLogout = () => {
    sessionStorage.removeItem("token")
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
        <SectionTransition key={`${seccionActual}-${subseccionCarreras}`}>
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
              <p>Administra carreras y diseña planes de estudio por semestre desde un editor interactivo.</p>

              <div className={styles.submenuTabs}>
                <button
                  className={`${styles.submenuTabButton} ${subseccionCarreras === "carreras" ? styles.activeSubmenuTab : ""}`}
                  onClick={() => setSubseccionCarreras("carreras")}
                  type="button"
                >
                  Carreras
                </button>
                <button
                  className={`${styles.submenuTabButton} ${subseccionCarreras === "planes" ? styles.activeSubmenuTab : ""}`}
                  onClick={() => setSubseccionCarreras("planes")}
                  type="button"
                >
                  Planes Interactivos
                </button>
              </div>

              {subseccionCarreras === "carreras" ? <CarrerasList /> : <PlanesBuilder />}
            </div>
          )}
        </SectionTransition>
      </div>
    </div>
  )
}
