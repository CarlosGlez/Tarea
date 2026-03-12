-- ========================================
-- SCRIPT COMPLETO: Recrear base de datos desde cero
-- ========================================
-- Ejecutar este script en una base de datos VACÍA
-- Elimina todo y crea la estructura completa del sistema

-- ========================================
-- 1. ELIMINAR TODO (si existe)
-- ========================================
DROP TABLE IF EXISTS sanciones;
DROP TABLE IF EXISTS historial_academico;
DROP TABLE IF EXISTS enrolamiento;
DROP TABLE IF EXISTS secciones;
DROP TABLE IF EXISTS plan_materias;
DROP TABLE IF EXISTS prerrequisitos;
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

-- Usuarios del sistema
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

alter table usuarios add nombre VARCHAR(100);
alter table usuarios add apellido VARCHAR(100);

SELECT * FROM usuarios;





-- Carreras académicas
CREATE TABLE carreras (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    abreviatura VARCHAR(10) UNIQUE NOT NULL
);

-- Planes de estudio
CREATE TABLE planes_estudio (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    carrera_id INT NOT NULL,
    estatus BIT DEFAULT 1,
    FOREIGN KEY (carrera_id) REFERENCES carreras(id)
);

-- Materias del plan de estudios
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

-- Relación entre planes y materias
CREATE TABLE plan_materias (
    plan_id INT NOT NULL,
    materia_id INT NOT NULL,
    semestre INT NOT NULL,
    PRIMARY KEY (plan_id, materia_id),
    FOREIGN KEY (plan_id) REFERENCES planes_estudio(id),
    FOREIGN KEY (materia_id) REFERENCES materias(id)
);

-- Prerrequisitos entre materias
CREATE TABLE prerrequisitos (
    materia_id INT,
    materia_requisito_id INT,
    PRIMARY KEY (materia_id, materia_requisito_id),
    FOREIGN KEY (materia_id) REFERENCES materias(id),
    FOREIGN KEY (materia_requisito_id) REFERENCES materias(id)
);

-- Perfil extendido de alumnos
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

insert into alumnos (id_alumno, matricula, plan_id, estatus_academico, generacion, escuela_procedencia, numero_telefono, numero_identificacion, fecha_nacimiento) values
((select id from usuarios where nombre_usuario = 'alumno1'), '2020-ISND-001', (select id from planes_estudio where nombre = 'Plan 2020'), 'inscrito', '2020-2024', 'Prepa IEST ANAHUAC', '5512345678', 'A12345678', '2002-05-15');

alter table alumnos add numero_telefono VARCHAR(20);
alter table alumnos add numero_identificacion VARCHAR(30);
alter table alumnos add fecha_nacimiento DATE;

CREATE TABLE alumno_carrera (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumno_id INT NOT NULL,
    carrera_id INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BIT DEFAULT 1,
    UNIQUE KEY unique_alumno_carrera (alumno_id, carrera_id),
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id_alumno),
    FOREIGN KEY (carrera_id) REFERENCES carreras(id)
);


insert into alumno_carrera (alumno_id, carrera_id, activo) values
((select id from usuarios where nombre_usuario = 'alumno1'), (select id from carreras where abreviatura = 'ISND'), 1);



-- Historial académico
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

-- Sanciones
CREATE TABLE sanciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alumno_id INT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    activa BIT DEFAULT 1,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id_alumno)
);

-- Perfil de coordinadores
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

alter table coordinadores add numero_identificacion VARCHAR(30);
alter table coordinadores add especialidad VARCHAR(100);



-- Asignación coordinador-carrera
CREATE TABLE coordinador_carrera (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coordinador_id INT NOT NULL,
    carrera_id INT NOT NULL,
    rol_cargo ENUM('coordinador', 'vice_coordinador', 'asistente') DEFAULT 'coordinador',
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BIT DEFAULT 1,
    UNIQUE KEY unique_coordinador_carrera (coordinador_id, carrera_id),
    FOREIGN KEY (coordinador_id) REFERENCES usuarios(id),
    FOREIGN KEY (carrera_id) REFERENCES carreras(id)
);

SELECT * From coordinador_carrera;
insert into coordinador_carrera (coordinador_id, carrera_id, rol_cargo, activo) values
((select id from usuarios where nombre_usuario = 'coordinador'), (select id from carreras where abreviatura = 'ISND'), 'coordinador', 1);

-- Secciones de clases
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

-- Enrolamiento de alumnos en secciones
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

-- Usuarios (contraseñas hasheadas con bcrypt, saltRounds=10)
-- Plain passwords: Admin123!, Coord123!, Alumno123!
INSERT INTO usuarios (nombre_usuario, correo, contrasena, rol) VALUES
('admin', 'admin@example.com', '$2a$10$MeTYYyVL043IXWN5vKOgMe4GtEyj0YtEFdxu3CMD0bTPet3vzMYdy', 'admin'),
('coordinador', 'coord@example.com', '$2a$10$rbR9QX1bDWZT0docMEeALOaBAFOkJHqr1MR3E2pimjyYxwkD2bac2', 'coordinador'),
('alumno1', 'alumno1@example.com', '$2a$10$b/HNF6fjTaH7RIFB9DMF9u2sASOB5jE4PtNKgNrYcPY.Mjq4Aqpu2', 'alumno');

-- Carreras
INSERT INTO carreras (nombre, abreviatura) VALUES
('Ingeniería en Sistemas y Negocios Digitales', 'ISND');

-- Plan de estudios
INSERT INTO planes_estudio (nombre, carrera_id, estatus) VALUES
('Plan 2020', (SELECT id FROM carreras WHERE abreviatura = 'ISND'), 1);

-- ========================================
-- 4. MATERIAS DEL PLAN DE ESTUDIOS
-- ========================================

-- BLOQUE ANAHUAC
INSERT INTO materias (codigo, nombre, creditos, tipo_bloque, modalidad) VALUES
('HUM1402', 'Antropología fundamental', 6, 'anahuac', 'presencial'),
('HUM1404', 'Ética', 9, 'anahuac', 'presencial'),
('HUM1405', 'Humanismo clásico y contemporáneo', 6, 'anahuac', 'presencial'),
('LDR1401', 'Liderazgo y desarrollo personal', 6, 'anahuac', 'presencial'),
('LDR2401', 'Liderazgo y equipos de alto desempeño', 3, 'anahuac', 'presencial'),
('HUM1403', 'Persona y trascendencia', 6, 'anahuac', 'presencial'),
('HUM1401', 'Ser universitario', 6, 'anahuac', 'presencial');

-- BLOQUE PROFESIONAL
INSERT INTO materias (codigo, nombre, creditos, tipo_bloque) VALUES
('IIND6018', 'Ingeniería económica', 6, 'profesional'),
('ADM1401', 'Introducción a la empresa', 6, 'profesional'),
('MAT6009', 'Matemáticas superiores', 10, 'profesional'),
('MER4303', 'Mercadotecnia de negocios digitales', 6, 'profesional'),
('MAT3402', 'Métodos numéricos', 6, 'profesional'),
('IIND4409', 'Planeación estratégica', 6, 'profesional'),
('INT3312', 'Practicum de sistemas I: ingeniería de proyectos', 9, 'profesional'),
('INT4328', 'Practicum de sistemas II: administración de proyectos', 9, 'profesional'),
('SIS4410', 'Procesamiento inteligente de datos', 7, 'profesional'),
('SIS4306', 'Programación de dispositivos móviles II', 6, 'profesional'),
('SIS4411', 'Realidad virtual y augmented', 6, 'profesional'),
('TCOM3302', 'Redes avanzadas', 7, 'profesional'),
('TCOM3303', 'Seguridad informática y redes forenses', 6, 'profesional'),
('SIS4313', 'Sistemas operativos II', 6, 'profesional'),
('SIS3316', 'Tratamiento estadístico de la información', 6, 'profesional');

-- BLOQUE PROFESIONAL ELECTIVO
INSERT INTO materias (codigo, nombre, creditos, tipo_bloque) VALUES
('FIN2404', 'Administración financiera', 6, 'profesional_electivo'),
('ADM3403', 'Comportamiento organizacional', 6, 'profesional_electivo'),
('MER1403', 'Conducta del consumidor', 6, 'profesional_electivo'),
('SIS1407', 'Temas de vanguardia en TI', 6, 'profesional_electivo'),
('SIS1408', 'Temas de vanguardia en tecnologías de sistemas', 6, 'profesional_electivo');

-- BLOQUE ANAHUAC ELECTIVO
INSERT INTO materias (codigo, nombre, creditos, tipo_bloque) VALUES
('ELDR2401', 'Administración de proyectos de responsabilidad social', 6, 'anahuac_electivo'),
('ECUG1414', 'La persona frente a la crisis ecológica', 6, 'anahuac_electivo'),
('ELDR1405', 'Pensamiento crítico y creativo', 6, 'anahuac_electivo');

-- BLOQUE INTERDISCIPLINARIO ELECTIVO
INSERT INTO materias (codigo, nombre, creditos, tipo_bloque) VALUES
('EGA1005', 'Taller de arte y cultura II', 3, 'interdisciplinario_electivo'),
('EGA1104', 'Taller de deportes I', 3, 'interdisciplinario_electivo'),
('EGA1106', 'Taller de deportes III', 3, 'interdisciplinario_electivo'),
('ISOC1406', 'Temas selectos interdisciplinarios I', 6, 'interdisciplinario_electivo');

-- ========================================
-- 5. ASIGNAR MATERIAS AL PLAN
-- ========================================

-- Semestre 1
INSERT INTO plan_materias (plan_id, materia_id, semestre) VALUES
((SELECT id FROM planes_estudio WHERE nombre = 'Plan 2020'), (SELECT id FROM materias WHERE codigo = 'HUM1401'), 1),
((SELECT id FROM planes_estudio WHERE nombre = 'Plan 2020'), (SELECT id FROM materias WHERE codigo = 'HUM1402'), 1),
((SELECT id FROM planes_estudio WHERE nombre = 'Plan 2020'), (SELECT id FROM materias WHERE codigo = 'LDR1401'), 1);

-- Semestre 2
INSERT INTO plan_materias (plan_id, materia_id, semestre) VALUES
((SELECT id FROM planes_estudio WHERE nombre = 'Plan 2020'), (SELECT id FROM materias WHERE codigo = 'ADM1401'), 2),
((SELECT id FROM planes_estudio WHERE nombre = 'Plan 2020'), (SELECT id FROM materias WHERE codigo = 'MAT6009'), 2),
((SELECT id FROM planes_estudio WHERE nombre = 'Plan 2020'), (SELECT id FROM materias WHERE codigo = 'MER4303'), 2);

-- Semestre 3
INSERT INTO plan_materias (plan_id, materia_id, semestre) VALUES
((SELECT id FROM planes_estudio WHERE nombre = 'Plan 2020'), (SELECT id FROM materias WHERE codigo = 'IIND6018'), 3),
((SELECT id FROM planes_estudio WHERE nombre = 'Plan 2020'), (SELECT id FROM materias WHERE codigo = 'MAT3402'), 3),
((SELECT id FROM planes_estudio WHERE nombre = 'Plan 2020'), (SELECT id FROM materias WHERE codigo = 'SIS4410'), 3);

-- Semestre 4
INSERT INTO plan_materias (plan_id, materia_id, semestre) VALUES
((SELECT id FROM planes_estudio WHERE nombre = 'Plan 2020'), (SELECT id FROM materias WHERE codigo = 'IIND4409'), 4),
((SELECT id FROM planes_estudio WHERE nombre = 'Plan 2020'), (SELECT id FROM materias WHERE codigo = 'SIS4306'), 4),
((SELECT id FROM planes_estudio WHERE nombre = 'Plan 2020'), (SELECT id FROM materias WHERE codigo = 'TCOM3302'), 4);

-- ========================================
-- 6. DATOS DEL ALUMNO
-- ========================================

INSERT INTO alumnos (id_alumno, matricula, plan_id, estatus_academico, generacion, escuela_procedencia) VALUES
((SELECT id FROM usuarios WHERE nombre_usuario = 'alumno1'), '2020-ISND-001',
 (SELECT id FROM planes_estudio WHERE nombre = 'Plan 2020'), 'inscrito', '2020-2024', 'Prepa IEST ANAHUAC');

-- ========================================
-- 7. DATOS DEL COORDINADOR
-- ========================================

INSERT INTO coordinadores (id_coordinador, telefono, oficina, horario_atencion) VALUES
((SELECT id FROM usuarios WHERE nombre_usuario = 'coordinador'), '5512345678', 'Oficina A-201', 'Lunes a Viernes 9:00-17:00');

INSERT INTO coordinador_carrera (coordinador_id, carrera_id, rol_cargo, activo) VALUES
((SELECT id FROM usuarios WHERE nombre_usuario = 'coordinador'),
 (SELECT id FROM carreras WHERE abreviatura = 'ISND'), 'coordinador', 1);

-- ========================================
-- 8. SECCIONES DE EJEMPLO
-- ========================================

INSERT INTO secciones (materia_id, profesor_id, seccion, hora_inicio, hora_fin, aula, dias_clase) VALUES
((SELECT id FROM materias WHERE codigo = 'ADM1401'), (SELECT id FROM usuarios WHERE nombre_usuario = 'coordinador'), '01', '08:00:00', '09:30:00', 'Lab-01', 'L-M-J'),
((SELECT id FROM materias WHERE codigo = 'ADM1401'), (SELECT id FROM usuarios WHERE nombre_usuario = 'coordinador'), '02', '10:00:00', '11:30:00', 'Lab-02', 'M-J-V'),
((SELECT id FROM materias WHERE codigo = 'MAT6009'), (SELECT id FROM usuarios WHERE nombre_usuario = 'coordinador'), '01', '14:00:00', '15:30:00', 'Aula-101', 'L-M-J');

-- ========================================
-- 9. VERIFICACIÓN FINAL
-- ========================================

SELECT '=== BASE DE DATOS RECREADA EXITOSAMENTE ===' as Estado;

SELECT
    'Usuarios:' as Tabla, COUNT(*) as Cantidad FROM usuarios
UNION ALL
SELECT 'Carreras:', COUNT(*) FROM carreras
UNION ALL
SELECT 'Materias:', COUNT(*) FROM materias
UNION ALL
SELECT 'Planes:', COUNT(*) FROM planes_estudio
UNION ALL
SELECT 'Materias en plan:', COUNT(*) FROM plan_materias
UNION ALL
SELECT 'Alumnos:', COUNT(*) FROM alumnos
UNION ALL
SELECT 'Coordinadores:', COUNT(*) FROM coordinadores
UNION ALL
SELECT 'Asignaciones coord:', COUNT(*) FROM coordinador_carrera
UNION ALL
SELECT 'Secciones:', COUNT(*) FROM secciones;

-- Verificar coordinador completo
SELECT
    'COORDINADOR CONFIGURADO:' as Info,
    u.nombre_usuario,
    c.nombre as carrera,
    cc.rol_cargo,
    co.telefono
FROM usuarios u
JOIN coordinador_carrera cc ON u.id = cc.coordinador_id
JOIN carreras c ON cc.carrera_id = c.id
LEFT JOIN coordinadores co ON u.id = co.id_coordinador
WHERE u.nombre_usuario = 'coordinador';

-- Verificar materias del plan
SELECT
    CONCAT('Semestre ', pm.semestre) as Semestre,
    COUNT(*) as Materias,
    GROUP_CONCAT(m.nombre SEPARATOR ', ') as Nombres
FROM plan_materias pm
JOIN materias m ON pm.materia_id = m.id
JOIN planes_estudio p ON pm.plan_id = p.id
WHERE p.nombre = 'Plan 2020'
GROUP BY pm.semestre
ORDER BY pm.semestre;