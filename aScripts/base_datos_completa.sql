-- ========================================
-- SCRIPT COMPLETO: Recrear base de datos desde cero
-- ========================================
-- Ejecutar este script en una base de datos vacia.
-- Crea la estructura base del sistema y deja un seed funcional
-- con plan fijo, oferta por carrera y minors para ISND.

-- ========================================
-- 1. ELIMINAR TODO (si existe)
-- ========================================
DROP TABLE IF EXISTS sanciones;
DROP TABLE IF EXISTS bajas;
DROP TABLE IF EXISTS inscripciones;
DROP TABLE IF EXISTS historial_academico;
DROP TABLE IF EXISTS enrolamiento;
DROP TABLE IF EXISTS secciones;
DROP TABLE IF EXISTS plan_materias;
DROP TABLE IF EXISTS minor_materias;
DROP TABLE IF EXISTS carrera_minors;
DROP TABLE IF EXISTS minors;
DROP TABLE IF EXISTS carrera_materias;
DROP TABLE IF EXISTS prerrequisitos;
DROP TABLE IF EXISTS alumno_carrera;
DROP TABLE IF EXISTS materias;
DROP TABLE IF EXISTS alumnos;
DROP TABLE IF EXISTS planes_estudio;
DROP TABLE IF EXISTS coordinador_carrera;
DROP TABLE IF EXISTS coordinadores;
DROP TABLE IF EXISTS carreras;
DROP TABLE IF EXISTS usuarios;

-- ========================================
-- 2. CREAR TABLAS BASE
-- ========================================

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'coordinador', 'alumno') NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE carreras (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    abreviatura VARCHAR(10) UNIQUE NOT NULL
);

CREATE TABLE planes_estudio (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    carrera_id INT NOT NULL,
    estatus TINYINT(1) DEFAULT 1,
    FOREIGN KEY (carrera_id) REFERENCES carreras(id)
);

CREATE TABLE materias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    creditos INT NOT NULL,
    tipo_bloque ENUM(
        'anahuac', 'anahuac_electivo',
        'profesional', 'profesional_electivo',
        'interdisciplinario', 'interdisciplinario_electivo'
    ) NOT NULL,
    modalidad ENUM('presencial', 'en_linea', 'semipresencial', 'ingles') DEFAULT 'presencial'
);

CREATE TABLE plan_materias (
    plan_id INT NOT NULL,
    materia_id INT NOT NULL,
    semestre INT NOT NULL,
    PRIMARY KEY (plan_id, materia_id),
    FOREIGN KEY (plan_id) REFERENCES planes_estudio(id),
    FOREIGN KEY (materia_id) REFERENCES materias(id)
);

CREATE TABLE carrera_materias (
    carrera_id INT NOT NULL,
    materia_id INT NOT NULL,
    semestre_sugerido INT DEFAULT NULL,
    obligatoria_en_plan TINYINT(1) NOT NULL DEFAULT 0,
    disponible TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (carrera_id, materia_id),
    FOREIGN KEY (carrera_id) REFERENCES carreras(id),
    FOREIGN KEY (materia_id) REFERENCES materias(id)
);

CREATE TABLE minors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(30) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    UNIQUE KEY uk_minors_clave (clave),
    UNIQUE KEY uk_minors_nombre (nombre)
);

CREATE TABLE carrera_minors (
    carrera_id INT NOT NULL,
    minor_id INT NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (carrera_id, minor_id),
    FOREIGN KEY (carrera_id) REFERENCES carreras(id),
    FOREIGN KEY (minor_id) REFERENCES minors(id)
);

CREATE TABLE minor_materias (
    minor_id INT NOT NULL,
    materia_id INT NOT NULL,
    semestre_sugerido INT DEFAULT NULL,
    PRIMARY KEY (minor_id, materia_id),
    FOREIGN KEY (minor_id) REFERENCES minors(id),
    FOREIGN KEY (materia_id) REFERENCES materias(id)
);

CREATE TABLE prerrequisitos (
    materia_id INT NOT NULL,
    materia_requisito_id INT NOT NULL,
    PRIMARY KEY (materia_id, materia_requisito_id),
    FOREIGN KEY (materia_id) REFERENCES materias(id),
    FOREIGN KEY (materia_requisito_id) REFERENCES materias(id)
);

CREATE TABLE alumnos (
    id_alumno INT PRIMARY KEY,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    plan_id INT NOT NULL,
    estatus_academico ENUM('inscrito', 'baja', 'egresado') DEFAULT 'inscrito',
    generacion VARCHAR(10),
    escuela_procedencia VARCHAR(100),
    numero_telefono VARCHAR(20),
    numero_identificacion VARCHAR(30),
    fecha_nacimiento DATE,
    FOREIGN KEY (id_alumno) REFERENCES usuarios(id),
    FOREIGN KEY (plan_id) REFERENCES planes_estudio(id)
);

CREATE TABLE alumno_carrera (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumno_id INT NOT NULL,
    carrera_id INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    UNIQUE KEY unique_alumno_carrera (alumno_id, carrera_id),
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id_alumno),
    FOREIGN KEY (carrera_id) REFERENCES carreras(id)
);

CREATE TABLE historial_academico (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alumno_id INT NOT NULL,
    materia_id INT NOT NULL,
    calificacion DECIMAL(4,2) DEFAULT NULL,
    estatus ENUM('aprobada', 'no_aprobada', 'no_cursada', 'revalidar', 'cursando') DEFAULT 'no_cursada',
    acta VARCHAR(50),
    fecha_examen DATE,
    tipo_examen VARCHAR(50),
    tipo_curso VARCHAR(50),
    periodo VARCHAR(50),
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id_alumno),
    FOREIGN KEY (materia_id) REFERENCES materias(id)
);

CREATE TABLE sanciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alumno_id INT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    activa TINYINT(1) DEFAULT 1,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id_alumno)
);

CREATE TABLE bajas (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    alumno_id      INT NOT NULL,
    fecha_baja     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo         VARCHAR(255),
    registrado_por INT,
    FOREIGN KEY (alumno_id)       REFERENCES alumnos(id_alumno),
    FOREIGN KEY (registrado_por)  REFERENCES usuarios(id)
);

CREATE TABLE inscripciones (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    alumno_id          INT NOT NULL,
    fecha_inscripcion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    periodo            VARCHAR(20),
    carrera_id         INT NOT NULL,
    registrado_por     INT,
    FOREIGN KEY (alumno_id)       REFERENCES alumnos(id_alumno),
    FOREIGN KEY (carrera_id)      REFERENCES carreras(id),
    FOREIGN KEY (registrado_por)  REFERENCES usuarios(id)
);

CREATE TABLE coordinadores (
    id_coordinador INT PRIMARY KEY,
    telefono VARCHAR(20),
    numero_identificacion VARCHAR(30),
    oficina VARCHAR(100),
    horario_atencion VARCHAR(200),
    especialidad VARCHAR(100),
    fecha_nacimiento DATE,
    FOREIGN KEY (id_coordinador) REFERENCES usuarios(id)
);

CREATE TABLE coordinador_carrera (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coordinador_id INT NOT NULL,
    carrera_id INT NOT NULL,
    rol_cargo ENUM('coordinador', 'vice_coordinador', 'asistente') DEFAULT 'coordinador',
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    UNIQUE KEY unique_coordinador_carrera (coordinador_id, carrera_id),
    FOREIGN KEY (coordinador_id) REFERENCES usuarios(id),
    FOREIGN KEY (carrera_id) REFERENCES carreras(id)
);

CREATE TABLE secciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    materia_id INT NOT NULL,
    profesor_id INT NOT NULL,
    seccion VARCHAR(10) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    aula VARCHAR(50),
    dias_clase VARCHAR(20),
    capacidad INT DEFAULT 30,
    periodo VARCHAR(50) DEFAULT 'AGO-DIC 2024',
    FOREIGN KEY (materia_id) REFERENCES materias(id),
    FOREIGN KEY (profesor_id) REFERENCES usuarios(id)
);

CREATE TABLE enrolamiento (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alumno_id INT NOT NULL,
    seccion_id INT NOT NULL,
    fecha_enrolamiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estatus ENUM('activo', 'retirado') DEFAULT 'activo',
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id_alumno),
    FOREIGN KEY (seccion_id) REFERENCES secciones(id),
    UNIQUE KEY unique_enrolamiento (alumno_id, seccion_id)
);

-- ========================================
-- 3. INSERTAR DATOS DE PRUEBA
-- ========================================

INSERT INTO usuarios (nombre_usuario, nombre, apellido, correo, contrasena, rol) VALUES
('admin', 'Admin', 'Sistema', 'admin@example.com', '$2a$10$MeTYYyVL043IXWN5vKOgMe4GtEyj0YtEFdxu3CMD0bTPet3vzMYdy', 'admin'),
('coordinador', 'Carla', 'Lopez', 'coord@example.com', '$2a$10$rbR9QX1bDWZT0docMEeALOaBAFOkJHqr1MR3E2pimjyYxwkD2bac2', 'coordinador'),
('alumno1', 'Luis', 'Garcia', 'alumno1@example.com', '$2a$10$b/HNF6fjTaH7RIFB9DMF9u2sASOB5jE4PtNKgNrYcPY.Mjq4Aqpu2', 'alumno');

INSERT INTO carreras (nombre, abreviatura) VALUES
('Ingenieria en Sistemas y Negocios Digitales', 'ISND');

INSERT INTO planes_estudio (nombre, carrera_id, estatus) VALUES
('Plan 2020', (SELECT id FROM carreras WHERE abreviatura = 'ISND'), 1);

INSERT INTO minors (clave, nombre, descripcion) VALUES
('MINOR_NEGOCIOS', 'Minor de Negocios', 'Oferta profesional electiva enfocada en gestion, mercadotecnia y finanzas.'),
('MINOR_IDIOMAS', 'Minor de Idiomas', 'Oferta profesional electiva enfocada en lenguas y contexto internacional.');

INSERT INTO materias (codigo, nombre, creditos, tipo_bloque, modalidad) VALUES
('HUM1401', 'Ser universitario', 6, 'anahuac', 'presencial'),
('HUM1402', 'Antropologia fundamental', 6, 'anahuac', 'presencial'),
('LDR1401', 'Liderazgo y desarrollo personal', 6, 'anahuac', 'presencial'),
('HUM1404', 'Etica', 9, 'anahuac', 'presencial'),
('HUM1405', 'Humanismo clasico y contemporaneo', 6, 'anahuac', 'presencial'),
('HUM1403', 'Persona y trascendencia', 6, 'anahuac', 'presencial'),
('LDR2401', 'Liderazgo y equipos de alto desempeno', 3, 'anahuac', 'presencial'),
('ADM1401', 'Introduccion a la empresa', 6, 'profesional', 'presencial'),
('MER4303', 'Mercadotecnia de negocios digitales', 6, 'profesional', 'presencial'),
('MAT6009', 'Matematicas superiores', 10, 'profesional', 'presencial'),
('IIND6018', 'Ingenieria economica', 6, 'profesional', 'presencial'),
('MAT3402', 'Metodos numericos', 6, 'profesional', 'presencial'),
('SIS4410', 'Procesamiento inteligente de datos', 7, 'profesional', 'presencial'),
('IIND4409', 'Planeacion estrategica', 6, 'profesional', 'presencial'),
('SIS4306', 'Programacion de dispositivos moviles II', 6, 'profesional', 'presencial'),
('TCOM3302', 'Redes avanzadas', 7, 'profesional', 'presencial'),
('SIS4411', 'Realidad virtual y aumentada', 6, 'profesional', 'presencial'),
('TCOM3303', 'Seguridad informatica y redes forenses', 6, 'profesional', 'presencial'),
('SIS4313', 'Sistemas operativos II', 6, 'profesional', 'presencial'),
('SIS3316', 'Tratamiento estadistico de la informacion', 6, 'profesional', 'presencial'),
('INT3312', 'Practicum de sistemas I: ingenieria de proyectos', 9, 'profesional', 'presencial'),
('INT4328', 'Practicum de sistemas II: administracion de proyectos', 9, 'profesional', 'presencial'),
('ELDR2401', 'Administracion de proyectos de responsabilidad social', 6, 'anahuac_electivo', 'presencial'),
('ECUG1414', 'La persona frente a la crisis ecologica', 6, 'anahuac_electivo', 'presencial'),
('ELDR1405', 'Pensamiento critico y creativo', 6, 'anahuac_electivo', 'presencial'),
('EMP1402', 'Emprendimiento e innovacion', 6, 'interdisciplinario', 'presencial'),
('SOC3401', 'Responsabilidad social', 6, 'interdisciplinario', 'presencial'),
('EGA1005', 'Taller de arte y cultura II', 3, 'interdisciplinario_electivo', 'presencial'),
('EGA1104', 'Taller de deportes I', 3, 'interdisciplinario_electivo', 'presencial'),
('EGA1106', 'Taller de deportes III', 3, 'interdisciplinario_electivo', 'presencial'),
('ISOC1406', 'Temas selectos interdisciplinarios I', 6, 'interdisciplinario_electivo', 'presencial'),
('FIN2404', 'Administracion financiera', 6, 'profesional_electivo', 'presencial'),
('ADM3403', 'Comportamiento organizacional', 6, 'profesional_electivo', 'presencial'),
('MER1403', 'Conducta del consumidor', 6, 'profesional_electivo', 'presencial'),
('ADM3401', 'Direccion de capital humano', 6, 'profesional_electivo', 'presencial'),
('MER3406', 'Estrategias digitales I', 6, 'profesional_electivo', 'presencial'),
('FIN3402', 'Evaluacion de proyectos de inversion', 6, 'profesional_electivo', 'presencial'),
('NEI2402', 'Analisis geografico de los aspectos internacionales', 6, 'profesional_electivo', 'presencial'),
('IDI6010', 'Expresion oral y escrita en aleman', 6, 'profesional_electivo', 'presencial'),
('IDI6008', 'Expresion oral y escrita en frances', 6, 'profesional_electivo', 'presencial');

SET @plan_id = (SELECT id FROM planes_estudio WHERE nombre = 'Plan 2020' LIMIT 1);
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

SET @carrera_id = (SELECT id FROM carreras WHERE abreviatura = 'ISND' LIMIT 1);
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
    END,
    CASE WHEN m.tipo_bloque IN ('anahuac', 'profesional') THEN 1 ELSE 0 END,
    1
FROM materias m
WHERE m.tipo_bloque IN ('anahuac', 'profesional', 'anahuac_electivo', 'interdisciplinario', 'interdisciplinario_electivo');

INSERT INTO carrera_minors (carrera_id, minor_id, activo) VALUES
(@carrera_id, (SELECT id FROM minors WHERE clave = 'MINOR_NEGOCIOS'), 1),
(@carrera_id, (SELECT id FROM minors WHERE clave = 'MINOR_IDIOMAS'), 1);

INSERT INTO minor_materias (minor_id, materia_id, semestre_sugerido) VALUES
((SELECT id FROM minors WHERE clave = 'MINOR_NEGOCIOS'), (SELECT id FROM materias WHERE codigo = 'FIN2404'), 9),
((SELECT id FROM minors WHERE clave = 'MINOR_NEGOCIOS'), (SELECT id FROM materias WHERE codigo = 'ADM3403'), 9),
((SELECT id FROM minors WHERE clave = 'MINOR_NEGOCIOS'), (SELECT id FROM materias WHERE codigo = 'MER1403'), 9),
((SELECT id FROM minors WHERE clave = 'MINOR_NEGOCIOS'), (SELECT id FROM materias WHERE codigo = 'ADM3401'), 9),
((SELECT id FROM minors WHERE clave = 'MINOR_NEGOCIOS'), (SELECT id FROM materias WHERE codigo = 'MER3406'), 9),
((SELECT id FROM minors WHERE clave = 'MINOR_NEGOCIOS'), (SELECT id FROM materias WHERE codigo = 'FIN3402'), 9),
((SELECT id FROM minors WHERE clave = 'MINOR_IDIOMAS'), (SELECT id FROM materias WHERE codigo = 'NEI2402'), 9),
((SELECT id FROM minors WHERE clave = 'MINOR_IDIOMAS'), (SELECT id FROM materias WHERE codigo = 'IDI6010'), 9),
((SELECT id FROM minors WHERE clave = 'MINOR_IDIOMAS'), (SELECT id FROM materias WHERE codigo = 'IDI6008'), 9);

INSERT INTO alumnos (id_alumno, matricula, plan_id, estatus_academico, generacion, escuela_procedencia, numero_telefono, numero_identificacion, fecha_nacimiento) VALUES
((SELECT id FROM usuarios WHERE nombre_usuario = 'alumno1'), '2020-ISND-001', @plan_id, 'inscrito', '2020-2024', 'Prepa IEST ANAHUAC', '5512345678', 'A12345678', '2002-05-15');

INSERT INTO alumno_carrera (alumno_id, carrera_id, activo) VALUES
((SELECT id FROM usuarios WHERE nombre_usuario = 'alumno1'), @carrera_id, 1);

INSERT INTO coordinadores (id_coordinador, telefono, oficina, horario_atencion, especialidad) VALUES
((SELECT id FROM usuarios WHERE nombre_usuario = 'coordinador'), '5512345678', 'Oficina A-201', 'Lunes a Viernes 9:00-17:00', 'Planeacion academica');

INSERT INTO coordinador_carrera (coordinador_id, carrera_id, rol_cargo, activo) VALUES
((SELECT id FROM usuarios WHERE nombre_usuario = 'coordinador'), @carrera_id, 'coordinador', 1);

INSERT INTO secciones (materia_id, profesor_id, seccion, hora_inicio, hora_fin, aula, dias_clase) VALUES
((SELECT id FROM materias WHERE codigo = 'ADM1401'), (SELECT id FROM usuarios WHERE nombre_usuario = 'coordinador'), '01', '08:00:00', '09:30:00', 'Lab-01', 'L-M-J'),
((SELECT id FROM materias WHERE codigo = 'MAT6009'), (SELECT id FROM usuarios WHERE nombre_usuario = 'coordinador'), '01', '14:00:00', '15:30:00', 'Aula-101', 'L-M-J'),
((SELECT id FROM materias WHERE codigo = 'FIN2404'), (SELECT id FROM usuarios WHERE nombre_usuario = 'coordinador'), '01', '16:00:00', '17:30:00', 'Aula-205', 'M-J');

-- ========================================
-- 4. VERIFICACION FINAL
-- ========================================
SELECT '=== BASE DE DATOS RECREADA EXITOSAMENTE ===' AS estado;

SELECT 'Usuarios' AS tabla, COUNT(*) AS cantidad FROM usuarios
UNION ALL
SELECT 'Carreras', COUNT(*) FROM carreras
UNION ALL
SELECT 'Planes', COUNT(*) FROM planes_estudio
UNION ALL
SELECT 'Materias', COUNT(*) FROM materias
UNION ALL
SELECT 'Materias en plan', COUNT(*) FROM plan_materias
UNION ALL
SELECT 'Materias por carrera', COUNT(*) FROM carrera_materias
UNION ALL
SELECT 'Minors', COUNT(*) FROM minors
UNION ALL
SELECT 'Materias por minor', COUNT(*) FROM minor_materias
UNION ALL
SELECT 'Alumnos', COUNT(*) FROM alumnos
UNION ALL
SELECT 'Coordinadores', COUNT(*) FROM coordinadores
UNION ALL
SELECT 'Secciones', COUNT(*) FROM secciones;

SELECT
    CONCAT('Semestre ', pm.semestre) AS semestre,
    COUNT(*) AS materias,
    GROUP_CONCAT(m.nombre ORDER BY m.nombre SEPARATOR ', ') AS nombres
FROM plan_materias pm
JOIN materias m ON pm.materia_id = m.id
WHERE pm.plan_id = @plan_id
GROUP BY pm.semestre
ORDER BY pm.semestre;

SELECT
    m.codigo,
    m.nombre,
    cm.semestre_sugerido,
    cm.obligatoria_en_plan,
    'oferta_carrera' AS origen
FROM carrera_materias cm
JOIN materias m ON cm.materia_id = m.id
WHERE cm.carrera_id = @carrera_id
UNION ALL
SELECT
    m.codigo,
    m.nombre,
    mm.semestre_sugerido,
    0 AS obligatoria_en_plan,
    mn.nombre AS origen
FROM carrera_minors cmn
JOIN minors mn ON cmn.minor_id = mn.id
JOIN minor_materias mm ON mm.minor_id = mn.id
JOIN materias m ON mm.materia_id = m.id
WHERE cmn.carrera_id = @carrera_id
ORDER BY origen, semestre_sugerido, nombre;