// Componente de formulario de login (estilizado con módulo CSS)
import { useState } from "react"
import { useAuth } from "../hooks/useAuth.ts"
import styles from "./LoginForm.module.css"

// Importamos el logo directamente desde la carpeta assets
import logoIEST from "../assets/logo formal IEST.png"

export const LoginForm = () => {
  const { login, loading } = useAuth()

  const [nombreUsuario, setNombreUsuario] = useState("")
  const [password, setPassword] = useState("")

  // Función que maneja el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const rol = await login(nombreUsuario, password)
      if (rol === "admin") {
        window.location.hash = "#/admin"
      } else if (rol === "alumno") {
        window.location.hash = "#/alumno"
      } else if (rol === "coordinador") {
        window.location.hash = "#/coordinador"
      }
    } catch (error) {
      alert("Credenciales incorrectas")
    }
  }

  // Renderizar formulario con clases del módulo CSS
  return (
    <div className={styles.loginWrapper}>
      <form onSubmit={handleSubmit} className={styles.card} aria-label="login form">
        <div className={styles.brand}>
          {/* Usamos la variable logoIEST que importamos arriba */}
          <img src={logoIEST} alt="Logo del IEST" className={styles.logo} />
          <h2 className={styles.title}>Mi Kardex</h2>
          <p className={styles.subtitle}>Inicia sesión para continuar</p>
        </div>

        <input
          className={styles.input}
          type="text"
          placeholder="Nombre de usuario"
          value={nombreUsuario}
          onChange={e => setNombreUsuario(e.target.value)}
          required
        />

        <input
          className={styles.input}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Cargando..." : "Iniciar sesión"}
        </button>
      </form>
    </div>
  )
}