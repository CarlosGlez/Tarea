import express from 'express'
import db from '../config/db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const router = express.Router()
const SECRET = process.env.JWT_SECRET || 'siex2_super_secret_cambia_esto_en_produccion'

router.post('/login', async (req, res) => {
  const { nombre_usuario, password } = req.body

  db.query(
    'SELECT * FROM usuarios WHERE nombre_usuario = ? OR correo = ? LIMIT 1',
    [nombre_usuario, nombre_usuario],
    async (err, results) => {
      if (err) return res.status(500).json({ message: 'Error del servidor' })

      if (results.length === 0) {
        return res.status(401).json({ message: 'Usuario no encontrado' })
      }

      const user = results[0]
      const isPasswordValid = await bcrypt.compare(password, user.contrasena)
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Contraseña incorrecta' })
      }

      const token = jwt.sign({ id: user.id, rol: user.rol }, SECRET, { expiresIn: '2h' })

      const respuesta = {
        token,
        usuario: {
          id: user.id,
          nombre_usuario: user.nombre_usuario,
          rol: user.rol,
          nombre: user.nombre || '',
          apellido: user.apellido || '',
          correo: user.correo || '',
        },
      }

      if (user.rol === 'coordinador') {
        db.query(
          `SELECT cc.carrera_id, c.nombre AS carrera_nombre, c.abreviatura AS carrera_abreviatura, cc.rol_cargo
           FROM coordinador_carrera cc
           JOIN carreras c ON cc.carrera_id = c.id
           WHERE cc.coordinador_id = ? AND cc.activo = 1`,
          [user.id],
          (err2, carreraResults) => {
            if (err2) return res.status(500).json({ message: 'Error del servidor' })
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

router.post('/register', async (req, res) => {
  const { nombre_completo, correo, password, escuela_procedencia, carrera_id, plan_id } = req.body

  if (!nombre_completo || !correo || !password) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' })
  }

  try {
    const fullName = String(nombre_completo).trim()
    const nameParts = fullName.split(/\s+/)
    const nombre = nameParts.shift() || ''
    const apellido = nameParts.join(' ')
    const hashedPassword = await bcrypt.hash(password, 10)

    const baseUsername = `${nombre}${apellido ? '.' + apellido.split(' ')[0] : ''}`
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9._-]/g, '')

    db.getConnection((connErr, connection) => {
      if (connErr) return res.status(500).json({ message: 'Error de conexión' })

      connection.beginTransaction((txErr) => {
        if (txErr) {
          connection.release()
          return res.status(500).json({ message: 'Error iniciando transacción' })
        }

        const rollback = (error) => {
          connection.rollback(() => {
            connection.release()
            res.status(500).json({ message: error?.message || 'Error en el registro' })
          })
        }

        connection.query(
          'SELECT id FROM usuarios WHERE correo = ?',
          [correo],
          (existsErr, existsRows) => {
            if (existsErr) return rollback(existsErr)
            if (existsRows.length > 0) {
              return connection.rollback(() => {
                connection.release()
                res.status(409).json({ message: 'El correo ya está registrado' })
              })
            }

            connection.query(
              `SELECT nombre_usuario FROM usuarios WHERE nombre_usuario LIKE ? ORDER BY nombre_usuario`,
              [`${baseUsername}%`],
              (usernameCheckErr, usernameRows) => {
                if (usernameCheckErr) return rollback(usernameCheckErr)

                const taken = new Set(usernameRows.map(r => r.nombre_usuario))
                let nombre_usuario = baseUsername || correo.split('@')[0]
                if (taken.has(nombre_usuario)) {
                  let counter = 2
                  while (taken.has(`${baseUsername}${counter}`)) counter++
                  nombre_usuario = `${baseUsername}${counter}`
                }

                connection.query(
                  'INSERT INTO usuarios (nombre_usuario, nombre, apellido, correo, contrasena, rol) VALUES (?, ?, ?, ?, ?, ?)',
                  [nombre_usuario, nombre, apellido, correo, hashedPassword, 'alumno'],
              (insertErr, insertResult) => {
                if (insertErr) return rollback(insertErr)

                const userId = insertResult.insertId
                const matricula = `${new Date().getFullYear()}-${String(userId).padStart(6, '0')}`

                if (carrera_id && plan_id) {
                  connection.query(
                    'INSERT INTO alumnos (id_alumno, matricula, plan_id, estatus_academico) VALUES (?, ?, ?, ?)',
                    [userId, matricula, plan_id, 'inscrito'],
                    (alumnoErr) => {
                      if (alumnoErr) return rollback(alumnoErr)

                      connection.query(
                        'INSERT INTO alumno_carrera (alumno_id, carrera_id, activo) VALUES (?, ?, 1)',
                        [userId, carrera_id],
                        (carreraErr) => {
                          if (carreraErr) return rollback(carreraErr)

                          connection.commit((commitErr) => {
                            if (commitErr) return rollback(commitErr)
                            connection.release()
                            return res.status(201).json({ message: 'Cuenta creada exitosamente.', id: userId })
                          })
                        }
                      )
                    }
                  )
                } else {
                  connection.commit((commitErr) => {
                    if (commitErr) return rollback(commitErr)
                    connection.release()
                    return res.status(201).json({
                      message: 'Cuenta creada. Un coordinador debe asignar carrera y plan de estudio.',
                      id: userId,
                    })
                  })
                }
              }
            )
          }
        )
        }
      )
      })
    })
  } catch {
    res.status(500).json({ message: 'No se pudo registrar la cuenta' })
  }
})

export default router
