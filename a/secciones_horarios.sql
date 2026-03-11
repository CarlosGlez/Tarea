-- ========================================
-- SCRIPT: Crear tablas faltantes y datos de ejemplo
-- ========================================

-- Crear tabla de secciones (si no existe)
CREATE TABLE IF NOT EXISTS secciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    materia_id INT NOT NULL,
    profesor_id INT NOT NULL,
    seccion VARCHAR(10) NOT NULL, -- Ej: '01', '02'
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    aula VARCHAR(50),
    dias_clase VARCHAR(20), -- Ej: 'L-M-J', 'M-J-V'
    capacidad INT DEFAULT 30,
    periodo VARCHAR(50) DEFAULT 'AGO-DIC 2024',
    FOREIGN KEY (materia_id) REFERENCES materias(id),
    FOREIGN KEY (profesor_id) REFERENCES usuarios(id)
);

-- Crear tabla de enrolamiento (si no existe)
CREATE TABLE IF NOT EXISTS enrolamiento (
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
-- INSERTAR DATOS DE EJEMPLO
-- ========================================

-- Obtener IDs necesarios
SET @plan_id = (SELECT id FROM planes_estudio WHERE nombre = 'Plan 2020');
SET @coordinador_id = (SELECT id FROM usuarios WHERE nombre_usuario = 'coordinador');

-- Insertar algunas secciones de ejemplo
INSERT INTO secciones (materia_id, profesor_id, seccion, hora_inicio, hora_fin, aula, dias_clase) VALUES
-- Programación I (asumiendo que existe)
((SELECT id FROM materias WHERE codigo = 'ADM1401'), @coordinador_id, '01', '08:00:00', '09:30:00', 'Lab-01', 'L-M-J'),
((SELECT id FROM materias WHERE codigo = 'ADM1401'), @coordinador_id, '02', '10:00:00', '11:30:00', 'Lab-02', 'M-J-V'),

-- Matemáticas superiores
((SELECT id FROM materias WHERE codigo = 'MAT6009'), @coordinador_id, '01', '14:00:00', '15:30:00', 'Aula-101', 'L-M-J'),
((SELECT id FROM materias WHERE codigo = 'MAT6009'), @coordinador_id, '02', '16:00:00', '17:30:00', 'Aula-102', 'M-J-V'),

-- Mercadotecnia
((SELECT id FROM materias WHERE codigo = 'MER4303'), @coordinador_id, '01', '09:00:00', '10:30:00', 'Aula-201', 'L-M-J');

-- ========================================
-- VERIFICACIÓN
-- ========================================
SELECT
    s.seccion,
    m.nombre as materia,
    m.codigo,
    u.nombre_usuario as profesor,
    TIME_FORMAT(s.hora_inicio, '%H:%i') as hora_inicio,
    TIME_FORMAT(s.hora_fin, '%H:%i') as hora_fin,
    s.aula,
    s.dias_clase,
    COUNT(e.alumno_id) as estudiantes_inscritos
FROM secciones s
JOIN materias m ON s.materia_id = m.id
JOIN usuarios u ON s.profesor_id = u.id
LEFT JOIN enrolamiento e ON s.id = e.seccion_id AND e.estatus = 'activo'
GROUP BY s.id
ORDER BY m.nombre, s.seccion;