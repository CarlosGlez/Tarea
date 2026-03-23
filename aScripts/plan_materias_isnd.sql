-- ========================================
-- SCRIPT: Asignar materias al Plan de Estudios ISND
-- ========================================
-- Este script deja en el plan solo las materias fijas.
-- Las electivas comunes y las materias por minor se cargan aparte.

-- Obtener el ID del plan de estudios de ISND
SET @plan_id = (SELECT id FROM planes_estudio WHERE nombre = 'Plan 2020' AND carrera_id = (SELECT id FROM carreras WHERE abreviatura = 'ISND'));

-- ========================================
-- SEMESTRE 1 - BLOQUE ANAHUAC
-- ========================================
INSERT INTO plan_materias (plan_id, materia_id, semestre) VALUES
(@plan_id, (SELECT id FROM materias WHERE codigo = 'HUM1402'), 1), -- Antropología fundamental
(@plan_id, (SELECT id FROM materias WHERE codigo = 'HUM1401'), 1), -- Ser universitario
(@plan_id, (SELECT id FROM materias WHERE codigo = 'LDR1401'), 1); -- Liderazgo y desarrollo personal

-- ========================================
-- SEMESTRE 2 - BLOQUE PROFESIONAL
-- ========================================
INSERT INTO plan_materias (plan_id, materia_id, semestre) VALUES
(@plan_id, (SELECT id FROM materias WHERE codigo = 'ADM1401'), 2), -- Introducción a la empresa
(@plan_id, (SELECT id FROM materias WHERE codigo = 'MER4303'), 2), -- Mercadotecnia de negocios digitales
(@plan_id, (SELECT id FROM materias WHERE codigo = 'MAT6009'), 2); -- Matemáticas superiores

-- ========================================
-- SEMESTRE 3 - BLOQUE PROFESIONAL
-- ========================================
INSERT INTO plan_materias (plan_id, materia_id, semestre) VALUES
(@plan_id, (SELECT id FROM materias WHERE codigo = 'IIND6018'), 3), -- Ingeniería económica
(@plan_id, (SELECT id FROM materias WHERE codigo = 'MAT3402'), 3), -- Métodos numéricos
(@plan_id, (SELECT id FROM materias WHERE codigo = 'SIS4410'), 3); -- Procesamiento inteligente de datos

-- ========================================
-- SEMESTRE 4 - BLOQUE PROFESIONAL
-- ========================================
INSERT INTO plan_materias (plan_id, materia_id, semestre) VALUES
(@plan_id, (SELECT id FROM materias WHERE codigo = 'IIND4409'), 4), -- Planeación estratégica
(@plan_id, (SELECT id FROM materias WHERE codigo = 'SIS4306'), 4), -- Programación de dispositivos móviles II
(@plan_id, (SELECT id FROM materias WHERE codigo = 'TCOM3302'), 4); -- Redes avanzadas

-- ========================================
-- SEMESTRE 5 - BLOQUE PROFESIONAL
-- ========================================
INSERT INTO plan_materias (plan_id, materia_id, semestre) VALUES
(@plan_id, (SELECT id FROM materias WHERE codigo = 'SIS4411'), 5), -- Realidad virtual y augmented
(@plan_id, (SELECT id FROM materias WHERE codigo = 'TCOM3303'), 5), -- Seguridad informática y redes forenses
(@plan_id, (SELECT id FROM materias WHERE codigo = 'SIS4313'), 5); -- Sistemas operativos II

-- ========================================
-- SEMESTRE 6 - BLOQUE PROFESIONAL
-- ========================================
INSERT INTO plan_materias (plan_id, materia_id, semestre) VALUES
(@plan_id, (SELECT id FROM materias WHERE codigo = 'SIS3316'), 6), -- Tratamiento estadístico de la información
(@plan_id, (SELECT id FROM materias WHERE codigo = 'INT3312'), 6), -- Practicum de sistemas I
(@plan_id, (SELECT id FROM materias WHERE codigo = 'INT4328'), 6); -- Practicum de sistemas II

-- ========================================
-- SEMESTRE 7 - BLOQUE ANAHUAC
-- ========================================
INSERT INTO plan_materias (plan_id, materia_id, semestre) VALUES
(@plan_id, (SELECT id FROM materias WHERE codigo = 'HUM1404'), 7), -- Ética
(@plan_id, (SELECT id FROM materias WHERE codigo = 'HUM1405'), 7), -- Humanismo clásico y contemporáneo
(@plan_id, (SELECT id FROM materias WHERE codigo = 'HUM1403'), 7); -- Persona y trascendencia

-- ========================================
-- VERIFICACIÓN
-- ========================================
-- Verificar que las asignaciones se hicieron correctamente
SELECT
    pm.semestre,
    m.codigo,
    m.nombre,
    m.creditos,
    m.tipo_bloque
FROM plan_materias pm
JOIN materias m ON pm.materia_id = m.id
JOIN planes_estudio p ON pm.plan_id = p.id
WHERE p.nombre = 'Plan 2020'
ORDER BY pm.semestre, m.nombre;