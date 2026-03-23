-- ========================================
-- MODULO MATERIAS - CATALOGO ISND (COMPLETO)
-- ========================================
-- Este script:
-- 1) Limpia relaciones dependientes de materias
-- 2) Vacia la tabla materias sin eliminarla
-- 3) Inserta el catalogo completo ISND

START TRANSACTION;

SET FOREIGN_KEY_CHECKS = 0;

-- Limpiar tablas que dependen de materias
DELETE FROM enrolamiento;
DELETE FROM secciones;
DELETE FROM historial_academico;
DELETE FROM prerrequisitos;
DELETE FROM plan_materias;

-- Vaciar materias sin eliminar la tabla
DELETE FROM materias;
ALTER TABLE materias AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- BLOQUE ANAHUAC
-- ========================================
INSERT INTO materias (codigo, nombre, creditos, tipo_bloque, modalidad) VALUES
('HUM1402', 'Antropologia fundamental', 6, 'anahuac', 'presencial'),
('HUM1404', 'Etica', 9, 'anahuac', 'presencial'),
('HUM1405', 'Humanismo clasico y contemporaneo', 6, 'anahuac', 'presencial'),
('LDR1401', 'Liderazgo y desarrollo personal', 6, 'anahuac', 'presencial'),
('LDR2401', 'Liderazgo y equipos de alto desempeno', 3, 'anahuac', 'presencial'),
('HUM1403', 'Persona y trascendencia', 6, 'anahuac', 'presencial'),
('HUM1401', 'Ser universitario', 6, 'anahuac', 'presencial');

-- ========================================
-- BLOQUE PROFESIONAL
-- ========================================
INSERT INTO materias (codigo, nombre, creditos, tipo_bloque, modalidad) VALUES
('SIS3302', 'Administracion de proyectos de software', 6, 'profesional', 'presencial'),
('MAT1404', 'Algebra lineal', 7, 'profesional', 'presencial'),
('SIS1401', 'Algoritmos y programacion', 6, 'profesional', 'presencial'),
('SIS4309', 'Aprendizaje maquina', 6, 'profesional', 'presencial'),
('SIS2403', 'Bases de datos', 7, 'profesional', 'presencial'),
('SIS2404', 'Bases de datos avanzadas', 6, 'profesional', 'presencial'),
('MAT1402', 'Calculo diferencial', 6, 'profesional', 'presencial'),
('MAT1403', 'Calculo integral', 6, 'profesional', 'presencial'),
('SIS4402', 'Calidad de software', 6, 'profesional', 'presencial'),
('CON2402', 'Contabilidad y costos para ingenieria', 7, 'profesional', 'presencial'),
('SIS3307', 'Desarrollo de aplicaciones web I', 6, 'profesional', 'presencial'),
('SIS6004', 'Desarrollo de aplicaciones web II', 6, 'profesional', 'presencial'),
('SIS3411', 'Desarrollo de software', 6, 'profesional', 'presencial'),
('SIS3405', 'Estructuras de datos', 6, 'profesional', 'presencial'),
('ADM1300', 'Gestion de negocios digitales', 6, 'profesional', 'presencial'),
('SIS3404', 'Implementacion de sistemas integrados', 6, 'profesional', 'presencial'),
('SIS4404', 'Infraestructura y computo en la nube', 6, 'profesional', 'presencial'),
('SIS3406', 'Ingenieria de software', 6, 'profesional', 'presencial'),
('IIND6018', 'Ingenieria economica', 6, 'profesional', 'presencial'),
('SIS4401', 'Inteligencia artificial', 6, 'profesional', 'presencial'),
('SIS3409', 'Inteligencia de negocios y analitica de datos', 7, 'profesional', 'presencial'),
('ADM1401', 'Introduccion a la empresa', 6, 'profesional', 'presencial'),
('SIS1300', 'Introduccion a los Sistemas y Negocios Digitales', 6, 'profesional', 'presencial'),
('SIS4407', 'Legislacion informatica', 6, 'profesional', 'presencial');

INSERT INTO materias (codigo, nombre, creditos, tipo_bloque, modalidad) VALUES
('SIS1402', 'Lenguajes orientados a objetos', 6, 'profesional', 'presencial'),
('MAT1415', 'Matematicas para computacion', 6, 'profesional', 'presencial'),
('MAT6009', 'Matematicas superiores', 10, 'profesional', 'presencial'),
('MER4303', 'Mercadotecnia de negocios digitales', 6, 'profesional', 'presencial'),
('MAT3402', 'Metodos numericos', 6, 'profesional', 'presencial'),
('IIND4409', 'Planeacion estrategica', 6, 'profesional', 'presencial'),
('INT3312', 'Practicum de sistemas I: ingenieria de proyectos', 9, 'profesional', 'presencial'),
('INT4328', 'Practicum de sistemas II: administracion de proyectos', 9, 'profesional', 'presencial'),
('MAT2403', 'Probabilidad y estadistica', 6, 'profesional', 'presencial'),
('SIS4410', 'Procesamiento inteligente de datos', 7, 'profesional', 'presencial'),
('SIS4305', 'Programacion de dispositivos moviles I', 6, 'profesional', 'presencial'),
('SIS4306', 'Programacion de dispositivos moviles II', 6, 'profesional', 'presencial'),
('SIS4411', 'Realidad virtual y aumentada', 6, 'profesional', 'presencial'),
('TCOM3302', 'Redes avanzadas', 7, 'profesional', 'presencial'),
('TCOM2301', 'Redes de computadoras', 7, 'profesional', 'presencial'),
('TCOM3303', 'Seguridad informatica y redes forenses', 6, 'profesional', 'presencial'),
('SIS3401', 'Sistemas operativos I', 7, 'profesional', 'presencial'),
('SIS4313', 'Sistemas operativos II', 6, 'profesional', 'presencial'),
('SIS3316', 'Tratamiento estadistico de la informacion', 6, 'profesional', 'presencial');

-- ========================================
-- BLOQUE PROFESIONAL ELECTIVO
-- ========================================
INSERT INTO materias (codigo, nombre, creditos, tipo_bloque, modalidad) VALUES
('FIN2404', 'Administracion financiera', 6, 'profesional_electivo', 'presencial'),
('NEI2402', 'Analisis geografico de los aspectos internacionales', 6, 'profesional_electivo', 'presencial'),
('NEI2403', 'Aspectos practicos del comercio internacional', 6, 'profesional_electivo', 'presencial'),
('ADM3403', 'Comportamiento organizacional', 6, 'profesional_electivo', 'presencial'),
('MER1403', 'Conducta del consumidor', 6, 'profesional_electivo', 'presencial'),
('ADM3401', 'Direccion de capital humano', 6, 'profesional_electivo', 'presencial'),
('GAS1001', 'El vino en los negocios', 6, 'profesional_electivo', 'presencial'),
('MER3406', 'Estrategias digitales I', 6, 'profesional_electivo', 'presencial'),
('FIN3402', 'Evaluacion de proyectos de inversion', 6, 'profesional_electivo', 'presencial'),
('IDI6010', 'Expresion oral y escrita en aleman', 6, 'profesional_electivo', 'presencial'),
('IDI6008', 'Expresion oral y escrita en frances', 6, 'profesional_electivo', 'presencial'),
('MER1006', 'Fashion marketing', 6, 'profesional_electivo', 'presencial'),
('MER1404', 'Investigacion de mercados cualitativa', 6, 'profesional_electivo', 'presencial'),
('IDI2220', 'Lengua alemana I', 6, 'profesional_electivo', 'presencial'),
('IDI2221', 'Lengua alemana II', 6, 'profesional_electivo', 'presencial'),
('IDI2222', 'Lengua alemana III', 6, 'profesional_electivo', 'presencial'),
('IDI6009', 'Lengua alemana IV', 6, 'profesional_electivo', 'presencial'),
('IDI2223', 'Lengua francesa I', 6, 'profesional_electivo', 'presencial');

INSERT INTO materias (codigo, nombre, creditos, tipo_bloque, modalidad) VALUES
('IDI2224', 'Lengua francesa II', 6, 'profesional_electivo', 'presencial'),
('IDI2225', 'Lengua francesa III', 6, 'profesional_electivo', 'presencial'),
('IDI6006', 'Lengua francesa IV', 6, 'profesional_electivo', 'presencial'),
('FIN1403', 'Matematicas financieras', 6, 'profesional_electivo', 'presencial'),
('FIN3412', 'Mercado de capitales', 6, 'profesional_electivo', 'presencial'),
('FIN3404', 'Mercado de deuda', 6, 'profesional_electivo', 'presencial'),
('FIN1402', 'Mercados financieros', 6, 'profesional_electivo', 'presencial'),
('MER1401', 'Mercadotecnia fundamental', 6, 'profesional_electivo', 'presencial'),
('TUR1001', 'Protocolo y etiqueta en los negocios', 6, 'profesional_electivo', 'presencial'),
('MER1402', 'Taller de mercadotecnia', 3, 'profesional_electivo', 'presencial'),
('NEI1401', 'Taller de negocios internacionales', 6, 'profesional_electivo', 'presencial'),
('SIS1407', 'Temas de vanguardia en tecnologias de informacion', 6, 'profesional_electivo', 'presencial'),
('SIS1408', 'Temas de vanguardia en tecnologias de sistemas', 6, 'profesional_electivo', 'presencial');

-- ========================================
-- BLOQUE ANAHUAC ELECTIVO
-- ========================================
INSERT INTO materias (codigo, nombre, creditos, tipo_bloque, modalidad) VALUES
('ELDR2401', 'Administracion de proyectos de responsabilidad social', 6, 'anahuac_electivo', 'presencial'),
('ECUG1401', 'Comunicacion y retorica', 6, 'anahuac_electivo', 'presencial'),
('EACL1408', 'Creacion de imagen y estilo personal', 6, 'anahuac_electivo', 'presencial'),
('EFAM1403', 'Educacion de la sexualidad y afectividad', 6, 'anahuac_electivo', 'presencial'),
('ELDR2415', 'La empresa a traves del metodo de caso', 6, 'anahuac_electivo', 'presencial'),
('ECUG1414', 'La persona frente a la crisis ecologica', 6, 'anahuac_electivo', 'presencial'),
('ELDR2411', 'La realidad del tercer sector', 6, 'anahuac_electivo', 'presencial'),
('EFAM1418', 'La ruta de la felicidad', 6, 'anahuac_electivo', 'presencial'),
('ELDR1404', 'Manejo de conflicto y toma de decisiones', 6, 'anahuac_electivo', 'presencial'),
('INV2203', 'Metodologia de investigacion', 6, 'anahuac_electivo', 'presencial'),
('EFAM1408', 'Noviazgo, compromiso y matrimonio', 6, 'anahuac_electivo', 'presencial'),
('ELDR2413', 'Oportunidades para generar nuevos negocios', 6, 'anahuac_electivo', 'presencial'),
('ELDR1405', 'Pensamiento critico y creativo', 6, 'anahuac_electivo', 'presencial'),
('ELDR2402', 'Principios, fundamentos y analisis de casos de bioetica', 6, 'anahuac_electivo', 'presencial'),
('EFAM1412', 'Resiliencia personal y familiar', 6, 'anahuac_electivo', 'presencial'),
('EFEA1415', 'Temas selectos fe, espirituales y religion', 6, 'anahuac_electivo', 'presencial'),
('ELDR2420', 'Vision, mentalidad y liderazgo', 6, 'anahuac_electivo', 'presencial');

-- ========================================
-- BLOQUE INTERDISCIPLINARIO
-- ========================================
INSERT INTO materias (codigo, nombre, creditos, tipo_bloque, modalidad) VALUES
('EMP1402', 'Emprendimiento e innovacion', 6, 'interdisciplinario', 'presencial'),
('EMP1401', 'Habilidades para el emprendimiento', 3, 'interdisciplinario', 'presencial'),
('SOC3401', 'Responsabilidad social', 6, 'interdisciplinario', 'presencial');

-- ========================================
-- BLOQUE INTERDISCIPLINARIO ELECTIVO
-- ========================================
INSERT INTO materias (codigo, nombre, creditos, tipo_bloque, modalidad) VALUES
('ISOC1405', 'Cambio climatico y transicion energetica', 6, 'interdisciplinario_electivo', 'presencial'),
('ELDR2403', 'Creacion de publicaciones de interes personal', 3, 'interdisciplinario_electivo', 'presencial'),
('IFIN1402', 'Economia y finanzas basicas', 6, 'interdisciplinario_electivo', 'presencial'),
('ISOC1404', 'El derecho y los sistemas juridicos en el mundo', 6, 'interdisciplinario_electivo', 'presencial'),
('IFIN1401', 'Finanzas personales', 6, 'interdisciplinario_electivo', 'presencial'),
('ISOC1410', 'Laboratorio de innovacion e impacto social', 6, 'interdisciplinario_electivo', 'presencial'),
('ISOC1402', 'Mundo actual', 6, 'interdisciplinario_electivo', 'presencial'),
('ITEC1403', 'Nuevas tecnologias', 6, 'interdisciplinario_electivo', 'presencial'),
('ISLD1402', 'Nutricion y salud', 3, 'interdisciplinario_electivo', 'presencial'),
('ISLD1403', 'Seguridad social y terceros pagadores', 3, 'interdisciplinario_electivo', 'presencial'),
('EGA1004', 'Taller de arte y cultura I', 3, 'interdisciplinario_electivo', 'presencial'),
('EGA1005', 'Taller de arte y cultura II', 3, 'interdisciplinario_electivo', 'presencial'),
('EGA1006', 'Taller de arte y cultura III', 3, 'interdisciplinario_electivo', 'presencial'),
('EGA1601', 'Taller de comunicacion I', 3, 'interdisciplinario_electivo', 'presencial'),
('EGA1602', 'Taller de comunicacion II', 3, 'interdisciplinario_electivo', 'presencial'),
('EGA1603', 'Taller de comunicacion III', 3, 'interdisciplinario_electivo', 'presencial'),
('EGA1104', 'Taller de deportes I', 3, 'interdisciplinario_electivo', 'presencial'),
('EGA1105', 'Taller de deportes II', 3, 'interdisciplinario_electivo', 'presencial'),
('EGA1106', 'Taller de deportes III', 3, 'interdisciplinario_electivo', 'presencial'),
('ISOC1406', 'Temas selectos interdisciplinarios I', 6, 'interdisciplinario_electivo', 'presencial'),
('ISOC1407', 'Temas selectos interdisciplinarios II', 6, 'interdisciplinario_electivo', 'presencial'),
('ITEC1404', 'Temas selectos interdisciplinarios III', 6, 'interdisciplinario_electivo', 'presencial');

COMMIT;

-- Verificacion rapida
SELECT COUNT(*) AS total_materias FROM materias;
