-- ========================================
-- TABLAS DE EVENTOS: bajas e inscripciones
-- Ejecutar después de base_datos_completa.sql
-- (ya incluidas en base_datos_completa.sql a partir de esta versión)
-- ========================================

CREATE TABLE IF NOT EXISTS bajas (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    alumno_id      INT NOT NULL,
    fecha_baja     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo         VARCHAR(255),
    registrado_por INT,
    FOREIGN KEY (alumno_id)       REFERENCES alumnos(id_alumno),
    FOREIGN KEY (registrado_por)  REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS inscripciones (
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


-- ========================================
-- QUERIES DE REPORTE (referencia / pruebas)
-- ========================================

-- Reporte deserción: lista detallada de bajas por carrera
-- Sustituye :carrera_id con el id real
SELECT
    u.nombre,
    u.apellido,
    a.matricula,
    a.generacion,
    c.nombre         AS carrera,
    b.fecha_baja,
    b.motivo,
    YEAR(b.fecha_baja)  AS anio_baja,
    MONTH(b.fecha_baja) AS mes_baja
FROM bajas b
JOIN alumnos a       ON b.alumno_id  = a.id_alumno
JOIN usuarios u      ON a.id_alumno  = u.id
JOIN alumno_carrera ac ON a.id_alumno = ac.alumno_id
JOIN carreras c      ON ac.carrera_id = c.id
WHERE ac.carrera_id = :carrera_id
ORDER BY b.fecha_baja DESC;

-- Reporte deserción: totales agrupados por año y mes
SELECT
    YEAR(b.fecha_baja)  AS anio,
    MONTH(b.fecha_baja) AS mes,
    COUNT(*)            AS cantidad_bajas
FROM bajas b
JOIN alumnos a       ON b.alumno_id  = a.id_alumno
JOIN alumno_carrera ac ON a.id_alumno = ac.alumno_id
WHERE ac.carrera_id = :carrera_id
GROUP BY YEAR(b.fecha_baja), MONTH(b.fecha_baja)
ORDER BY anio DESC, mes DESC;

-- Reporte inscripciones: lista detallada por carrera
SELECT
    u.nombre,
    u.apellido,
    a.matricula,
    a.generacion,
    i.periodo,
    i.fecha_inscripcion
FROM inscripciones i
JOIN alumnos a  ON i.alumno_id  = a.id_alumno
JOIN usuarios u ON a.id_alumno  = u.id
WHERE i.carrera_id = :carrera_id
ORDER BY i.fecha_inscripcion DESC;

-- Reporte inscripciones: totales agrupados por periodo
SELECT
    i.periodo,
    COUNT(*) AS cantidad_inscripciones
FROM inscripciones i
WHERE i.carrera_id = :carrera_id
GROUP BY i.periodo
ORDER BY i.periodo DESC;
