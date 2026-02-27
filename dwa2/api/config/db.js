// Configuración de conexión a MySQL usando mysql2
import mysql from 'mysql2'

// Crear pool de conexiones para mejor rendimiento
const db = mysql.createPool({
  host: 'localhost',     // Dirección del servidor MySQL
  user: 'root',          // Usuario de MySQL
  password: '',          // Contraseña (vacía en desarrollo local)
  database: 'siex2',     // Nombre de la base de datos
  port: 3306            // Puerto por defecto de MySQL
})

// Verificar conexión al iniciar la aplicación
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error conectando a la base de datos:", err)
  } else {
    console.log("✅ Conectado a MySQL (SIEX2)")
    connection.release()  // Liberar conexión de vuelta al pool
  }
})

// Exportar pool de conexiones para usar en otras partes de la app
export default db