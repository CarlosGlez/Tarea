import express from 'express'
import db from '../config/db.js'
import bcrypt from 'bcryptjs'

const router = express.Router()

router.get('/', (req, res) => {
  db.query('SELECT id, nombre_usuario, correo, rol, fecha_creacion FROM usuarios', (err, results) => {
    if (err) return res.status(500).json(err)
    res.json(results)
  })
})

router.post('/', async (req, res) => {
  const { nombre_usuario, correo, contrasena, rol } = req.body
  const hashedPassword = await bcrypt.hash(contrasena, 10)
  db.query(
    'INSERT INTO usuarios (nombre_usuario, correo, contrasena, rol) VALUES (?, ?, ?, ?)',
    [nombre_usuario, correo, hashedPassword, rol],
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