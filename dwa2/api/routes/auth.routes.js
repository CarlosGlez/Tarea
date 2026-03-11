// Rutas de autenticación
import express from 'express'
import db from '../config/db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Crear router de Express
const router = express.Router()
// Clave secreta para firmar tokens JWT
const SECRET = "super_secret_key"

// Ruta POST para login de usuarios
router.post('/login', async (req, res) => {
  // Logs de debug para ver qué datos llegan
  console.log('Login attempt:', req.body)
  console.log('req.body.nombre_usuario:', req.body.nombre_usuario)
  console.log('req.body.password:', req.body.password)
  
  // Extraer nombre_usuario y password del body de la petición
  const nombre_usuario = req.body.nombre_usuario
  const password = req.body.password
  
  console.log('Nombre usuario variable:', nombre_usuario)
  console.log('Password variable:', password)
  console.log('Buscando usuario con nombre_usuario:', nombre_usuario)

  // Consultar usuario en la base de datos
  db.query(
    'SELECT * FROM usuarios WHERE nombre_usuario = ?',
    [nombre_usuario],
    async (err, results) => {
      // Manejar errores de consulta
      if (err) {
        console.log("Error SQL:", err)
        return res.status(500).json(err)
      }

      console.log('Resultados de la búsqueda:', results)

      // Verificar si el usuario existe
      if (results.length === 0) {
        console.log("Usuario no encontrado con nombre_usuario:", nombre_usuario)
        return res.status(401).json({ message: "Usuario no encontrado" })
      }

      // Obtener el primer resultado (usuario encontrado)
      const user = results[0]

      console.log("Usuario encontrado:", user)
      console.log("Contraseña recibida:", password)
      console.log("Contraseña en BD:", user.contrasena)

      // Comparar contraseña usando bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.contrasena)
      if (!isPasswordValid) {
        console.log("Contraseña incorrecta")
        return res.status(401).json({ message: "Contraseña incorrecta" })
      }

      // Generar token JWT con información del usuario
      const token = jwt.sign(
        { id: user.id, rol: user.rol },
        SECRET,
        { expiresIn: "2h" }  // Token válido por 2 horas
      )

      // Responder con token y datos del usuario
      const respuesta = {
        token,
        usuario: {
          id: user.id,
          nombre_usuario: user.nombre_usuario,
          rol: user.rol,
          // añadir campos personales si ya están en la tabla usuarios
          nombre: user.nombre || '',
          apellido: user.apellido || '',
          correo: user.correo || ''
        }
      }

      // Si es coordinador, obtener su carrera asignada
      if (user.rol === 'coordinador') {
        db.query(
          `SELECT cc.id as coordinador_carrera_id, cc.carrera_id, c.nombre as carrera_nombre, 
                  c.abreviatura as carrera_abreviatura, cc.rol_cargo
           FROM coordinador_carrera cc
           JOIN carreras c ON cc.carrera_id = c.id
           WHERE cc.coordinador_id = ? AND cc.activo = 1`,
          [user.id],
          (err, carreraResults) => {
            if (err) {
              console.log("Error al obtener carrera del coordinador:", err)
              return res.status(500).json(err)
            }

            if (carreraResults.length > 0) {
              const carrera = carreraResults[0]
              respuesta.usuario.carrera_id = carrera.carrera_id
              respuesta.usuario.carrera_nombre = carrera.carrera_nombre
              respuesta.usuario.carrera_abreviatura = carrera.carrera_abreviatura
              respuesta.usuario.rol_cargo = carrera.rol_cargo
            }

            res.json(respuesta)
          }
        )
      } else {
        res.json(respuesta)
      }
    }
  )
})

// Exportar router para usar en server.js
export default router
