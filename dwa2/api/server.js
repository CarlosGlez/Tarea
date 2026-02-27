// Importaciones necesarias para el servidor
import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Importar configuración de base de datos
import db from './config/db.js'

// Importar rutas de la aplicación
import usuariosRoutes from './routes/usuarios.routes.js'
import authRoutes from './routes/auth.routes.js'

// Crear instancia de Express
const app = express()

// Clave secreta para JWT (en producción usar variable de entorno)
const SECRET = "super_secret_key"

// Middleware para permitir CORS (Cross-Origin Resource Sharing)
app.use(cors())
// Middleware para parsear JSON en las peticiones
app.use(express.json())

// Rutas de la API
app.use('/api/usuarios', usuariosRoutes)  // Rutas para gestión de usuarios
app.use('/api/auth', authRoutes)          // Rutas de autenticación

// Endpoint de health check para verificar conexión a BD
app.get('/api/health', (req, res) => {
  db.query('SELECT 1', (err) => {
    if (err) {
      return res.status(500).json({ status: 'error', message: 'BD no disponible' })
    }
    res.json({ status: 'ok', message: 'Conexión a BD exitosa' })
  })
})

// Iniciar servidor en puerto 3000
app.listen(3000, () => {
  console.log('API corriendo en puerto 3000')
})