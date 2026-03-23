-- ========================================
-- MODULO MATERIAS - PLAN ISND (TRONCO FIJO)
-- ========================================
-- Asigna al Plan 2020 de ISND solo las materias fijas del plan.
-- Las electivas comunes y las materias de minor se cargan aparte.

SET @plan_id = (
    SELECT pe.id
    FROM planes_estudio pe
    JOIN carreras c ON c.id = pe.carrera_id
    WHERE pe.nombre = 'Plan 2020' AND c.abreviatura = 'ISND'
    LIMIT 1
);

-- Si el plan no existe, devuelve NULL y no insertara filas.
SELECT @plan_id AS plan_id_isnd;

-- Reasignacion limpia del plan fijo.
DELETE FROM plan_materias
WHERE plan_id = @plan_id;

INSERT INTO plan_materias (plan_id, materia_id, semestre) VALUES
(@plan_id, (SELECT id FROM materias WHERE codigo = 'HUM1402'), 1),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'HUM1401'), 1),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'LDR1401'), 1),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'ADM1401'), 2),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'MER4303'), 2),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'MAT6009'), 2),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'IIND6018'), 3),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'MAT3402'), 3),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'SIS4410'), 3),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'IIND4409'), 4),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'SIS4306'), 4),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'TCOM3302'), 4),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'SIS4411'), 5),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'TCOM3303'), 5),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'SIS4313'), 5),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'SIS3316'), 6),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'INT3312'), 6),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'INT4328'), 6),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'HUM1404'), 7),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'HUM1405'), 7),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'HUM1403'), 7),
(@plan_id, (SELECT id FROM materias WHERE codigo = 'LDR2401'), 7);

-- Verificacion del plan fijo ISND
SELECT
    pm.semestre,
    COUNT(*) AS total_materias
FROM plan_materias pm
WHERE pm.plan_id = @plan_id
GROUP BY pm.semestre
ORDER BY pm.semestre;

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
