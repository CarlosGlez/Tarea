-- ========================================
-- MODULO MATERIAS - ESTRUCTURA
-- MySQL 8+
-- ========================================
-- Este script crea solo las tablas del modulo de materias.
-- Requiere que ya existan: planes_estudio, alumnos, materias base de usuarios.

CREATE TABLE IF NOT EXISTS materias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    creditos INT NOT NULL,
    tipo_bloque ENUM(
        'anahuac', 'anahuac_electivo',
        'profesional', 'profesional_electivo',
        'interdisciplinario', 'interdisciplinario_electivo'
    ) NOT NULL,
    modalidad ENUM('presencial', 'en_linea', 'semipresencial', 'ingles') DEFAULT 'presencial',
    UNIQUE KEY uk_materias_codigo (codigo),
    INDEX idx_materias_tipo_bloque (tipo_bloque)
);

CREATE TABLE IF NOT EXISTS plan_materias (
    plan_id INT NOT NULL,
    materia_id INT NOT NULL,
    semestre INT NOT NULL,
    PRIMARY KEY (plan_id, materia_id),
    INDEX idx_plan_materias_plan_semestre (plan_id, semestre),
    FOREIGN KEY (plan_id) REFERENCES planes_estudio(id),
    FOREIGN KEY (materia_id) REFERENCES materias(id)
);

CREATE TABLE IF NOT EXISTS carrera_materias (
    carrera_id INT NOT NULL,
    materia_id INT NOT NULL,
    semestre_sugerido INT DEFAULT NULL,
    obligatoria_en_plan TINYINT(1) NOT NULL DEFAULT 0,
    disponible TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (carrera_id, materia_id),
    INDEX idx_carrera_materias_semestre (carrera_id, semestre_sugerido),
    FOREIGN KEY (carrera_id) REFERENCES carreras(id),
    FOREIGN KEY (materia_id) REFERENCES materias(id)
);

CREATE TABLE IF NOT EXISTS minors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(30) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    UNIQUE KEY uk_minors_clave (clave),
    UNIQUE KEY uk_minors_nombre (nombre)
);

CREATE TABLE IF NOT EXISTS carrera_minors (
    carrera_id INT NOT NULL,
    minor_id INT NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (carrera_id, minor_id),
    FOREIGN KEY (carrera_id) REFERENCES carreras(id),
    FOREIGN KEY (minor_id) REFERENCES minors(id)
);

CREATE TABLE IF NOT EXISTS minor_materias (
    minor_id INT NOT NULL,
    materia_id INT NOT NULL,
    semestre_sugerido INT DEFAULT NULL,
    PRIMARY KEY (minor_id, materia_id),
    INDEX idx_minor_materias_semestre (minor_id, semestre_sugerido),
    FOREIGN KEY (minor_id) REFERENCES minors(id),
    FOREIGN KEY (materia_id) REFERENCES materias(id)
);

CREATE TABLE IF NOT EXISTS prerrequisitos (
    materia_id INT NOT NULL,
    materia_requisito_id INT NOT NULL,
    PRIMARY KEY (materia_id, materia_requisito_id),
    INDEX idx_prerrequisitos_requisito (materia_requisito_id),
    CONSTRAINT chk_prerrequisito_distinto CHECK (materia_id <> materia_requisito_id),
    FOREIGN KEY (materia_id) REFERENCES materias(id),
    FOREIGN KEY (materia_requisito_id) REFERENCES materias(id)
);

CREATE TABLE IF NOT EXISTS historial_academico (
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
    oportunidad TINYINT UNSIGNED NOT NULL DEFAULT 1,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_calificacion_rango CHECK (calificacion IS NULL OR (calificacion >= 0 AND calificacion <= 100)),
    UNIQUE KEY uk_historial_alumno_materia_periodo_oportunidad (alumno_id, materia_id, periodo, oportunidad),
    INDEX idx_historial_alumno (alumno_id),
    INDEX idx_historial_materia (materia_id),
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id_alumno),
    FOREIGN KEY (materia_id) REFERENCES materias(id)
);
