import { useTheme } from '../contexts/ThemeContext'
import styles from './ThemeToggle.module.css'
import { Sol } from '../assets'

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      className={styles.themeToggle}
      onClick={toggleTheme}
      aria-label="Cambiar tema"
      title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      {theme === 'light' ? (
        <i className="fas fa-moon"></i>
      ) : (
        <img src={Sol} alt="Sol" className={styles.icon} />
      )}
    </button>
  )
}
