-- ========================================
-- MODULO MATERIAS - PLAN ISND
-- ========================================
-- Asigna materias al Plan 2020 de ISND.
-- Evita duplicados con ON DUPLICATE KEY UPDATE.

SET @plan_id = (
    SELECT pe.id
    FROM planes_estudio pe
    JOIN carreras c ON c.id = pe.carrera_id
    WHERE pe.nombre = 'Plan 2020' AND c.abreviatura = 'ISND'
    LIMIT 1
);

INSERT INTO plan_materias (plan_id, materia_id, semestre) VALUES
(@plan_id, (SELECT id FROM materias WHERE codigo = 'HUM1401'), 1),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'HUM1402'), 1),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'LDR1401'), 1),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'ADM1401'), 2),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'MAT6009'), 2),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'MER4303'), 2),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'IIND6018'), 3),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'MAT3402'), 3),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'SIS4410'), 3),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'IIND4409'), 4),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'SIS4306'), 4),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'TCOM3302'), 4)
ON DUPLICATE KEY UPDATE
    semestre = VALUES(semestre);

SELECT
    pm.semestre,
    m.codigo,
    m.nombre,
    m.creditos,
    m.tipo_bloque
FROM plan_materias pm
JOIN materias m ON m.id = pm.materia_id
WHERE pm.plan_id = @plan_id
ORDER BY pm.semestre, m.codigo;
