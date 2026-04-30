import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import db from './config/db.js'
import { verifyToken } from './middleware/auth.js'

import usuariosRoutes from './routes/usuarios.routes.js'
import authRoutes from './routes/auth.routes.js'
import carrerasRoutes from './routes/carreras.routes.js'
import coordinadorRoutes from './routes/coordinador.routes.js'
import chatRoutes from './routes/chat.routes.js'
import anunciosRoutes from './routes/anuncios.routes.js'

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

// Rutas públicas (sin autenticación)
app.use('/api/auth', authRoutes)
app.use('/api/carreras', (req, res, next) => {
  if (req.method === 'GET') return next()
  return verifyToken(req, res, next)
}, carrerasRoutes)

// Rutas protegidas
app.use('/api/usuarios', verifyToken, usuariosRoutes)
app.use('/api/coordinador', verifyToken, coordinadorRoutes)
app.use('/api/chat', verifyToken, chatRoutes)
app.use('/api/anuncios', verifyToken, anunciosRoutes)

app.get('/api/health', (req, res) => {
  db.query('SELECT 1', (err) => {
    if (err) return res.status(500).json({ status: 'error', message: 'BD no disponible' })
    res.json({ status: 'ok', message: 'Conexión a BD exitosa' })
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`API corriendo en puerto ${PORT}`)
})
