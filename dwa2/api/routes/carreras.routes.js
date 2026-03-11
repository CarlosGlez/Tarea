
import express from 'express'
import db from '../config/db.js'

console.log('Carreras routes file loaded')

const router = express.Router()

// GET /api/carreras - Obtener todas las carreras
router.get('/', (req, res) => {
  console.log('GET /api/carreras called')
  db.query('SELECT * FROM carreras', (err, results) => {
    if (err) {
      console.error('Error in GET /api/carreras:', err)
      return res.status(500).json(err)
    }
    console.log('Carreras found:', results.length)
    res.json(results)
  })
})

// GET /api/planes - Obtener planes por carrera_id
router.get('/planes', (req, res) => {
  const { carrera_id } = req.query
  db.query('SELECT * FROM planes_estudio WHERE carrera_id = ?', [carrera_id], (err, results) => {
    if (err) return res.status(500).json(err)
    res.json(results)
  })
})

// GET /api/alumnos - Obtener alumnos por carrera_id
router.get('/alumnos', (req, res) => {
  const { carrera_id } = req.query
  const query = `
    SELECT u.*, a.matricula, a.plan_id, a.estatus_academico, a.generacion, a.escuela_procedencia
    FROM usuarios u
    JOIN alumnos a ON u.id = a.id_alumno
    JOIN planes_estudio p ON a.plan_id = p.id
    WHERE p.carrera_id = ?
  `
  db.query(query, [carrera_id], (err, results) => {
    if (err) return res.status(500).json(err)
    res.json(results)
  })
})

export default router