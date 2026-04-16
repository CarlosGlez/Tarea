import express from 'express'
import db from '../config/db.js'

const router = express.Router()

const estatusAcademicosValidos = new Set(['aprobada', 'no_aprobada', 'no_cursada', 'revalidar', 'cursando'])
const estatusConCalificacion = new Set(['aprobada', 'no_aprobada', 'revalidar'])

const ofertaMateriasPorCarrera = `
  SELECT cm.materia_id, cm.semestre_sugerido
  FROM carrera_materias cm
  WHERE cm.carrera_id = ? AND cm.disponible = 1

  UNION

  SELECT mm.materia_id, mm.semestre_sugerido
  FROM carrera_minors cmn
  JOIN minor_materias mm ON mm.minor_id = cmn.minor_id
  WHERE cmn.carrera_id = ? AND cmn.activo = 1
`

// ========================================
// ENDPOINTS DEL COORDINADOR
// ========================================

// GET /api/coordinador/info - Obtener información completa del coordinador
router.get('/info', (req, res) => {
  const { coordinador_id } = req.query
  
  if (!coordinador_id) {
    return res.status(400).json({ message: "coordinador_id es requerido" })
  }

  const query = `
    SELECT 
      u.id,
      u.nombre_usuario,
      u.correo,
      u.rol,
      cc.carrera_id,
      c.nombre as carrera_nombre,
      c.abreviatura as carrera_abreviatura,
      cc.rol_cargo,
      co.telefono,
      co.oficina,
      co.horario_atencion
    FROM usuarios u
    LEFT JOIN coordinador_carrera cc ON u.id = cc.coordinador_id AND cc.activo = 1
    LEFT JOIN carreras c ON cc.carrera_id = c.id
    LEFT JOIN coordinadores co ON u.id = co.id_coordinador
    WHERE u.id = ? AND u.rol = 'coordinador'
  `
  
  db.query(query, [coordinador_id], (err, results) => {
    if (err) {
      console.error('Error en GET /api/coordinador/info:', err)
      return res.status(500).json(err)
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Coordinador no encontrado" })
    }
    
    res.json(results[0])
  })
})

// GET /api/coordinador/alumnos - Obtener alumnos de la carrera del coordinador
router.get('/alumnos', (req, res) => {
  const { carrera_id } = req.query

  let query = `
    SELECT u.*, a.matricula, a.plan_id, a.estatus_academico, a.generacion, a.escuela_procedencia, ac.carrera_id
    FROM usuarios u
    JOIN alumnos a ON u.id = a.id_alumno
    JOIN alumno_carrera ac ON a.id_alumno = ac.alumno_id
    WHERE ac.activo = 1 AND u.rol = 'alumno'
    ORDER BY a.matricula
  `

  const params = []

  if (carrera_id) {
    query = `
      SELECT u.*, a.matricula, a.plan_id, a.estatus_academico, a.generacion, a.escuela_procedencia, ac.carrera_id
      FROM usuarios u
      JOIN alumnos a ON u.id = a.id_alumno
      JOIN alumno_carrera ac ON a.id_alumno = ac.alumno_id
      WHERE ac.carrera_id = ? AND ac.activo = 1 AND u.rol = 'alumno'
      ORDER BY a.matricula
    `
    params.push(carrera_id)
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error en GET /api/coordinador/alumnos:', err)
      return res.status(500).json(err)
    }
    res.json(results)
  })
})

// GET /api/coordinador/materias - Obtener materias de la carrera del coordinador
router.get('/materias', (req, res) => {
  const { carrera_id } = req.query
  
  if (!carrera_id) {
    return res.status(400).json({ message: "carrera_id es requerido" })
  }

  const query = `
    SELECT *
    FROM (
      SELECT m.id, m.codigo, m.nombre, m.creditos, m.tipo_bloque, m.modalidad,
             cm.semestre_sugerido AS semestre,
             CASE WHEN cm.obligatoria_en_plan = 1 THEN 'plan_fijo' ELSE 'oferta_carrera' END AS origen_oferta,
             cm.obligatoria_en_plan,
             NULL AS minor_nombre
      FROM carrera_materias cm
      JOIN materias m ON m.id = cm.materia_id
      WHERE cm.carrera_id = ? AND cm.disponible = 1

      UNION ALL

      SELECT m.id, m.codigo, m.nombre, m.creditos, m.tipo_bloque, m.modalidad,
             mm.semestre_sugerido AS semestre,
             'minor' AS origen_oferta,
             0 AS obligatoria_en_plan,
             mn.nombre AS minor_nombre
      FROM carrera_minors cmn
      JOIN minors mn ON mn.id = cmn.minor_id
      JOIN minor_materias mm ON mm.minor_id = mn.id
      JOIN materias m ON m.id = mm.materia_id
      WHERE cmn.carrera_id = ? AND cmn.activo = 1
    ) oferta
    ORDER BY
      CASE WHEN semestre IS NULL THEN 999 ELSE semestre END,
      origen_oferta,
      nombre
  `
  
  db.query(query, [carrera_id, carrera_id], (err, results) => {
    if (err) {
      console.error('Error en GET /api/coordinador/materias:', err)
      return res.status(500).json(err)
    }
    res.json(results)
  })
})

// GET /api/coordinador/horarios - Obtener horarios y secciones de la carrera
router.get('/horarios', (req, res) => {
  const { carrera_id } = req.query
  
  if (!carrera_id) {
    return res.status(400).json({ message: "carrera_id es requerido" })
  }

  // Nota: Esta tabla no existe aún en el schema, se debería crear
  const query = `
    SELECT s.id, m.nombre as materia_nombre, m.codigo, s.seccion, u.nombre_usuario as profesor_nombre,
           s.hora_inicio, s.hora_fin, s.aula, s.dias_clase, COUNT(DISTINCT e.alumno_id) as estudiantes
    FROM secciones s
    JOIN materias m ON s.materia_id = m.id
    JOIN usuarios u ON s.profesor_id = u.id
    LEFT JOIN enrolamiento e ON s.id = e.seccion_id
    WHERE EXISTS (
      SELECT 1
      FROM carrera_materias cm
      WHERE cm.carrera_id = ? AND cm.disponible = 1 AND cm.materia_id = m.id
    ) OR EXISTS (
      SELECT 1
      FROM carrera_minors cmn
      JOIN minor_materias mm ON mm.minor_id = cmn.minor_id
      WHERE cmn.carrera_id = ? AND cmn.activo = 1 AND mm.materia_id = m.id
    )
    GROUP BY s.id
    ORDER BY m.nombre, s.seccion
  `
  
  db.query(query, [carrera_id, carrera_id], (err, results) => {
    if (err) {
      console.error('Error en GET /api/coordinador/horarios:', err)
      // Si la tabla no existe, devolver array vacío
      if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.json([])
      }
      return res.status(500).json(err)
    }
    res.json(results)
  })
})

// GET /api/coordinador/estadisticas - Obtener estadísticas de la carrera
router.get('/estadisticas', (req, res) => {
  const { carrera_id } = req.query
  
  if (!carrera_id) {
    return res.status(400).json({ message: "carrera_id es requerido" })
  }

  const query = `
    SELECT 
      (SELECT COUNT(DISTINCT a.id_alumno) FROM alumnos a
       JOIN alumno_carrera ac ON a.id_alumno = ac.alumno_id
       WHERE ac.carrera_id = ? AND ac.activo = 1 AND a.estatus_academico = 'inscrito') as totalAlumnos,
      (SELECT COUNT(DISTINCT oferta.materia_id)
       FROM (${ofertaMateriasPorCarrera}) oferta) as totalMaterias,
      (SELECT COUNT(DISTINCT s.id)
       FROM secciones s
       JOIN (${ofertaMateriasPorCarrera}) oferta ON oferta.materia_id = s.materia_id) as totalSecciones
  `
  
  db.query(query, [carrera_id, carrera_id, carrera_id, carrera_id, carrera_id], (err, results) => {
    if (err) {
      console.error('Error en GET /api/coordinador/estadisticas:', err)
      return res.status(500).json(err)
    }
    
    if (results.length > 0) {
      return res.json(results[0])
    }
    
    res.json({
      totalAlumnos: 0,
      totalMaterias: 0,
      totalSecciones: 0
    })
  })
})

// GET /api/coordinador/reportes/inscripciones - Reporte de inscripciones
router.get('/reportes/inscripciones', (req, res) => {
  const { carrera_id, semestre, periodo } = req.query
  
  if (!carrera_id) {
    return res.status(400).json({ message: "carrera_id es requerido" })
  }

  let query = `
    SELECT 
      a.matricula,
      u.nombre_usuario,
      u.correo,
      a.generacion,
      COUNT(pm.materia_id) as materias_inscritas,
      a.fecha_creacion
    FROM alumnos a
    JOIN usuarios u ON a.id_alumno = u.id
    JOIN alumno_carrera ac ON a.id_alumno = ac.alumno_id
    LEFT JOIN plan_materias pm ON a.plan_id = pm.plan_id
    WHERE ac.carrera_id = ? AND ac.activo = 1 AND a.estatus_academico = 'inscrito'
  `
  
  const params = [carrera_id]
  
  if (semestre) {
    query += ` AND pm.semestre = ?`
    params.push(semestre)
  }
  
  query += ` GROUP BY a.id_alumno ORDER BY a.matricula`
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error en reporte de inscripciones:', err)
      return res.status(500).json(err)
    }
    res.json(results)
  })
})

// GET /api/coordinador/reportes/rendimiento - Reporte de rendimiento académico
router.get('/reportes/rendimiento', (req, res) => {
  const { carrera_id, semestre } = req.query
  
  if (!carrera_id) {
    return res.status(400).json({ message: "carrera_id es requerido" })
  }

  let query = `
    SELECT 
      u.nombre_usuario,
      a.matricula,
      COUNT(h.materia_id) as materias_cursadas,
      SUM(CASE WHEN h.estatus = 'aprobada' THEN 1 ELSE 0 END) as materias_aprobadas,
      AVG(CASE WHEN h.estatus = 'aprobada' THEN h.calificacion ELSE NULL END) as promedio,
      a.estatus_academico
    FROM alumnos a
    JOIN usuarios u ON a.id_alumno = u.id
    JOIN alumno_carrera ac ON a.id_alumno = ac.alumno_id
    LEFT JOIN historial_academico h ON a.id_alumno = h.alumno_id
    WHERE ac.carrera_id = ? AND ac.activo = 1
  `
  
  const params = [carrera_id]
  
  if (semestre) {
    query += ` AND h.periodo LIKE ?`
    params.push(`%SEMESTRE ${semestre}%`)
  }
  
  query += ` GROUP BY a.id_alumno ORDER BY promedio DESC`
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error en reporte de rendimiento:', err)
      return res.status(500).json(err)
    }
    res.json(results)
  })
})

// GET /api/coordinador/reportes/desercion - Reporte de deserción
router.get('/reportes/desercion', (req, res) => {
  const { carrera_id } = req.query
  
  if (!carrera_id) {
    return res.status(400).json({ message: "carrera_id es requerido" })
  }

  const query = `
    SELECT 
      COUNT(*) as total_desertores,
      COUNT(CASE WHEN YEAR(NOW()) - YEAR(a.fecha_creacion) <= 1 THEN 1 END) as desertores_recientes,
      COUNT(CASE WHEN a.generacion IS NOT NULL THEN 1 END) as desertores_por_generacion
    FROM alumnos a
    JOIN alumno_carrera ac ON a.id_alumno = ac.alumno_id
    WHERE ac.carrera_id = ? AND ac.activo = 1 AND a.estatus_academico = 'baja'
  `
  
  db.query(query, [carrera_id], (err, results) => {
    if (err) {
      console.error('Error en reporte de deserción:', err)
      return res.status(500).json(err)
    }
    
    if (results.length > 0) {
      return res.json(results[0])
    }
    
    res.json({
      total_desertores: 0,
      desertores_recientes: 0,
      desertores_por_generacion: 0
    })
  })
})

// GET /api/coordinador/reportes/aprobacion - Reporte de tasas de aprobación
router.get('/reportes/aprobacion', (req, res) => {
  const { carrera_id, semestre } = req.query
  
  if (!carrera_id) {
    return res.status(400).json({ message: "carrera_id es requerido" })
  }

  let query = `
    SELECT 
      m.codigo,
      m.nombre,
      COUNT(DISTINCT h.alumno_id) as estudiantes_totales,
      SUM(CASE WHEN h.estatus = 'aprobada' THEN 1 ELSE 0 END) as estudiantes_aprobados,
      ROUND((SUM(CASE WHEN h.estatus = 'aprobada' THEN 1 ELSE 0 END) / COUNT(DISTINCT h.alumno_id) * 100), 2) as tasa_aprobacion
    FROM (${ofertaMateriasPorCarrera}) oferta
    JOIN materias m ON m.id = oferta.materia_id
    LEFT JOIN historial_academico h ON m.id = h.materia_id
    WHERE 1 = 1
  `
  
  const params = [carrera_id, carrera_id]
  
  if (semestre) {
    query += ` AND oferta.semestre_sugerido = ?`
    params.push(semestre)
  }
  
  query += ` GROUP BY m.id ORDER BY tasa_aprobacion ASC`
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error en reporte de aprobación:', err)
      return res.status(500).json(err)
    }
    res.json(results)
  })
})

// PUT /api/coordinador/alumnos/:alumnoId/materias/:materiaId
// Actualiza estatus/calificación de una materia para un alumno de la carrera del coordinador.
router.put('/alumnos/:alumnoId/materias/:materiaId', (req, res) => {
  const { alumnoId, materiaId } = req.params
  const { carrera_id, estatus, calificacion, periodo } = req.body

  if (!carrera_id) {
    return res.status(400).json({ message: 'carrera_id es requerido' })
  }

  if (!estatus || !estatusAcademicosValidos.has(estatus)) {
    return res.status(400).json({ message: 'estatus invalido' })
  }

  const requiereCalificacion = estatusConCalificacion.has(estatus)
  const calificacionNumerica = calificacion === null || calificacion === undefined || calificacion === ''
    ? null
    : Number(calificacion)

  if (requiereCalificacion && (calificacionNumerica === null || Number.isNaN(calificacionNumerica))) {
    return res.status(400).json({ message: 'calificacion es requerida para este estatus' })
  }

  if (calificacionNumerica !== null && (Number.isNaN(calificacionNumerica) || calificacionNumerica < 0 || calificacionNumerica > 100)) {
    return res.status(400).json({ message: 'calificacion debe estar entre 0 y 100' })
  }

  const calificacionFinal = requiereCalificacion ? calificacionNumerica : null
  const periodoFinal = estatus === 'no_cursada' ? null : (periodo || null)

  const accesoQuery = `
    SELECT a.id_alumno
    FROM alumnos a
    JOIN alumno_carrera ac ON ac.alumno_id = a.id_alumno AND ac.activo = 1
    JOIN plan_materias pm ON pm.plan_id = a.plan_id
    WHERE a.id_alumno = ? AND ac.carrera_id = ? AND pm.materia_id = ?
    LIMIT 1
  `

  db.query(accesoQuery, [alumnoId, carrera_id, materiaId], (accesoErr, accesoRows) => {
    if (accesoErr) {
      console.error('Error validando acceso en actualización de materia:', accesoErr)
      return res.status(500).json(accesoErr)
    }

    if (!accesoRows || accesoRows.length === 0) {
      return res.status(404).json({ message: 'Alumno o materia no valida para esta carrera' })
    }

    db.query(
      `SELECT id FROM historial_academico WHERE alumno_id = ? AND materia_id = ? ORDER BY id DESC LIMIT 1`,
      [alumnoId, materiaId],
      (historialErr, historialRows) => {
        if (historialErr) {
          console.error('Error consultando historial academico:', historialErr)
          return res.status(500).json(historialErr)
        }

        if (historialRows.length > 0) {
          const historialId = historialRows[0].id
          db.query(
            `UPDATE historial_academico
             SET estatus = ?, calificacion = ?, periodo = ?
             WHERE id = ?`,
            [estatus, calificacionFinal, periodoFinal, historialId],
            (updateErr) => {
              if (updateErr) {
                console.error('Error actualizando historial academico:', updateErr)
                return res.status(500).json(updateErr)
              }
              return res.json({ message: 'Avance de materia actualizado' })
            }
          )
          return
        }

        db.query(
          `INSERT INTO historial_academico (alumno_id, materia_id, calificacion, estatus, periodo)
           VALUES (?, ?, ?, ?, ?)`,
          [alumnoId, materiaId, calificacionFinal, estatus, periodoFinal],
          (insertErr) => {
            if (insertErr) {
              console.error('Error insertando historial academico:', insertErr)
              return res.status(500).json(insertErr)
            }
            return res.json({ message: 'Avance de materia actualizado' })
          }
        )
      }
    )
  })
})

export default router
