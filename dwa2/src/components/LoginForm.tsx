// Componente de formulario de login (estilizado con módulo CSS)
import { useState, useEffect } from "react"
import { useAuth } from "../hooks/useAuth.ts"
import { ThemeToggle } from "./ThemeToggle"
import styles from "./LoginForm.module.css"

import logoIEST from "../assets/logo formal IEST.png"

interface Carrera {
  id: number
  nombre: string
  abreviatura: string
}

interface PlanEstudios {
  id: number
  nombre: string
}

export const LoginForm = () => {
  const { login, register, loading } = useAuth()
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  const [loginIdentifier, setLoginIdentifier] = useState("")
  const [correoRegistro, setCorreoRegistro] = useState("")
  const [password, setPassword] = useState("")
  const [nombreCompleto, setNombreCompleto] = useState("")
  const [escuelaProcedencia, setEscuelaProcedencia] = useState("")
  const [selectedCarrera, setSelectedCarrera] = useState<number | "">("")
  const [selectedPlan, setSelectedPlan] = useState<number | "">("")
  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [planes, setPlanes] = useState<PlanEstudios[]>([])
  const [loadingCarreras, setLoadingCarreras] = useState(false)

  // Obtener carreras disponibles
  useEffect(() => {
    const fetchCarreras = async () => {
      try {
        setLoadingCarreras(true)
        const response = await fetch("http://localhost:3000/api/carreras")
        const data = await response.json()
        setCarreras(data)
      } catch (error) {
        console.error("Error loading carreras:", error)
      } finally {
        setLoadingCarreras(false)
      }
    }

    fetchCarreras()
  }, [])

  // Obtener planes de estudio cuando se selecciona una carrera
  useEffect(() => {
    if (selectedCarrera) {
      const fetchPlanes = async () => {
        try {
          const response = await fetch(`http://localhost:3000/api/carreras/${selectedCarrera}/planes`)
          const data = await response.json()
          setPlanes(data)
          setSelectedPlan("")
        } catch (error) {
          console.error("Error loading planes:", error)
          setPlanes([])
        }
      }

      fetchPlanes()
    }
  }, [selectedCarrera])

  // Función que maneja el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isRegisterMode) {
        // Validar que se haya seleccionado carrera y plan para alumno
        if (!selectedCarrera || !selectedPlan) {
          alert("Por favor selecciona una carrera y plan de estudios")
          return
        }
        
        await register(nombreCompleto, correoRegistro, password, escuelaProcedencia, selectedCarrera as number, selectedPlan as number)
        alert("Cuenta creada exitosamente. Ahora puedes iniciar sesión.")
        setIsRegisterMode(false)
        setLoginIdentifier(correoRegistro)
        setPassword("")
        setSelectedCarrera("")
        setSelectedPlan("")
        return
      }

      const rol = await login(loginIdentifier, password)
      if (rol === "admin") {
        window.location.hash = "#/admin"
      } else if (rol === "alumno") {
        window.location.hash = "#/alumno"
      } else if (rol === "coordinador") {
        window.location.hash = "#/coordinador"
      }
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : isRegisterMode
          ? "No se pudo crear la cuenta"
          : "Credenciales incorrectas"
      alert(message)
    }
  }

  // Renderizar formulario con clases del módulo CSS
  return (
    <div className={styles.loginWrapper}>
      <div className={styles.themeToggleContainer}>
        <ThemeToggle />
      </div>
      <form onSubmit={handleSubmit} className={styles.card} aria-label="login form">
        <div className={styles.brand}>
          <img src={logoIEST} alt="Logo del IEST" className={styles.logo} />
          <h2 className={styles.title}>Mi Kardex</h2>
          <p className={styles.subtitle}>
            {isRegisterMode ? "Regístrate para crear tu cuenta" : "Inicia sesión para continuar"}
          </p>
        </div>

        {isRegisterMode && (
          <input
            className={styles.input}
            type="text"
            placeholder="Nombre completo"
            value={nombreCompleto}
            onChange={e => setNombreCompleto(e.target.value)}
            required
          />
        )}

        {isRegisterMode ? (
          <input
            className={styles.input}
            type="email"
            placeholder="Correo electrónico"
            value={correoRegistro}
            onChange={e => setCorreoRegistro(e.target.value)}
            required
          />
        ) : (
          <input
            className={styles.input}
            type="text"
            placeholder="Nombre de usuario o correo"
            value={loginIdentifier}
            onChange={e => setLoginIdentifier(e.target.value)}
            required
          />
        )}

        {isRegisterMode && (
          <input
            className={styles.input}
            type="text"
            placeholder="Escuela de procedencia"
            value={escuelaProcedencia}
            onChange={e => setEscuelaProcedencia(e.target.value)}
            required
          />
        )}

        {isRegisterMode && (
          <>
            <select
              className={styles.input}
              value={selectedCarrera}
              onChange={e => setSelectedCarrera(e.target.value ? Number(e.target.value) : "")}
              required
              disabled={loadingCarreras}
            >
              <option value="">
                {loadingCarreras ? "Cargando carreras..." : "Selecciona una carrera"}
              </option>
              {carreras.map(carrera => (
                <option key={carrera.id} value={carrera.id}>
                  {carrera.nombre} ({carrera.abreviatura})
                </option>
              ))}
            </select>

            {selectedCarrera && (
              <select
                className={styles.input}
                value={selectedPlan}
                onChange={e => setSelectedPlan(e.target.value ? Number(e.target.value) : "")}
                required
              >
                <option value="">Selecciona un plan de estudios</option>
                {planes.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nombre}
                  </option>
                ))}
              </select>
            )}
          </>
        )}

        <input
          className={styles.input}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Cargando..." : isRegisterMode ? "Crear cuenta" : "Iniciar sesión"}
        </button>

        <p className={styles.switchText}>
          {isRegisterMode ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
          <button
            type="button"
            className={styles.switchButton}
            onClick={() => {
              setIsRegisterMode(prev => !prev)
              setPassword("")
            }}
          >
            {isRegisterMode ? "Inicia sesión" : "Regístrate"}
          </button>
        </p>
      </form>
    </div>
  )
}
