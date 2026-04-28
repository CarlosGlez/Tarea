import express from 'express'
import db from '../config/db.js'

const router = express.Router()

// GET /api/chat/conversaciones?usuario_id=&rol=
router.get('/conversaciones', (req, res) => {
  const { usuario_id, rol } = req.query

  if (!usuario_id || !rol) {
    return res.status(400).json({ message: 'usuario_id y rol son requeridos' })
  }

  let query, params

  if (rol === 'alumno') {
    query = `
      SELECT
        c.id,
        c.asunto,
        c.estado,
        c.creado_en,
        c.actualizado_en,
        u.nombre  AS coordinador_nombre,
        u.apellido AS coordinador_apellido,
        (SELECT COUNT(*) FROM mensajes m
         WHERE m.conversacion_id = c.id AND m.leido = 0 AND m.remitente_id != ?) AS mensajes_sin_leer
      FROM conversaciones c
      JOIN usuarios u ON c.coordinador_id = u.id
      WHERE c.alumno_id = ?
      ORDER BY c.actualizado_en DESC
    `
    params = [usuario_id, usuario_id]
  } else if (rol === 'coordinador') {
    query = `
      SELECT
        c.id,
        c.asunto,
        c.estado,
        c.creado_en,
        c.actualizado_en,
        u.nombre  AS alumno_nombre,
        u.apellido AS alumno_apellido,
        a.matricula,
        (SELECT COUNT(*) FROM mensajes m
         WHERE m.conversacion_id = c.id AND m.leido = 0 AND m.remitente_id != ?) AS mensajes_sin_leer
      FROM conversaciones c
      JOIN alumnos a ON c.alumno_id = a.id_alumno
      JOIN usuarios u ON a.id_alumno = u.id
      WHERE c.coordinador_id = ?
      ORDER BY c.actualizado_en DESC
    `
    params = [usuario_id, usuario_id]
  } else {
    return res.status(400).json({ message: 'rol inválido' })
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error en GET /api/chat/conversaciones:', err)
      return res.status(500).json(err)
    }
    res.json(results)
  })
})

// GET /api/chat/coordinadores?alumno_id= — coordinadores disponibles para un alumno
router.get('/coordinadores', (req, res) => {
  const { alumno_id } = req.query

  if (!alumno_id) {
    return res.status(400).json({ message: 'alumno_id es requerido' })
  }

  db.query(
    `SELECT u.id, u.nombre, u.apellido, cc.rol_cargo
     FROM alumno_carrera ac
     JOIN coordinador_carrera cc ON ac.carrera_id = cc.carrera_id
     JOIN usuarios u ON cc.coordinador_id = u.id
     WHERE ac.alumno_id = ? AND ac.activo = 1 AND cc.activo = 1`,
    [alumno_id],
    (err, results) => {
      if (err) {
        console.error('Error en GET /api/chat/coordinadores:', err)
        return res.status(500).json(err)
      }
      res.json(results)
    }
  )
})

// POST /api/chat/conversaciones — alumno inicia conversacion
// Body: { alumno_id, asunto, coordinador_id? }
router.post('/conversaciones', (req, res) => {
  const { alumno_id, asunto, coordinador_id } = req.body

  if (!alumno_id || !asunto?.trim()) {
    return res.status(400).json({ message: 'alumno_id y asunto son requeridos' })
  }

  const insertarConversacion = (coord_id) => {
    db.query(
      'INSERT INTO conversaciones (alumno_id, coordinador_id, asunto) VALUES (?, ?, ?)',
      [alumno_id, coord_id, asunto.trim()],
      (insertErr, insertResult) => {
        if (insertErr) {
          console.error('Error creando conversación:', insertErr)
          return res.status(500).json(insertErr)
        }
        res.status(201).json({ id: insertResult.insertId, coordinador_id: coord_id })
      }
    )
  }

  if (coordinador_id) {
    // Usar el coordinador elegido por el alumno
    insertarConversacion(coordinador_id)
  } else {
    // Fallback: tomar el primero de la carrera
    db.query(
      `SELECT cc.coordinador_id
       FROM alumno_carrera ac
       JOIN coordinador_carrera cc ON ac.carrera_id = cc.carrera_id
       WHERE ac.alumno_id = ? AND ac.activo = 1 AND cc.activo = 1
       LIMIT 1`,
      [alumno_id],
      (err, results) => {
        if (err) {
          console.error('Error buscando coordinador:', err)
          return res.status(500).json(err)
        }
        if (results.length === 0) {
          return res.status(404).json({ message: 'No se encontró un coordinador asignado a tu carrera' })
        }
        insertarConversacion(results[0].coordinador_id)
      }
    )
  }
})

// PUT /api/chat/conversaciones/:id/estado — cerrar o reabrir conversación
// Body: { estado: 'abierta' | 'cerrada' }
router.put('/conversaciones/:id/estado', (req, res) => {
  const { id } = req.params
  const { estado } = req.body

  if (!['abierta', 'cerrada'].includes(estado)) {
    return res.status(400).json({ message: 'estado debe ser "abierta" o "cerrada"' })
  }

  db.query(
    'UPDATE conversaciones SET estado = ? WHERE id = ?',
    [estado, id],
    (err) => {
      if (err) {
        console.error('Error actualizando estado de conversación:', err)
        return res.status(500).json(err)
      }
      res.json({ ok: true })
    }
  )
})

// DELETE /api/chat/conversaciones/:id — eliminar conversación y sus mensajes
router.delete('/conversaciones/:id', (req, res) => {
  const { id } = req.params

  // Borrar mensajes primero por FK constraint
  db.query('DELETE FROM mensajes WHERE conversacion_id = ?', [id], (err) => {
    if (err) {
      console.error('Error borrando mensajes:', err)
      return res.status(500).json(err)
    }

    db.query('DELETE FROM conversaciones WHERE id = ?', [id], (err2) => {
      if (err2) {
        console.error('Error borrando conversación:', err2)
        return res.status(500).json(err2)
      }
      res.json({ ok: true })
    })
  })
})

// GET /api/chat/sin-leer-total?usuario_id=&rol= — total de mensajes no leídos
router.get('/sin-leer-total', (req, res) => {
  const { usuario_id, rol } = req.query

  if (!usuario_id || !rol) {
    return res.status(400).json({ message: 'usuario_id y rol son requeridos' })
  }

  const query = rol === 'alumno'
    ? `SELECT COUNT(*) AS total
       FROM mensajes m
       JOIN conversaciones c ON m.conversacion_id = c.id
       WHERE c.alumno_id = ? AND m.remitente_id != ? AND m.leido = 0`
    : `SELECT COUNT(*) AS total
       FROM mensajes m
       JOIN conversaciones c ON m.conversacion_id = c.id
       WHERE c.coordinador_id = ? AND m.remitente_id != ? AND m.leido = 0`

  db.query(query, [usuario_id, usuario_id], (err, results) => {
    if (err) {
      console.error('Error en GET /api/chat/sin-leer-total:', err)
      return res.status(500).json(err)
    }
    res.json({ total: Number(results[0].total) })
  })
})

// GET /api/chat/mensajes/:conversacionId
router.get('/mensajes/:conversacionId', (req, res) => {
  const { conversacionId } = req.params

  db.query(
    `SELECT
       m.id,
       m.conversacion_id,
       m.remitente_id,
       m.contenido,
       m.leido,
       m.enviado_en,
       u.nombre   AS remitente_nombre,
       u.apellido AS remitente_apellido,
       u.rol      AS remitente_rol
     FROM mensajes m
     JOIN usuarios u ON m.remitente_id = u.id
     WHERE m.conversacion_id = ?
     ORDER BY m.enviado_en ASC`,
    [conversacionId],
    (err, results) => {
      if (err) {
        console.error('Error en GET /api/chat/mensajes:', err)
        return res.status(500).json(err)
      }
      res.json(results)
    }
  )
})

// POST /api/chat/mensajes — enviar mensaje
// Body: { conversacion_id, remitente_id, contenido }
router.post('/mensajes', (req, res) => {
  const { conversacion_id, remitente_id, contenido } = req.body

  if (!conversacion_id || !remitente_id || !contenido?.trim()) {
    return res.status(400).json({ message: 'conversacion_id, remitente_id y contenido son requeridos' })
  }

  db.query(
    'INSERT INTO mensajes (conversacion_id, remitente_id, contenido) VALUES (?, ?, ?)',
    [conversacion_id, remitente_id, contenido.trim()],
    (err, result) => {
      if (err) {
        console.error('Error enviando mensaje:', err)
        return res.status(500).json(err)
      }

      db.query(
        'UPDATE conversaciones SET actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
        [conversacion_id]
      )

      res.status(201).json({ id: result.insertId })
    }
  )
})

// PUT /api/chat/leer/:conversacionId — marcar mensajes como leidos
// Body: { usuario_id }
router.put('/leer/:conversacionId', (req, res) => {
  const { conversacionId } = req.params
  const { usuario_id } = req.body

  if (!usuario_id) {
    return res.status(400).json({ message: 'usuario_id es requerido' })
  }

  db.query(
    'UPDATE mensajes SET leido = 1 WHERE conversacion_id = ? AND remitente_id != ? AND leido = 0',
    [conversacionId, usuario_id],
    (err) => {
      if (err) {
        console.error('Error marcando mensajes como leídos:', err)
        return res.status(500).json(err)
      }
      res.json({ ok: true })
    }
  )
})

export default router
