-- ========================================
-- MODULO MATERIAS - CATALOGO ISND
-- ========================================
-- Inserta catalogo de materias con upsert por codigo.

INSERT INTO materias (codigo, nombre, creditos, tipo_bloque, modalidad) VALUES
('HUM1402', 'Antropologia fundamental', 6, 'anahuac', 'presencial'),
('HUM1404', 'Etica', 9, 'anahuac', 'presencial'),
('HUM1405', 'Humanismo clasico y contemporaneo', 6, 'anahuac', 'presencial'),
('LDR1401', 'Liderazgo y desarrollo personal', 6, 'anahuac', 'presencial'),
('LDR2401', 'Liderazgo y equipos de alto desempeno', 3, 'anahuac', 'presencial'),
('HUM1403', 'Persona y trascendencia', 6, 'anahuac', 'presencial'),
('HUM1401', 'Ser universitario', 6, 'anahuac', 'presencial'),
('IIND6018', 'Ingenieria economica', 6, 'profesional', 'presencial'),
('ADM1401', 'Introduccion a la empresa', 6, 'profesional', 'presencial'),
('MAT6009', 'Matematicas superiores', 10, 'profesional', 'presencial'),
('MER4303', 'Mercadotecnia de negocios digitales', 6, 'profesional', 'presencial'),
('MAT3402', 'Metodos numericos', 6, 'profesional', 'presencial'),
('IIND4409', 'Planeacion estrategica', 6, 'profesional', 'presencial'),
('INT3312', 'Practicum de sistemas I: ingenieria de proyectos', 9, 'profesional', 'presencial'),
('INT4328', 'Practicum de sistemas II: administracion de proyectos', 9, 'profesional', 'presencial'),
('SIS4410', 'Procesamiento inteligente de datos', 7, 'profesional', 'presencial'),
('SIS4306', 'Programacion de dispositivos moviles II', 6, 'profesional', 'presencial'),
('SIS4411', 'Realidad virtual y augmented', 6, 'profesional', 'presencial'),
('TCOM3302', 'Redes avanzadas', 7, 'profesional', 'presencial'),
('TCOM3303', 'Seguridad informatica y redes forenses', 6, 'profesional', 'presencial'),
('SIS4313', 'Sistemas operativos II', 6, 'profesional', 'presencial'),
('SIS3316', 'Tratamiento estadistico de la informacion', 6, 'profesional', 'presencial'),
('FIN2404', 'Administracion financiera', 6, 'profesional_electivo', 'presencial'),
('ADM3403', 'Comportamiento organizacional', 6, 'profesional_electivo', 'presencial'),
('MER1403', 'Conducta del consumidor', 6, 'profesional_electivo', 'presencial'),
('SIS1407', 'Temas de vanguardia en TI', 6, 'profesional_electivo', 'presencial'),
('SIS1408', 'Temas de vanguardia en tecnologias de sistemas', 6, 'profesional_electivo', 'presencial'),
('ELDR2401', 'Administracion de proyectos de responsabilidad social', 6, 'anahuac_electivo', 'presencial'),
('ECUG1414', 'La persona frente a la crisis ecologica', 6, 'anahuac_electivo', 'presencial'),
('ELDR1405', 'Pensamiento critico y creativo', 6, 'anahuac_electivo', 'presencial'),
('EGA1005', 'Taller de arte y cultura II', 3, 'interdisciplinario_electivo', 'presencial'),
('EGA1104', 'Taller de deportes I', 3, 'interdisciplinario_electivo', 'presencial'),
('EGA1106', 'Taller de deportes III', 3, 'interdisciplinario_electivo', 'presencial'),
('ISOC1406', 'Temas selectos interdisciplinarios I', 6, 'interdisciplinario_electivo', 'presencial')
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    creditos = VALUES(creditos),
    tipo_bloque = VALUES(tipo_bloque),
    modalidad = VALUES(modalidad);
