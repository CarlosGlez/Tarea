// Componente de barra lateral reutilizable
import { useState } from "react"
import { ThemeToggle } from "./ThemeToggle"
import styles from "./Sidebar.module.css"

// Props que acepta el Sidebar
interface SidebarProps {
  title: string                  // Título del sidebar (ej: "MiKardex - Alumno")
  menuItems: Array<{
    label: string               // Nombre del enlace
    icon: string               // Icono de FontAwesome (ej: "fa-home")
    onClick: () => void        // Función al hacer click
    badge?: number             // Número de notificaciones pendientes
  }>
}

export const Sidebar = ({ title, menuItems }: SidebarProps) => {
  // Estado para controlar si la sidebar está colapsada
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

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
          <li key={index} className={index === activeIndex ? styles.menuItemActive : ""}>
            <button
              onClick={() => {
                setActiveIndex(index)
                item.onClick()
              }}
              className={`${styles.menuButton} ${index === activeIndex ? styles.menuButtonActive : ""}`}
            >
              <span className={styles.iconWrapper}>
                <i className={`fas ${item.icon}`}></i>
                {!!item.badge && item.badge > 0 && (
                  <span className={styles.badge}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              <span className={styles.menuLabel}>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Icono inferior (toggle de tema) */}
      <div className={styles.bottomIcon}>
        <ThemeToggle />
      </div>
    </div>
  )
}
