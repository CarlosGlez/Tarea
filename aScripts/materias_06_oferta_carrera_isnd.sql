-- ========================================
-- MODULO MATERIAS - OFERTA ACADEMICA ISND
-- ========================================
-- Separa la oferta academica disponible para ISND del plan fijo.
-- 1) carrera_materias guarda materias disponibles para la carrera.
-- 2) minor_materias guarda materias disponibles por minor.

SET @carrera_id = (
    SELECT id
    FROM carreras
    WHERE abreviatura = 'ISND'
    LIMIT 1
);

INSERT INTO minors (clave, nombre, descripcion)
SELECT 'MINOR_NEGOCIOS', 'Minor de Negocios', 'Oferta profesional electiva enfocada en gestion, mercadotecnia y finanzas.'
WHERE NOT EXISTS (
    SELECT 1 FROM minors WHERE clave = 'MINOR_NEGOCIOS'
);

INSERT INTO minors (clave, nombre, descripcion)
SELECT 'MINOR_IDIOMAS', 'Minor de Idiomas', 'Oferta profesional electiva enfocada en lenguas y contexto internacional.'
WHERE NOT EXISTS (
    SELECT 1 FROM minors WHERE clave = 'MINOR_IDIOMAS'
);

SET @minor_negocios_id = (SELECT id FROM minors WHERE clave = 'MINOR_NEGOCIOS' LIMIT 1);
SET @minor_idiomas_id = (SELECT id FROM minors WHERE clave = 'MINOR_IDIOMAS' LIMIT 1);

DELETE FROM carrera_materias
WHERE carrera_id = @carrera_id;

DELETE mm
FROM minor_materias mm
JOIN carrera_minors cmn ON cmn.minor_id = mm.minor_id
WHERE cmn.carrera_id = @carrera_id;

DELETE FROM carrera_minors
WHERE carrera_id = @carrera_id;

INSERT INTO carrera_materias (carrera_id, materia_id, semestre_sugerido, obligatoria_en_plan, disponible)
SELECT
    @carrera_id,
    m.id,
    CASE
        WHEN m.codigo IN ('HUM1401', 'HUM1402', 'LDR1401') THEN 1
        WHEN m.codigo IN ('ADM1401', 'MER4303', 'MAT6009') THEN 2
        WHEN m.codigo IN ('IIND6018', 'MAT3402', 'SIS4410') THEN 3
        WHEN m.codigo IN ('IIND4409', 'SIS4306', 'TCOM3302') THEN 4
        WHEN m.codigo IN ('SIS4411', 'TCOM3303', 'SIS4313') THEN 5
        WHEN m.codigo IN ('SIS3316', 'INT3312', 'INT4328') THEN 6
        WHEN m.codigo IN ('HUM1404', 'HUM1405', 'HUM1403', 'LDR2401') THEN 7
        WHEN m.tipo_bloque = 'anahuac_electivo' THEN 8
        WHEN m.tipo_bloque = 'interdisciplinario' THEN 8
        WHEN m.tipo_bloque = 'interdisciplinario_electivo' THEN 10
        ELSE NULL
    END AS semestre_sugerido,
    CASE
        WHEN m.tipo_bloque IN ('anahuac', 'profesional') THEN 1
        ELSE 0
    END AS obligatoria_en_plan,
    1 AS disponible
FROM materias m
WHERE m.tipo_bloque IN (
    'anahuac',
    'profesional',
    'anahuac_electivo',
    'interdisciplinario',
    'interdisciplinario_electivo'
)
AND @carrera_id IS NOT NULL;

INSERT INTO carrera_minors (carrera_id, minor_id, activo) VALUES
(@carrera_id, @minor_negocios_id, 1),
(@carrera_id, @minor_idiomas_id, 1);

INSERT INTO minor_materias (minor_id, materia_id, semestre_sugerido)
SELECT @minor_negocios_id, m.id, 9
FROM materias m
WHERE m.codigo IN (
    'FIN2404', 'ADM3403', 'MER1403', 'ADM3401', 'GAS1001',
    'MER3406', 'FIN3402', 'MER1404', 'FIN1403', 'FIN3412',
    'FIN3404', 'FIN1402', 'MER1401', 'TUR1001', 'MER1402',
    'NEI1401', 'NEI2403'
);

INSERT INTO minor_materias (minor_id, materia_id, semestre_sugerido)
SELECT @minor_idiomas_id, m.id, 9
FROM materias m
WHERE m.codigo IN (
    'NEI2402', 'IDI6010', 'IDI6008', 'IDI2220', 'IDI2221',
    'IDI2222', 'IDI6009', 'IDI2223', 'IDI2224', 'IDI2225',
    'IDI6006'
);

SELECT
    c.abreviatura,
    COUNT(*) AS materias_directas,
    SUM(CASE WHEN cm.obligatoria_en_plan = 1 THEN 1 ELSE 0 END) AS materias_plan_fijo,
    SUM(CASE WHEN cm.obligatoria_en_plan = 0 THEN 1 ELSE 0 END) AS materias_electivas_comunes
FROM carrera_materias cm
JOIN carreras c ON c.id = cm.carrera_id
WHERE cm.carrera_id = @carrera_id
GROUP BY c.abreviatura;

SELECT
    mn.nombre AS minor,
    COUNT(mm.materia_id) AS materias_minor
FROM carrera_minors cmn
JOIN minors mn ON mn.id = cmn.minor_id
LEFT JOIN minor_materias mm ON mm.minor_id = mn.id
WHERE cmn.carrera_id = @carrera_id
GROUP BY mn.id, mn.nombre
ORDER BY mn.nombre;