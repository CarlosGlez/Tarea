import express from 'express'
import db from '../config/db.js'

const router = express.Router()

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
  
  if (!carrera_id) {
    return res.status(400).json({ message: "carrera_id es requerido" })
  }

  const query = `
    SELECT u.*, a.matricula, a.plan_id, a.estatus_academico, a.generacion, a.escuela_procedencia
    FROM usuarios u
    JOIN alumnos a ON u.id = a.id_alumno
    JOIN alumno_carrera ac ON a.id_alumno = ac.alumno_id
    WHERE ac.carrera_id = ? AND ac.activo = 1 AND u.rol = 'alumno'
    ORDER BY a.matricula
  `
  
  db.query(query, [carrera_id], (err, results) => {
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
    SELECT m.id, m.codigo, m.nombre, m.creditos, m.tipo_bloque, m.modalidad,
           pm.semestre, pm.plan_id
    FROM materias m
    JOIN plan_materias pm ON m.id = pm.materia_id
    JOIN planes_estudio p ON pm.plan_id = p.id
    WHERE p.carrera_id = ?
    ORDER BY pm.semestre, m.nombre
  `
  
  db.query(query, [carrera_id], (err, results) => {
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
    JOIN plan_materias pm ON m.id = pm.materia_id
    JOIN planes_estudio p ON pm.plan_id = p.id
    LEFT JOIN enrolamiento e ON s.id = e.seccion_id
    WHERE p.carrera_id = ?
    GROUP BY s.id
    ORDER BY m.nombre, s.seccion
  `
  
  db.query(query, [carrera_id], (err, results) => {
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
      (SELECT COUNT(*) FROM materias m
       JOIN plan_materias pm ON m.id = pm.materia_id
       JOIN planes_estudio p ON pm.plan_id = p.id
       WHERE p.carrera_id = ?) as totalMaterias,
      (SELECT COUNT(*) FROM secciones s
       JOIN materias m ON s.materia_id = m.id
       JOIN plan_materias pm ON m.id = pm.materia_id
       JOIN planes_estudio p ON pm.plan_id = p.id
       WHERE p.carrera_id = ?) as totalSecciones
  `
  
  db.query(query, [carrera_id, carrera_id, carrera_id], (err, results) => {
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
    FROM materias m
    JOIN plan_materias pm ON m.id = pm.materia_id
    JOIN planes_estudio p ON pm.plan_id = p.id
    LEFT JOIN historial_academico h ON m.id = h.materia_id
    WHERE p.carrera_id = ?
  `
  
  const params = [carrera_id]
  
  if (semestre) {
    query += ` AND pm.semestre = ?`
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

export default router
