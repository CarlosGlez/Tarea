-- ========================================
-- MODULO MATERIAS - HISTORIAL DEMO ALUMNO
-- ========================================
-- Carga datos iniciales de historial academico para pruebas de dashboard.
-- Requiere ejecutar antes:
-- 1) materias_01_estructura.sql
-- 2) materias_02_catalogo_isnd.sql
-- 3) materias_03_plan_isnd.sql

SET @alumno_id = (
    SELECT id_alumno
    FROM alumnos
    WHERE matricula = '2020-ISND-001'
    LIMIT 1
);

-- Si no existe el alumno por matricula, usa el usuario alumno1 como fallback.
SET @alumno_id = COALESCE(
    @alumno_id,
    (SELECT id FROM usuarios WHERE nombre_usuario = 'alumno1' LIMIT 1)
);

-- Materias aprobadas
INSERT INTO historial_academico (
    alumno_id, materia_id, calificacion, estatus, acta, fecha_examen,
    tipo_examen, tipo_curso, periodo, oportunidad
)
VALUES
(@alumno_id, (SELECT id FROM materias WHERE codigo = 'HUM1401'), 92.00, 'aprobada', 'ACTA-2024-001', '2024-12-10', 'ordinario', 'regular', 'AGO-DIC 2024', 1),
(@alumno_id, (SELECT id FROM materias WHERE codigo = 'HUM1402'), 88.50, 'aprobada', 'ACTA-2024-002', '2024-12-12', 'ordinario', 'regular', 'AGO-DIC 2024', 1),
(@alumno_id, (SELECT id FROM materias WHERE codigo = 'LDR1401'), 95.00, 'aprobada', 'ACTA-2024-003', '2024-12-14', 'ordinario', 'regular', 'AGO-DIC 2024', 1)
ON DUPLICATE KEY UPDATE
    calificacion = VALUES(calificacion),
    estatus = VALUES(estatus),
    acta = VALUES(acta),
    fecha_examen = VALUES(fecha_examen),
    tipo_examen = VALUES(tipo_examen),
    tipo_curso = VALUES(tipo_curso);

-- Materia reprobada en primera oportunidad
INSERT INTO historial_academico (
    alumno_id, materia_id, calificacion, estatus, acta, fecha_examen,
    tipo_examen, tipo_curso, periodo, oportunidad
)
VALUES
(@alumno_id, (SELECT id FROM materias WHERE codigo = 'MAT6009'), 58.00, 'no_aprobada', 'ACTA-2025-010', '2025-05-20', 'ordinario', 'regular', 'ENE-MAY 2025', 1)
ON DUPLICATE KEY UPDATE
    calificacion = VALUES(calificacion),
    estatus = VALUES(estatus),
    acta = VALUES(acta),
    fecha_examen = VALUES(fecha_examen),
    tipo_examen = VALUES(tipo_examen),
    tipo_curso = VALUES(tipo_curso);

-- Materia aprobada en segunda oportunidad
INSERT INTO historial_academico (
    alumno_id, materia_id, calificacion, estatus, acta, fecha_examen,
    tipo_examen, tipo_curso, periodo, oportunidad
)
VALUES
(@alumno_id, (SELECT id FROM materias WHERE codigo = 'MAT6009'), 79.00, 'aprobada', 'ACTA-2025-019', '2025-06-25', 'extraordinario', 'regular', 'ENE-MAY 2025', 2)
ON DUPLICATE KEY UPDATE
    calificacion = VALUES(calificacion),
    estatus = VALUES(estatus),
    acta = VALUES(acta),
    fecha_examen = VALUES(fecha_examen),
    tipo_examen = VALUES(tipo_examen),
    tipo_curso = VALUES(tipo_curso);

-- Materias en curso
INSERT INTO historial_academico (
    alumno_id, materia_id, calificacion, estatus, acta, fecha_examen,
    tipo_examen, tipo_curso, periodo, oportunidad
)
VALUES
(@alumno_id, (SELECT id FROM materias WHERE codigo = 'MER4303'), NULL, 'cursando', NULL, NULL, 'ordinario', 'regular', 'AGO-DIC 2025', 1),
(@alumno_id, (SELECT id FROM materias WHERE codigo = 'IIND6018'), NULL, 'cursando', NULL, NULL, 'ordinario', 'regular', 'AGO-DIC 2025', 1)
ON DUPLICATE KEY UPDATE
    calificacion = VALUES(calificacion),
    estatus = VALUES(estatus),
    acta = VALUES(acta),
    fecha_examen = VALUES(fecha_examen),
    tipo_examen = VALUES(tipo_examen),
    tipo_curso = VALUES(tipo_curso);

-- Vista rapida de control
SELECT
    h.id,
    h.periodo,
    h.oportunidad,
    m.codigo,
    m.nombre,
    h.estatus,
    h.calificacion,
    h.tipo_examen,
    h.fecha_examen
FROM historial_academico h
JOIN materias m ON m.id = h.materia_id
WHERE h.alumno_id = @alumno_id
ORDER BY h.periodo, m.codigo, h.oportunidad;
