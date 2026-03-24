
import express from 'express'
import db from '../config/db.js'

console.log('Carreras routes file loaded')

const router = express.Router()

const getCarreraPayload = (body = {}) => ({
  nombre: body.nombre?.trim(),
  abreviatura: body.abreviatura?.trim().toUpperCase(),
})

const parsePositiveInt = (value) => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }
  return parsed
}

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

router.post('/', (req, res) => {
  const { nombre, abreviatura } = getCarreraPayload(req.body)

  if (!nombre || !abreviatura) {
    return res.status(400).json({ message: 'Nombre y abreviatura son obligatorios' })
  }

  db.query(
    'INSERT INTO carreras (nombre, abreviatura) VALUES (?, ?)',
    [nombre, abreviatura],
    (err, result) => {
      if (err) {
        console.error('Error in POST /api/carreras:', err)

        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'Ya existe una carrera con esa abreviatura' })
        }

        return res.status(500).json({ message: 'No se pudo crear la carrera' })
      }

      res.status(201).json({
        id: result.insertId,
        nombre,
        abreviatura,
      })
    }
  )
})

router.put('/:id', (req, res) => {
  const { id } = req.params
  const { nombre, abreviatura } = getCarreraPayload(req.body)

  if (!nombre || !abreviatura) {
    return res.status(400).json({ message: 'Nombre y abreviatura son obligatorios' })
  }

  db.query(
    'UPDATE carreras SET nombre = ?, abreviatura = ? WHERE id = ?',
    [nombre, abreviatura, id],
    (err, result) => {
      if (err) {
        console.error('Error in PUT /api/carreras/:id:', err)

        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'Ya existe una carrera con esa abreviatura' })
        }

        return res.status(500).json({ message: 'No se pudo actualizar la carrera' })
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Carrera no encontrada' })
      }

      return res.json({ id: Number(id), nombre, abreviatura })
    }
  )
})

router.delete('/:id', (req, res) => {
  const { id } = req.params

  db.query('DELETE FROM carreras WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error in DELETE /api/carreras/:id:', err)

      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ message: 'No se puede eliminar la carrera porque tiene información relacionada' })
      }

      return res.status(500).json({ message: 'No se pudo eliminar la carrera' })
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Carrera no encontrada' })
    }

    return res.json({ message: 'Carrera eliminada correctamente' })
  })
})

// GET /api/carreras/materias-catalogo - Obtener materias base
router.get('/materias-catalogo', (_req, res) => {
  const query = `
    SELECT id, codigo, nombre, creditos, tipo_bloque, modalidad
    FROM materias
    ORDER BY nombre
  `

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error in GET /api/carreras/materias-catalogo:', err)
      return res.status(500).json({ message: 'No se pudo obtener el catalogo de materias' })
    }

    return res.json(results)
  })
})

// POST /api/carreras/materias-catalogo - Crear nueva materia en el catalogo
router.post('/materias-catalogo', (req, res) => {
  const nombre = req.body?.nombre?.trim()
  const tipo_bloque = req.body?.tipo_bloque?.trim()
  const creditos = parseInt(req.body?.creditos, 10)
  const modalidad = req.body?.modalidad?.trim() || 'Presencial'

  if (!nombre || !tipo_bloque) {
    return res.status(400).json({ message: 'Nombre y bloque son obligatorios' })
  }

  if (!Number.isInteger(creditos) || creditos < 1 || creditos > 20) {
    return res.status(400).json({ message: 'Los creditos deben ser un numero entero entre 1 y 20' })
  }

  db.query('SELECT IFNULL(MAX(id), 0) AS lastId FROM materias', (countErr, countResult) => {
    if (countErr) {
      console.error('Error counting materias:', countErr)
      return res.status(500).json({ message: 'No se pudo generar el codigo de la materia' })
    }

    const total = (countResult[0].lastId || 0) + 1
    const bloquePrefix = tipo_bloque.replace(/\s+/g, '').substring(0, 3).toUpperCase()
    const nombrePrefix = nombre.replace(/\s+/g, '').substring(0, 3).toUpperCase()
    const codigo = `${bloquePrefix}${nombrePrefix}${String(total).padStart(3, '0')}`

    db.query(
      'INSERT INTO materias (codigo, nombre, creditos, tipo_bloque, modalidad) VALUES (?, ?, ?, ?, ?)',
      [codigo, nombre, creditos, tipo_bloque, modalidad],
      (err, result) => {
        if (err) {
          console.error('Error in POST /api/carreras/materias-catalogo:', err)

          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Ya existe una materia con ese codigo' })
          }

          return res.status(500).json({ message: 'No se pudo crear la materia' })
        }

        return res.status(201).json({
          id: result.insertId,
          codigo,
          nombre,
          creditos,
          tipo_bloque,
          modalidad,
        })
      }
    )
  })
})

// GET /api/carreras/:carreraId/planes - Obtener planes de una carrera
router.get('/:carreraId/planes', (req, res) => {
  const carreraId = parsePositiveInt(req.params.carreraId)

  if (!carreraId) {
    return res.status(400).json({ message: 'carreraId invalido' })
  }

  db.query(
    'SELECT id, nombre, carrera_id, estatus FROM planes_estudio WHERE carrera_id = ? ORDER BY id DESC',
    [carreraId],
    (err, results) => {
      if (err) {
        console.error('Error in GET /api/carreras/:carreraId/planes:', err)
        return res.status(500).json({ message: 'No se pudieron obtener los planes' })
      }

      return res.json(results)
    }
  )
})

// POST /api/carreras/:carreraId/planes - Crear plan para una carrera
router.post('/:carreraId/planes', (req, res) => {
  const carreraId = parsePositiveInt(req.params.carreraId)
  const nombrePlan = req.body?.nombre?.trim()

  if (!carreraId) {
    return res.status(400).json({ message: 'carreraId invalido' })
  }

  if (!nombrePlan) {
    return res.status(400).json({ message: 'El nombre del plan es obligatorio' })
  }

  db.query(
    'INSERT INTO planes_estudio (nombre, carrera_id, estatus) VALUES (?, ?, 1)',
    [nombrePlan, carreraId],
    (err, result) => {
      if (err) {
        console.error('Error in POST /api/carreras/:carreraId/planes:', err)
        return res.status(500).json({ message: 'No se pudo crear el plan de estudio' })
      }

      return res.status(201).json({
        id: result.insertId,
        nombre: nombrePlan,
        carrera_id: carreraId,
        estatus: 1,
      })
    }
  )
})

// GET /api/carreras/planes/:planId/materias - Obtener materias asignadas al plan
router.get('/planes/:planId/materias', (req, res) => {
  const planId = parsePositiveInt(req.params.planId)

  if (!planId) {
    return res.status(400).json({ message: 'planId invalido' })
  }

  const query = `
    SELECT
      pm.plan_id,
      pm.materia_id,
      pm.semestre,
      m.codigo,
      m.nombre,
      m.creditos,
      m.tipo_bloque,
      m.modalidad
    FROM plan_materias pm
    JOIN materias m ON m.id = pm.materia_id
    WHERE pm.plan_id = ?
    ORDER BY pm.semestre, m.nombre
  `

  db.query(query, [planId], (err, results) => {
    if (err) {
      console.error('Error in GET /api/carreras/planes/:planId/materias:', err)
      return res.status(500).json({ message: 'No se pudieron obtener las materias del plan' })
    }

    return res.json(results)
  })
})

// PUT /api/carreras/planes/:planId/materias - Guardar distribucion por semestre
router.put('/planes/:planId/materias', (req, res) => {
  const planId = parsePositiveInt(req.params.planId)
  const materias = Array.isArray(req.body?.materias) ? req.body.materias : null

  if (!planId) {
    return res.status(400).json({ message: 'planId invalido' })
  }

  if (!materias) {
    return res.status(400).json({ message: 'Debes enviar un arreglo de materias' })
  }

  const normalized = []
  const seenMateriaIds = new Set()

  for (const item of materias) {
    const materiaId = parsePositiveInt(item?.materia_id)
    const semestre = parsePositiveInt(item?.semestre)

    if (!materiaId || !semestre || semestre > 12) {
      return res.status(400).json({ message: 'Cada materia debe incluir materia_id y semestre validos (1-12)' })
    }

    if (seenMateriaIds.has(materiaId)) {
      return res.status(400).json({ message: 'No puedes repetir materias dentro del mismo plan' })
    }

    seenMateriaIds.add(materiaId)
    normalized.push([planId, materiaId, semestre])
  }

  db.getConnection((connectionErr, connection) => {
    if (connectionErr) {
      console.error('Error getting DB connection:', connectionErr)
      return res.status(500).json({ message: 'No se pudo guardar la distribucion del plan' })
    }

    connection.beginTransaction((txErr) => {
      if (txErr) {
        connection.release()
        console.error('Error starting transaction:', txErr)
        return res.status(500).json({ message: 'No se pudo guardar la distribucion del plan' })
      }

      connection.query('DELETE FROM plan_materias WHERE plan_id = ?', [planId], (deleteErr) => {
        if (deleteErr) {
          return connection.rollback(() => {
            connection.release()
            console.error('Error deleting plan_materias:', deleteErr)
            res.status(500).json({ message: 'No se pudo actualizar la distribucion del plan' })
          })
        }

        if (normalized.length === 0) {
          return connection.commit((commitErr) => {
            connection.release()

            if (commitErr) {
              console.error('Error committing empty plan update:', commitErr)
              return res.status(500).json({ message: 'No se pudo actualizar la distribucion del plan' })
            }

            return res.json({ message: 'Distribucion guardada correctamente' })
          })
        }

        connection.query(
          'INSERT INTO plan_materias (plan_id, materia_id, semestre) VALUES ?',
          [normalized],
          (insertErr) => {
            if (insertErr) {
              return connection.rollback(() => {
                connection.release()
                console.error('Error inserting plan_materias:', insertErr)
                res.status(500).json({ message: 'No se pudo actualizar la distribucion del plan' })
              })
            }

            return connection.commit((commitErr) => {
              connection.release()

              if (commitErr) {
                console.error('Error committing plan update:', commitErr)
                return res.status(500).json({ message: 'No se pudo actualizar la distribucion del plan' })
              }

              return res.json({ message: 'Distribucion guardada correctamente' })
            })
          }
        )
      })
    })
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