// Componente de barra lateral reutilizable
import { useState } from "react"
import styles from "./Sidebar.module.css"

// Props que acepta el Sidebar
interface SidebarProps {
  title: string                  // Título del sidebar (ej: "MiKardex - Alumno")
  menuItems: Array<{
    label: string               // Nombre del enlace
    icon: string               // Icono de FontAwesome (ej: "fa-home")
    onClick: () => void        // Función al hacer click
  }>
}

export const Sidebar = ({ title, menuItems }: SidebarProps) => {
  // Estado para controlar si la sidebar está colapsada
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Función para toggle de la sidebar
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* Logo con título y botón de toggle */}
      <div className={styles.logo}>
        <h2>{title}</h2>
        <button
          className={styles.toggleBtn}
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <i className="fas fa-bars"></i>
        </button>
      </div>

      {/* Menú con enlaces */}
      <ul className={styles.menu}>
        {menuItems.map((item, index) => (
          <li key={index}>
            <i className={`fas ${item.icon}`}></i>
            <button onClick={item.onClick} className={styles.menuButton}>
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Icono inferior (opcional) */}
      <div className={styles.bottomIcon}></div>
    </div>
  )
}
