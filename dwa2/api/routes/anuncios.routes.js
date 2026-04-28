import express from 'express'
import db from '../config/db.js'

const router = express.Router()

// GET /api/anuncios?alumno_id=  — anuncios para el alumno (su carrera + generales)
// GET /api/anuncios?coordinador_id= — anuncios creados por el coordinador
router.get('/', (req, res) => {
  const { alumno_id, coordinador_id } = req.query

  if (alumno_id) {
    // Obtener la carrera del alumno primero
    db.query(
      'SELECT carrera_id FROM alumno_carrera WHERE alumno_id = ? AND activo = 1 LIMIT 1',
      [alumno_id],
      (err, carreraRows) => {
        if (err) {
          console.error('Error buscando carrera del alumno:', err)
          return res.status(500).json(err)
        }

        const carrera_id = carreraRows[0]?.carrera_id ?? null

        db.query(
          `SELECT
             a.id,
             a.titulo,
             a.contenido,
             a.carrera_id,
             c.nombre  AS carrera_nombre,
             u.nombre  AS coordinador_nombre,
             u.apellido AS coordinador_apellido,
             a.creado_en
           FROM anuncios a
           JOIN usuarios u ON a.coordinador_id = u.id
           LEFT JOIN carreras c ON a.carrera_id = c.id
           WHERE a.carrera_id IS NULL OR a.carrera_id = ?
           ORDER BY a.creado_en DESC`,
          [carrera_id],
          (err2, results) => {
            if (err2) {
              console.error('Error cargando anuncios del alumno:', err2)
              return res.status(500).json(err2)
            }
            res.json(results)
          }
        )
      }
    )
  } else if (coordinador_id) {
    db.query(
      `SELECT
         a.id,
         a.titulo,
         a.contenido,
         a.carrera_id,
         c.nombre  AS carrera_nombre,
         u.nombre  AS coordinador_nombre,
         u.apellido AS coordinador_apellido,
         a.creado_en
       FROM anuncios a
       JOIN usuarios u ON a.coordinador_id = u.id
       LEFT JOIN carreras c ON a.carrera_id = c.id
       WHERE a.coordinador_id = ?
       ORDER BY a.creado_en DESC`,
      [coordinador_id],
      (err, results) => {
        if (err) {
          console.error('Error cargando anuncios del coordinador:', err)
          return res.status(500).json(err)
        }
        res.json(results)
      }
    )
  } else {
    return res.status(400).json({ message: 'alumno_id o coordinador_id son requeridos' })
  }
})

// GET /api/anuncios/nuevos-count?alumno_id=&desde= — cuántos anuncios nuevos desde una fecha
router.get('/nuevos-count', (req, res) => {
  const { alumno_id, desde } = req.query

  if (!alumno_id) {
    return res.status(400).json({ message: 'alumno_id es requerido' })
  }

  db.query(
    'SELECT carrera_id FROM alumno_carrera WHERE alumno_id = ? AND activo = 1 LIMIT 1',
    [alumno_id],
    (err, carreraRows) => {
      if (err) {
        console.error('Error buscando carrera:', err)
        return res.status(500).json(err)
      }

      const carrera_id = carreraRows[0]?.carrera_id ?? null
      const desdeDate = desde ? new Date(desde) : new Date(0)

      db.query(
        `SELECT COUNT(*) AS total FROM anuncios
         WHERE (carrera_id IS NULL OR carrera_id = ?) AND creado_en > ?`,
        [carrera_id, desdeDate],
        (err2, results) => {
          if (err2) {
            console.error('Error en nuevos-count:', err2)
            return res.status(500).json(err2)
          }
          res.json({ total: Number(results[0].total) })
        }
      )
    }
  )
})

// POST /api/anuncios — crear anuncio
// Body: { coordinador_id, titulo, contenido, carrera_id? }
router.post('/', (req, res) => {
  const { coordinador_id, titulo, contenido, carrera_id } = req.body

  if (!coordinador_id || !titulo?.trim() || !contenido?.trim()) {
    return res.status(400).json({ message: 'coordinador_id, titulo y contenido son requeridos' })
  }

  db.query(
    'INSERT INTO anuncios (coordinador_id, titulo, contenido, carrera_id) VALUES (?, ?, ?, ?)',
    [coordinador_id, titulo.trim(), contenido.trim(), carrera_id || null],
    (err, result) => {
      if (err) {
        console.error('Error creando anuncio:', err)
        return res.status(500).json(err)
      }
      res.status(201).json({ id: result.insertId })
    }
  )
})

// DELETE /api/anuncios/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params

  db.query('DELETE FROM anuncios WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Error eliminando anuncio:', err)
      return res.status(500).json(err)
    }
    res.json({ ok: true })
  })
})

export default router
