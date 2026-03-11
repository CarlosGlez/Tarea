-- ========================================
-- SCRIPT RÁPIDO: Materias básicas para coordinador ISND
-- ========================================

-- Obtener el ID del plan de estudios de ISND
SET @plan_id = (SELECT id FROM planes_estudio WHERE nombre = 'Plan 2020' AND carrera_id = (SELECT id FROM carreras WHERE abreviatura = 'ISND'));

-- Insertar algunas materias básicas asignadas a semestres
INSERT INTO plan_materias (plan_id, materia_id, semestre) VALUES
-- Semestre 1
(@plan_id, (SELECT id FROM materias WHERE codigo = 'HUM1401'), 1), -- Ser universitario
(@plan_id, (SELECT id FROM materias WHERE codigo = 'HUM1402'), 1), -- Antropología fundamental
(@plan_id, (SELECT id FROM materias WHERE codigo = 'LDR1401'), 1), -- Liderazgo y desarrollo personal

-- Semestre 2
(@plan_id, (SELECT id FROM materias WHERE codigo = 'ADM1401'), 2), -- Introducción a la empresa
(@plan_id, (SELECT id FROM materias WHERE codigo = 'MAT6009'), 2), -- Matemáticas superiores
(@plan_id, (SELECT id FROM materias WHERE codigo = 'MER4303'), 2), -- Mercadotecnia de negocios digitales

-- Semestre 3
(@plan_id, (SELECT id FROM materias WHERE codigo = 'IIND6018'), 3), -- Ingeniería económica
(@plan_id, (SELECT id FROM materias WHERE codigo = 'MAT3402'), 3), -- Métodos numéricos
(@plan_id, (SELECT id FROM materias WHERE codigo = 'SIS4410'), 3), -- Procesamiento inteligente de datos

-- Semestre 4
(@plan_id, (SELECT id FROM materias WHERE codigo = 'IIND4409'), 4), -- Planeación estratégica
(@plan_id, (SELECT id FROM materias WHERE codigo = 'SIS4306'), 4), -- Programación de dispositivos móviles II
(@plan_id, (SELECT id FROM materias WHERE codigo = 'TCOM3302'), 4); -- Redes avanzadas

-- Verificar inserción
SELECT
    CONCAT('Semestre ', pm.semestre) as Semestre,
    m.codigo,
    m.nombre,
    m.creditos,
    m.tipo_bloque
FROM plan_materias pm
JOIN materias m ON pm.materia_id = m.id
WHERE pm.plan_id = @plan_id
ORDER BY pm.semestre, m.nombre;