// Componente principal de la aplicación React
import { useEffect, useState } from "react"
// Importar componentes de login y dashboards
import { LoginForm } from "./components/LoginForm"
import { AlumnoDashboard } from "./pages/AlumnoDashboard"
import { CoordinadorDashboard } from "./pages/CoordinadorDashboard"
import { AdminDashboard } from "./pages/AdminDashboard"
import { ThemeProvider } from "./contexts/ThemeContext"
import './App.css'


// Componente App que maneja el routing basado en hash
function App() {
  // Estado para controlar qué página mostrar
  const [currentPage, setCurrentPage] = useState("login")
  // Estado para mostrar loading mientras se verifica autenticación
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Función para manejar cambios en el hash de la URL
    const handleRouteChange = () => {
      // Obtener hash actual (ej: "#/alumno")
      const hash = window.location.hash.slice(1) // Remover #
      // Verificar si hay token de autenticación
      const token = sessionStorage.getItem("token")

      // Si no hay token, mostrar login
      if (!token) {
        setCurrentPage("login")
        window.location.hash = ""  // Limpiar hash
        setLoading(false)
        return
      }

      // Determinar página según hash
      if (hash === "/alumno" || hash.startsWith("/alumno")) {
        setCurrentPage("alumno")
      } else if (hash === "/coordinador" || hash.startsWith("/coordinador")) {
        setCurrentPage("coordinador")
      } else if (hash === "/admin" || hash.startsWith("/admin")) {
        setCurrentPage("admin")
      } else {
        setCurrentPage("login")
      }
      setLoading(false)
    }

    // Ejecutar al montar componente
    handleRouteChange()
    // Escuchar cambios en el hash
    window.addEventListener("hashchange", handleRouteChange)
    // Limpiar listener al desmontar
    return () => window.removeEventListener("hashchange", handleRouteChange)
  }, [])

  // Mostrar loading mientras se verifica autenticación
  if (loading) return <div className="appLoading">Cargando...</div>

  // Renderizar página correspondiente
  return (
    <ThemeProvider>
      <div key={currentPage} className="pageContainer">
        {currentPage === "login" && <LoginForm />}
        {currentPage === "alumno" && <AlumnoDashboard />}
        {currentPage === "coordinador" && <CoordinadorDashboard />}
        {currentPage === "admin" && <AdminDashboard />}
      </div>
    </ThemeProvider>
  )
}

export default App