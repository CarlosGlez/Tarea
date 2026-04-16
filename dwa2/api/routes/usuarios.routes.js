import express from 'express'
import db from '../config/db.js'
import bcrypt from 'bcryptjs'

const router = express.Router()

router.get('/', (req, res) => {
  db.query('SELECT id, nombre_usuario, nombre, apellido, correo, rol, fecha_creacion FROM usuarios', (err, results) => {
    if (err) return res.status(500).json(err)
    res.json(results)
  })
})

router.post('/', async (req, res) => {
  const { nombre_usuario, nombre, apellido, correo, contrasena, rol, carrera_id, plan_id } = req.body
  console.log('POST /usuarios - Datos recibidos:', { nombre_usuario, rol, carrera_id, plan_id })
  const hashedPassword = await bcrypt.hash(contrasena, 10)
  
  db.query(
    'INSERT INTO usuarios (nombre_usuario, nombre, apellido, correo, contrasena, rol) VALUES (?, ?, ?, ?, ?, ?)',
    [nombre_usuario, nombre || '', apellido || '', correo, hashedPassword, rol],
    (err, result) => {
      if (err) {
        console.error('Error creando usuario:', err)
        return res.status(500).json(err)
      }
      
      const userId = result.insertId
      console.log('Usuario creado exitosamente con ID:', userId)
      
      // Si es alumno, crear registro en alumnos y asignar a carrera
      if (rol === 'alumno' && carrera_id && plan_id) {
        console.log('Creando alumno con carrera_id:', carrera_id, 'plan_id:', plan_id)
        // Crear registro en tabla alumnos
        db.query(
          'INSERT INTO alumnos (id_alumno, matricula, plan_id, estatus_academico) VALUES (?, ?, ?, ?)',
          [userId, `${Date.now()}`, plan_id, 'inscrito'],
          (err) => {
            if (err) {
              console.error('Error creating alumno record:', err)
              return res.status(500).json(err)
            }
            console.log('Registro en alumnos creado exitosamente')
            
            // Asignar a carrera
            console.log('Asignando a carrera - alumno_id:', userId, 'carrera_id:', carrera_id)
            db.query(
              'INSERT INTO alumno_carrera (alumno_id, carrera_id, activo) VALUES (?, ?, ?)',
              [userId, carrera_id, 1],
              (err) => {
                if (err) {
                  console.error('Error assigning alumno to carrera:', err)
                  return res.status(500).json(err)
                }
                console.log('Alumno asignado a carrera exitosamente')
                res.json({ id: userId, message: 'Alumno creado y asignado a carrera' })
              }
            )
          }
        )
      }
      // Si es coordinador, crear registro en coordinadores y asignar a carrera
      else if (rol === 'coordinador' && carrera_id) {
        // Crear registro en tabla coordinadores
        db.query(
          'INSERT INTO coordinadores (id_coordinador) VALUES (?)',
          [userId],
          (err) => {
            if (err) {
              console.error('Error creating coordinador record:', err)
              return res.status(500).json(err)
            }
            
            // Asignar a carrera
            db.query(
              'INSERT INTO coordinador_carrera (coordinador_id, carrera_id, rol_cargo, activo) VALUES (?, ?, ?, ?)',
              [userId, carrera_id, 'coordinador', 1],
              (err) => {
                if (err) {
                  console.error('Error assigning coordinador to carrera:', err)
                  return res.status(500).json(err)
                }
                res.json({ id: userId, message: 'Coordinador creado y asignado a carrera' })
              }
            )
          }
        )
      }
      else {
        res.json({ id: userId })
      }
    }
  )
})

router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { nombre_usuario, correo, contrasena, rol } = req.body
  let query = 'UPDATE usuarios SET nombre_usuario = ?, correo = ?, rol = ? WHERE id = ?'
  let params = [nombre_usuario, correo, rol, id]

  if (contrasena) {
    const hashedPassword = await bcrypt.hash(contrasena, 10)
    query = 'UPDATE usuarios SET nombre_usuario = ?, correo = ?, contrasena = ?, rol = ? WHERE id = ?'
    params = [nombre_usuario, correo, hashedPassword, rol, id]
  }

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json(err)
    res.json({ message: 'Usuario actualizado' })
  })
})

router.delete('/:id', (req, res) => {
  const { id } = req.params
  db.getConnection((connectionErr, connection) => {
    if (connectionErr) return res.status(500).json(connectionErr)

    connection.beginTransaction((txErr) => {
      if (txErr) {
        connection.release()
        return res.status(500).json(txErr)
      }

      const rollback = (error) => {
        connection.rollback(() => {
          connection.release()
          return res.status(500).json(error)
        })
      }

      connection.query('DELETE FROM historial_academico WHERE alumno_id = ?', [id], (err) => {
        if (err) return rollback(err)

        connection.query('DELETE FROM enrolamiento WHERE alumno_id = ?', [id], (err2) => {
          if (err2) return rollback(err2)

          connection.query('DELETE FROM alumno_carrera WHERE alumno_id = ?', [id], (err3) => {
            if (err3) return rollback(err3)

            connection.query('DELETE FROM alumnos WHERE id_alumno = ?', [id], (err4) => {
              if (err4) return rollback(err4)

              connection.query('DELETE FROM coordinador_carrera WHERE coordinador_id = ?', [id], (err5) => {
                if (err5) return rollback(err5)

                connection.query('DELETE FROM coordinadores WHERE id_coordinador = ?', [id], (err6) => {
                  if (err6) return rollback(err6)

                  connection.query('DELETE FROM usuarios WHERE id = ?', [id], (err7) => {
                    if (err7) return rollback(err7)

                    connection.commit((commitErr) => {
                      if (commitErr) return rollback(commitErr)
                      connection.release()
                      return res.json({ message: 'Usuario eliminado' })
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  })
})

// Actualizar carrera/plan de un alumno
router.put('/:id/alumno-programa', (req, res) => {
  const { id } = req.params
  const { carrera_id, plan_id } = req.body

  if (!carrera_id || !plan_id) {
    return res.status(400).json({ message: 'carrera_id y plan_id son requeridos' })
  }

  db.query(
    `SELECT id FROM planes_estudio WHERE id = ? AND carrera_id = ?`,
    [plan_id, carrera_id],
    (planErr, planRows) => {
      if (planErr) return res.status(500).json(planErr)
      if (!planRows || planRows.length === 0) {
        return res.status(400).json({ message: 'El plan no pertenece a la carrera seleccionada' })
      }

      db.getConnection((connectionErr, connection) => {
        if (connectionErr) return res.status(500).json(connectionErr)

        connection.beginTransaction((txErr) => {
          if (txErr) {
            connection.release()
            return res.status(500).json(txErr)
          }

          const rollback = (error) => {
            connection.rollback(() => {
              connection.release()
              return res.status(500).json(error)
            })
          }

          connection.query('SELECT id_alumno FROM alumnos WHERE id_alumno = ?', [id], (alumnoErr, alumnoRows) => {
            if (alumnoErr) return rollback(alumnoErr)
            if (!alumnoRows || alumnoRows.length === 0) {
              connection.rollback(() => {
                connection.release()
                return res.status(404).json({ message: 'Alumno no encontrado' })
              })
              return
            }

            connection.query('UPDATE alumnos SET plan_id = ? WHERE id_alumno = ?', [plan_id, id], (updateAlumnoErr) => {
              if (updateAlumnoErr) return rollback(updateAlumnoErr)

              connection.query('UPDATE alumno_carrera SET activo = 0 WHERE alumno_id = ?', [id], (deactivateErr) => {
                if (deactivateErr) return rollback(deactivateErr)

                connection.query(
                  'SELECT id FROM alumno_carrera WHERE alumno_id = ? AND carrera_id = ? LIMIT 1',
                  [id, carrera_id],
                  (existsErr, existsRows) => {
                    if (existsErr) return rollback(existsErr)

                    const finish = () => {
                      connection.commit((commitErr) => {
                        if (commitErr) return rollback(commitErr)
                        connection.release()
                        return res.json({ message: 'Programa del alumno actualizado' })
                      })
                    }

                    if (existsRows.length > 0) {
                      connection.query(
                        'UPDATE alumno_carrera SET activo = 1 WHERE id = ?',
                        [existsRows[0].id],
                        (reactivateErr) => {
                          if (reactivateErr) return rollback(reactivateErr)
                          finish()
                        }
                      )
                      return
                    }

                    connection.query(
                      'INSERT INTO alumno_carrera (alumno_id, carrera_id, activo) VALUES (?, ?, 1)',
                      [id, carrera_id],
                      (insertErr) => {
                        if (insertErr) return rollback(insertErr)
                        finish()
                      }
                    )
                  }
                )
              })
            })
          })
        })
      })
    }
  )
})

// Obtener datos personales del alumno
router.get('/:id/alumno-datos', (req, res) => {
  const { id } = req.params
  // Consulta básica que funciona con la estructura actual
  db.query(
    `SELECT
      u.id, u.nombre, u.apellido, u.nombre_usuario, u.correo, u.fecha_creacion,
      a.matricula, a.escuela_procedencia, a.generacion, a.estatus_academico,
      c.nombre AS carrera_nombre,
      p.nombre AS plan_estudios
    FROM usuarios u
    LEFT JOIN alumnos a ON u.id = a.id_alumno
    LEFT JOIN alumno_carrera ac ON u.id = ac.alumno_id AND ac.activo = 1
    LEFT JOIN carreras c ON ac.carrera_id = c.id
    LEFT JOIN planes_estudio p ON a.plan_id = p.id
    WHERE u.id = ? AND u.rol = 'alumno'`,
    [id],
    (err, results) => {
      if (err) return res.status(500).json(err)
      if (!results.length) return res.status(404).json({ message: 'Alumno no encontrado' })

      const userData = results[0]

      // Intentar obtener campos adicionales si existen (usando consulta separada)
      db.query(
        `SELECT numero_telefono, numero_identificacion, fecha_nacimiento FROM alumnos WHERE id_alumno = ?`,
        [id],
        (err2, additionalResults) => {
          if (err2) {
            // Si hay error (probablemente campos no existen), devolver datos básicos
            return res.json({
              id: userData.id,
              nombre: userData.nombre || '',
              apellido: userData.apellido || '',
              nombre_usuario: userData.nombre_usuario,
              correo: userData.correo,
              matricula: userData.matricula || '',
              numero_telefono: '',
              numero_identificacion: '',
              fecha_nacimiento: null,
              fecha_alta: userData.fecha_creacion || null,
              escuela_procedencia: userData.escuela_procedencia || '',
              generacion: userData.generacion || '',
              estatus_academico: userData.estatus_academico || 'inscrito',
              carrera_nombre: userData.carrera_nombre || '',
              plan_estudios: userData.plan_estudios || ''
            })
          }

          const additionalData = additionalResults && additionalResults.length > 0 ? additionalResults[0] : {}

          res.json({
            id: userData.id,
            nombre: userData.nombre || '',
            apellido: userData.apellido || '',
            nombre_usuario: userData.nombre_usuario,
            correo: userData.correo,
            matricula: userData.matricula || '',
            numero_telefono: additionalData.numero_telefono || '',
            numero_identificacion: additionalData.numero_identificacion || '',
            fecha_nacimiento: additionalData.fecha_nacimiento || null,
            fecha_alta: userData.fecha_creacion || null,
            escuela_procedencia: userData.escuela_procedencia || '',
            generacion: userData.generacion || '',
            estatus_academico: userData.estatus_academico || 'inscrito',
            carrera_nombre: userData.carrera_nombre || '',
            plan_estudios: userData.plan_estudios || ''
          })
        }
      )
    })
})

// Actualizar datos personales del alumno
router.put('/:id/alumno-datos', (req, res) => {
  const { id } = req.params
  const { nombre, apellido, numero_telefono, numero_identificacion, fecha_nacimiento } = req.body

  // Actualizar usuarios
  db.query(
    'UPDATE usuarios SET nombre = ?, apellido = ? WHERE id = ?',
    [nombre, apellido, id],
    (err) => {
      if (err) return res.status(500).json(err)

      // Intentar actualizar campos adicionales (si existen)
      db.query(
        'UPDATE alumnos SET numero_telefono = ?, numero_identificacion = ?, fecha_nacimiento = ? WHERE id_alumno = ?',
        [numero_telefono || null, numero_identificacion || null, fecha_nacimiento || null, id],
        (err2) => {
          // Si hay error (probablemente campos no existen), intentar crear registro básico
          if (err2) {
            db.query('SELECT id_alumno FROM alumnos WHERE id_alumno = ?', [id], (err3, results) => {
              if (err3) return res.status(500).json(err3)

              if (results.length === 0) {
                // Crear registro básico en alumnos
                db.query(
                  'INSERT INTO alumnos (id_alumno) VALUES (?)',
                  [id],
                  (err4) => {
                    if (err4) return res.status(500).json(err4)
                    res.json({ message: 'Datos personales actualizados (campos básicos)' })
                  }
                )
              } else {
                res.json({ message: 'Datos personales actualizados (campos básicos)' })
              }
            })
          } else {
            res.json({ message: 'Datos personales actualizados' })
          }
        }
      )
    }
  )
})

// Obtener datos personales del coordinador
router.get('/:id/coordinador-datos', (req, res) => {
  const { id } = req.params
  // Consulta básica que funciona con la estructura actual
  db.query(
    `SELECT
      u.id, u.nombre, u.apellido, u.nombre_usuario, u.correo,
      c.telefono, c.oficina, c.horario_atencion
    FROM usuarios u
    LEFT JOIN coordinadores c ON u.id = c.id_coordinador
    WHERE u.id = ? AND u.rol = 'coordinador'`,
    [id],
    (err, results) => {
      if (err) return res.status(500).json(err)
      if (!results.length) return res.status(404).json({ message: 'Coordinador no encontrado' })

      const userData = results[0]

      // Intentar obtener campos adicionales si existen
      db.query(
        `SELECT numero_identificacion, especialidad, fecha_nacimiento FROM coordinadores WHERE id_coordinador = ?`,
        [id],
        (err2, additionalResults) => {
          if (err2) {
            // Si hay error (probablemente campos no existen), devolver datos básicos
            return res.json({
              id: userData.id,
              nombre: userData.nombre || '',
              apellido: userData.apellido || '',
              nombre_usuario: userData.nombre_usuario,
              correo: userData.correo,
              telefono: userData.telefono || '',
              numero_identificacion: '',
              oficina: userData.oficina || '',
              horario_atencion: userData.horario_atencion || '',
              especialidad: '',
              fecha_nacimiento: null
            })
          }

          const additionalData = additionalResults && additionalResults.length > 0 ? additionalResults[0] : {}

          res.json({
            id: userData.id,
            nombre: userData.nombre || '',
            apellido: userData.apellido || '',
            nombre_usuario: userData.nombre_usuario,
            correo: userData.correo,
            telefono: userData.telefono || '',
            numero_identificacion: additionalData.numero_identificacion || '',
            oficina: userData.oficina || '',
            horario_atencion: userData.horario_atencion || '',
            especialidad: additionalData.especialidad || '',
            fecha_nacimiento: additionalData.fecha_nacimiento || null
          })
        }
      )
    })
})

// Actualizar datos personales del coordinador
router.put('/:id/coordinador-datos', (req, res) => {
  const { id } = req.params
  const { nombre, apellido, telefono, numero_identificacion, oficina, horario_atencion, especialidad, fecha_nacimiento } = req.body

  // Actualizar usuarios
  db.query(
    'UPDATE usuarios SET nombre = ?, apellido = ? WHERE id = ?',
    [nombre, apellido, id],
    (err) => {
      if (err) return res.status(500).json(err)

      // Verificar si existe registro en coordinadores
      db.query('SELECT id_coordinador FROM coordinadores WHERE id_coordinador = ?', [id], (err2, results) => {
        if (err2) return res.status(500).json(err2)

        if (results.length === 0) {
          // Crear registro en coordinadores si no existe
          db.query(
            'INSERT INTO coordinadores (id_coordinador, telefono, numero_identificacion, oficina, horario_atencion, especialidad, fecha_nacimiento) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, telefono || null, numero_identificacion || null, oficina || null, horario_atencion || null, especialidad || null, fecha_nacimiento || null],
            (err3) => {
              if (err3) return res.status(500).json(err3)
              res.json({ message: 'Datos personales actualizados' })
            }
          )
        } else {
          // Actualizar registro existente
          db.query(
            'UPDATE coordinadores SET telefono = ?, numero_identificacion = ?, oficina = ?, horario_atencion = ?, especialidad = ?, fecha_nacimiento = ? WHERE id_coordinador = ?',
            [telefono || null, numero_identificacion || null, oficina || null, horario_atencion || null, especialidad || null, fecha_nacimiento || null, id],
            (err3) => {
              if (err3) return res.status(500).json(err3)
              res.json({ message: 'Datos personales actualizados' })
            }
          )
        }
      })
    }
  )
})

// Obtener materias del plan de un alumno (incluye estatus desde historial_academico)
router.get('/:id/materias', (req, res) => {
  const alumnoId = req.params.id

  // Primero obtener el plan_id del alumno
  db.query('SELECT plan_id FROM alumnos WHERE id_alumno = ?', [alumnoId], (err, rows) => {
    if (err) return res.status(500).json(err)
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Alumno no encontrado o sin plan asignado' })

    const planId = rows[0].plan_id

    const sql = `
      SELECT
        m.id,
        m.codigo,
        m.nombre,
        m.creditos,
        m.tipo_bloque,
        m.modalidad,
        pm.semestre,
        COALESCE(h.estatus, 'no_cursada') AS estatus,
        h.calificacion,
        h.periodo
      FROM plan_materias pm
      JOIN materias m ON pm.materia_id = m.id
      LEFT JOIN (
        SELECT h1.*
        FROM historial_academico h1
        INNER JOIN (
          SELECT alumno_id, materia_id, MAX(id) AS max_id
          FROM historial_academico
          WHERE alumno_id = ?
          GROUP BY alumno_id, materia_id
        ) h2 ON h1.id = h2.max_id
      ) h ON h.materia_id = m.id AND h.alumno_id = ?
      WHERE pm.plan_id = ?
      ORDER BY pm.semestre, m.nombre
    `

    db.query(sql, [alumnoId, alumnoId, planId], (err2, results) => {
      if (err2) return res.status(500).json(err2)
      res.json(results)
    })
  })
})

export default router