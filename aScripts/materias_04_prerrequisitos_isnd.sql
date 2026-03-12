-- ========================================
-- MODULO MATERIAS - PRERREQUISITOS ISND
-- ========================================
-- Agrega prerrequisitos iniciales de ejemplo.
-- Ajusta este catalogo segun reglas academicas oficiales.

INSERT INTO prerrequisitos (materia_id, materia_requisito_id) VALUES
((SELECT id FROM materias WHERE codigo = 'MAT3402'), (SELECT id FROM materias WHERE codigo = 'MAT6009')),
((SELECT id FROM materias WHERE codigo = 'SIS4306'), (SELECT id FROM materias WHERE codigo = 'SIS4410')),
((SELECT id FROM materias WHERE codigo = 'TCOM3303'), (SELECT id FROM materias WHERE codigo = 'TCOM3302'))
ON DUPLICATE KEY UPDATE
    materia_requisito_id = VALUES(materia_requisito_id);

SELECT
    m.codigo AS materia,
    m.nombre AS nombre_materia,
    r.codigo AS requisito,
    r.nombre AS nombre_requisito
FROM prerrequisitos p
JOIN materias m ON m.id = p.materia_id
JOIN materias r ON r.id = p.materia_requisito_id
ORDER BY m.codigo, r.codigo;
