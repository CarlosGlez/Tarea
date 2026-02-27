CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL, -- Para login
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'coordinador', 'alumno') NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

select * from usuarios;

-- Usuarios de prueba (contraseñas hasheadas con bcrypt, saltRounds=10)
-- Plain passwords para login de prueba: Admin123!, Coord123!, Alumno123!
INSERT INTO usuarios (nombre_usuario, correo, contrasena, rol) VALUES
('admin', 'admin@example.com', '$2a$10$MeTYYyVL043IXWN5vKOgMe4GtEyj0YtEFdxu3CMD0bTPet3vzMYdy', 'admin'),
('coordinador', 'coord@example.com', '$2a$10$rbR9QX1bDWZT0docMEeALOaBAFOkJHqr1MR3E2pimjyYxwkD2bac2', 'coordinador'),
('alumno1', 'alumno1@example.com', '$2a$10$b/HNF6fjTaH7RIFB9DMF9u2sASOB5jE4PtNKgNrYcPY.Mjq4Aqpu2', 'alumno');

-- 2. Carreras y Planes (Estructura para el Coordinador)

CREATE TABLE carreras (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    abreviatura VARCHAR(10)
);



CREATE TABLE planes_estudio (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL, -- Ej: "Plan 2020"
    carrera_id INT NOT NULL,
    estatus BIT DEFAULT 1, -- Activo/Inactivo
    FOREIGN KEY (carrera_id) REFERENCES carreras(id)
);



-- 3. Perfil del Alumno (Extensión de Usuarios)

CREATE TABLE alumnos (
    id_alumno INT PRIMARY KEY,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    plan_id INT NOT NULL,
    estatus_academico ENUM('inscrito', 'baja', 'egresado') DEFAULT 'inscrito',
    generacion VARCHAR(10), -- Ej: "2020-2024" para estadísticas del coordi
    escuela_procedencia VARCHAR(100),
    FOREIGN KEY (id_alumno) REFERENCES usuarios(id),
    FOREIGN KEY (plan_id) REFERENCES planes_estudio(id)
);



-- 4. Materias y Requisitos
CREATE TABLE materias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(20) UNIQUE NOT NULL, -- Ej: 'SIS1401'
    nombre VARCHAR(100) NOT NULL,
    creditos INT NOT NULL,
    tipo_bloque ENUM(
        'anahuac', 'anahuac_electivo', 
        'profesional', 'profesional_electivo', 
        'interdisciplinario', 'interdisciplinario_electivo'
    ) NOT NULL,
    modalidad ENUM('presencial', 'en_linea', 'semipresencial', 'ingles') DEFAULT 'presencial'
);



-- Tabla para soportar múltiples prerrequisitos (si aplica)
CREATE TABLE prerrequisitos (
    materia_id INT,
    materia_requisito_id INT,
    PRIMARY KEY (materia_id, materia_requisito_id),
    FOREIGN KEY (materia_id) REFERENCES materias(id),
    FOREIGN KEY (materia_requisito_id) REFERENCES materias(id)
);



-- 5. Kardex / Historial Académico

CREATE TABLE historial_academico (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alumno_id INT NOT NULL,
    materia_id INT NOT NULL,
    calificacion DECIMAL(4,2) DEFAULT NULL,
    estatus ENUM('aprobada', 'no_aprobada', 'no_cursada', 'revalidar', 'cursando') DEFAULT 'no_cursada',
    -- Campos para el desglose detallado
    acta VARCHAR(50),          -- Ej: '2024-2-0562'
    fecha_examen DATE,         -- Ej: '2024-12-03'
    tipo_examen VARCHAR(50),   -- Ej: 'Ordinario'
    tipo_curso VARCHAR(50),    -- Ej: 'Normal'
    periodo VARCHAR(50),       -- Ej: 'AGO-DIC 2024'
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id_alumno),
    FOREIGN KEY (materia_id) REFERENCES materias(id)
);



-- 6. Sanciones (Requerido en el diagrama del Alumno)

CREATE TABLE sanciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alumno_id INT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    activa BIT DEFAULT 1,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id_alumno)
);



CREATE VIEW vista_resumen_academico AS
SELECT 
    alumno_id,
    COUNT(materia_id) AS total_materias,
    SUM(CASE WHEN estatus = 'aprobada' THEN 1 ELSE 0 END) AS materias_aprobadas,
    AVG(CASE WHEN estatus = 'aprobada' THEN calificacion END) AS promedio_general,
    SUM(CASE WHEN estatus = 'aprobada' THEN creditos ELSE 0 END) AS creditos_acumulados
FROM historial_academico h
JOIN materias m ON h.materia_id = m.id
GROUP BY alumno_id;


CREATE TABLE plan_materias (
    plan_id INT NOT NULL,
    materia_id INT NOT NULL,
    semestre INT NOT NULL,
    PRIMARY KEY (plan_id, materia_id),
    FOREIGN KEY (plan_id) REFERENCES planes_estudio(id),
    FOREIGN KEY (materia_id) REFERENCES materias(id)
);



-- BLOQUE PROFESIONAL (Complemento)

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



-- BLOQUE PROFESIONAL ELECTIVO (Muestra representativa del texto)
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



-- BLOQUE INTERDISCIPLINARIO ELECTIVO (Talleres y Temas Selectos)

INSERT INTO materias (codigo, nombre, creditos, tipo_bloque) VALUES
('EGA1005', 'Taller de arte y cultura II', 3, 'interdisciplinario_electivo'),
('EGA1104', 'Taller de deportes I', 3, 'interdisciplinario_electivo'),
('EGA1106', 'Taller de deportes III', 3, 'interdisciplinario_electivo'),
('ISOC1406', 'Temas selectos interdisciplinarios I', 6, 'interdisciplinario_electivo');

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
INSERT INTO materias (codigo, nombre, creditos, tipo_bloque, modalidad) VALUES
('SIS3302', 'Administración de proyectos de software', 6, 'profesional', 'presencial'),
('MAT1404', 'Álgebra lineal', 7, 'profesional', 'presencial'),
('SIS1401', 'Algoritmos y programación', 6, 'profesional', 'presencial'),
('SIS4309', 'Aprendizaje máquina', 6, 'profesional', 'presencial'),
('SIS2403', 'Bases de datos', 7, 'profesional', 'presencial'),
('SIS2404', 'Bases de datos avanzadas', 6, 'profesional', 'presencial'),
('MAT1402', 'Cálculo diferencial', 6, 'profesional', 'presencial'),
('MAT1403', 'Cálculo integral', 6, 'profesional', 'presencial'),
('SIS4402', 'Calidad de software', 6, 'profesional', 'presencial'),
('CON2402', 'Contabilidad y costos para ingeniería', 7, 'profesional', 'presencial'),
('SIS3307', 'Desarrollo de aplicaciones web I', 6, 'profesional', 'presencial'),
('SIS6004', 'Desarrollo de aplicaciones web II', 6, 'profesional', 'presencial'),
('SIS3411', 'Desarrollo de software', 6, 'profesional', 'presencial'),
('SIS3405', 'Estructuras de datos', 6, 'profesional', 'presencial'),
('ADM1300', 'Gestión de negocios digitales', 6, 'profesional', 'presencial'),
('SIS3404', 'Implementación de sistemas integrados', 6, 'profesional', 'presencial'),
('SIS4404', 'Infraestructura y cómputo en la nube', 6, 'profesional', 'presencial'),
('SIS3406', 'Ingeniería de software', 6, 'profesional', 'presencial'),
('SIS4401', 'Inteligencia artificial', 6, 'profesional', 'presencial'),
('SIS3409', 'Inteligencia de negocios y analítica de datos', 7, 'profesional', 'presencial'),
('SIS1300', 'Introducción a los Sistemas y Negocios Digitales', 6, 'profesional', 'presencial'),
('SIS4407', 'Legislación informática', 6, 'profesional', 'presencial'),
('SIS1402', 'Lenguajes orientados a objetos', 6, 'profesional', 'presencial'),
('MAT1415', 'Matemáticas para computación', 6, 'profesional', 'presencial'),
('MAT2403', 'Probabilidad y estadística', 6, 'profesional', 'presencial'),
('SIS4305', 'Programación de dispositivos móviles I', 6, 'profesional', 'presencial'),
('TCOM2301', 'Redes de computadoras', 7, 'profesional', 'presencial'),
('SIS3401', 'Sistemas operativos I', 7, 'profesional', 'presencial');


-- BLOQUE INTERDISCIPLINARIO
INSERT INTO materias (codigo, nombre, creditos, tipo_bloque, modalidad) VALUES
('EMP1402', 'Emprendimiento e innovación', 6, 'interdisciplinario', 'presencial'),
('EMP1401', 'Habilidades para el emprendimiento', 3, 'interdisciplinario', 'presencial'),
('SOC3401', 'Responsabilidad social', 6, 'interdisciplinario', 'presencial');

-- Insertar la carrera si no existe

INSERT INTO carreras (nombre, abreviatura) 
VALUES ('Ingeniería en Sistemas y Negocios Digitales', 'ISND');



-- Crear el Plan de Estudios (obteniendo el ID de la carrera recién creada)
INSERT INTO planes_estudio (nombre, carrera_id, estatus) 
VALUES ('Plan 2020', (SELECT id FROM carreras WHERE abreviatura = 'ISND'), 1);



-- Supongamos que el ID del alumno Carlos es 1

INSERT INTO historial_academico (alumno_id, materia_id, calificacion, estatus, periodo, tipo_examen)
VALUES 
(1, (SELECT id FROM materias WHERE codigo = 'SIS1401'), 10.0, 'aprobada', 'AGO-DIC 2024', 'Ordinario'),
(1, (SELECT id FROM materias WHERE codigo = 'MAT1415'), 9.8, 'aprobada', 'AGO-DIC 2024', 'Ordinario'),
(1, (SELECT id FROM materias WHERE codigo = 'SIS4309'), NULL, 'no_cursada', NULL, NULL);