-- Script para actualizar la base de datos con los nuevos campos de datos personales
-- Ejecutar este script después de aplicar los cambios en base_datos_completa.sql

-- Agregar campos a la tabla usuarios
ALTER TABLE usuarios
ADD COLUMN nombre VARCHAR(100) AFTER nombre_usuario,
ADD COLUMN apellido VARCHAR(100) AFTER nombre;

-- Agregar campos a la tabla alumnos
ALTER TABLE alumnos
ADD COLUMN numero_telefono VARCHAR(20) AFTER escuela_procedencia,
ADD COLUMN numero_identificacion VARCHAR(30) AFTER numero_telefono,
ADD COLUMN fecha_nacimiento DATE AFTER numero_identificacion;

-- Agregar campos a la tabla coordinadores
ALTER TABLE coordinadores
ADD COLUMN numero_identificacion VARCHAR(30) AFTER telefono,
ADD COLUMN especialidad VARCHAR(100) AFTER horario_atencion,
ADD COLUMN fecha_nacimiento DATE AFTER especialidad;

-- Verificar que los cambios se aplicaron correctamente
SELECT 'Campos agregados exitosamente' as Estado;