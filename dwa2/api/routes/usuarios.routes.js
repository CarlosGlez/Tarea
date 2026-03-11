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
  const { nombre_usuario, nombre, apellido, correo, contrasena, rol } = req.body
  const hashedPassword = await bcrypt.hash(contrasena, 10)
  db.query(
    'INSERT INTO usuarios (nombre_usuario, nombre, apellido, correo, contrasena, rol) VALUES (?, ?, ?, ?, ?, ?)',
    [nombre_usuario, nombre || '', apellido || '', correo, hashedPassword, rol],
    (err, result) => {
      if (err) return res.status(500).json(err)
      res.json({ id: result.insertId })
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
  db.query('DELETE FROM usuarios WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json(err)
    res.json({ message: 'Usuario eliminado' })
  })
})

// Obtener datos personales del alumno
router.get('/:id/alumno-datos', (req, res) => {
  const { id } = req.params
  // Consulta básica que funciona con la estructura actual
  db.query(
    `SELECT
      u.id, u.nombre, u.apellido, u.nombre_usuario, u.correo,
      a.matricula, a.escuela_procedencia, a.generacion, a.estatus_academico
    FROM usuarios u
    LEFT JOIN alumnos a ON u.id = a.id_alumno
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
              escuela_procedencia: userData.escuela_procedencia || '',
              generacion: userData.generacion || '',
              estatus_academico: userData.estatus_academico || 'inscrito'
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
            escuela_procedencia: userData.escuela_procedencia || '',
            generacion: userData.generacion || '',
            estatus_academico: userData.estatus_academico || 'inscrito'
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
      LEFT JOIN historial_academico h ON h.materia_id = m.id AND h.alumno_id = ?
      WHERE pm.plan_id = ?
      ORDER BY pm.semestre, m.nombre
    `

    db.query(sql, [alumnoId, planId], (err2, results) => {
      if (err2) return res.status(500).json(err2)
      res.json(results)
    })
  })
})

export default router