import { useState, useRef, useEffect } from "react"
import { ThemeToggle } from "./ThemeToggle"
import styles from "./Sidebar.module.css"

interface SidebarProps {
  title: string
  menuItems: Array<{
    label: string
    icon: string
    onClick: () => void
    badge?: number
  }>
  activeIndex?: number
}

export const Sidebar = ({ title, menuItems, activeIndex: activeIndexProp }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeIndexLocal, setActiveIndexLocal] = useState(0)
  const activeIndex = activeIndexProp !== undefined ? activeIndexProp : activeIndexLocal
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const fabMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isMobileOpen && fabMenuRef.current) {
      fabMenuRef.current.scrollTop = fabMenuRef.current.scrollHeight
    }
  }, [isMobileOpen])

  return (
    <>
      {/* Sidebar desktop */}
      <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.logo}>
          <h2>{title}</h2>
          <button
            className={styles.toggleBtn}
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Toggle sidebar"
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>

        <ul className={styles.menu}>
          {menuItems.map((item, index) => (
            <li key={index} className={index === activeIndex ? styles.menuItemActive : ""}>
              <button
                onClick={() => {
                  if (activeIndexProp === undefined) setActiveIndexLocal(index)
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

        <div className={styles.bottomIcon}>
          <ThemeToggle />
        </div>
      </div>

      {/* FAB mobile — visible solo en pantallas pequeñas */}
      <div className={styles.fabContainer}>
        {isMobileOpen && (
          <div
            className={styles.fabOverlay}
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        <div ref={fabMenuRef} className={`${styles.fabMenu} ${isMobileOpen ? styles.fabMenuOpen : ''}`}>
          {menuItems.map((item, index) => (
            <div
              key={index}
              className={styles.fabMenuItem}
              style={{ '--item-delay': `${(menuItems.length - index) * 0.055}s` } as React.CSSProperties}
            >
              <span className={styles.fabItemLabel}>{item.label}</span>
              <button
                className={`${styles.fabItemBtn} ${index === activeIndex ? styles.fabItemBtnActive : ''}`}
                onClick={() => {
                  if (activeIndexProp === undefined) setActiveIndexLocal(index)
                  setIsMobileOpen(false)
                  item.onClick()
                }}
                aria-label={item.label}
              >
                <span className={styles.iconWrapper}>
                  <i className={`fas ${item.icon}`}></i>
                  {!!item.badge && item.badge > 0 && (
                    <span className={styles.badge}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </span>
              </button>
            </div>
          ))}

          <div
            className={styles.fabMenuItem}
            style={{ '--item-delay': '0s' } as React.CSSProperties}
          >
            <span className={styles.fabItemLabel}>Tema</span>
            <div className={styles.fabItemTheme}>
              <ThemeToggle />
            </div>
          </div>
        </div>

        <button
          className={`${styles.fab} ${isMobileOpen ? styles.fabOpen : ''}`}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle menu"
        >
          <i className={`fas ${isMobileOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </div>
    </>
  )
}
