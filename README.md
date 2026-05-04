# SIEX — Sistema de Expediente Académico

Sistema web de gestión académica desarrollado para el IEST (Instituto de Estudios Superiores). Permite administrar alumnos, carreras, planes de estudio, materias, reportes académicos y comunicación interna entre coordinadores y alumnos.

---
# Equipo
Carlos Arturo Gonzalez Garza
Pablo Arturo Govea Briones
Pedro Dominguez Martinez
Gael Ramirez Castillo
Daniel del Angel Aranda

## Tecnologías utilizadas

**Frontend**
- React 19 con TypeScript
- Vite (bundler)
- CSS Modules para estilos por componente
- @dnd-kit para drag & drop en el constructor de planes

**Backend**
- Node.js con Express 5
- MySQL2 como driver de base de datos
- JWT (jsonwebtoken) para autenticación
- bcryptjs para hash de contraseñas

**Despliegue**
- Frontend desplegado en Vercel
- Base de datos MySQL en servidor externo

---

## Roles del sistema

El sistema maneja tres tipos de usuario, cada uno con su propio dashboard y permisos:

| Rol | Descripción |
|---|---|
| `alumno` | Consulta su kardex, materias, anuncios y chat con coordinador |
| `coordinador` | Gestiona alumnos de su carrera, genera reportes, publica anuncios y atiende el chat |
| `admin` | Administración completa: usuarios, carreras y planes de estudio |

---

## Estructura del proyecto

```
dwa2/
├── api/                          # Backend (Express)
│   ├── config/
│   │   └── db.js                 # Conexión al pool de MySQL
│   ├── middleware/
│   │   └── auth.js               # Middleware de verificación JWT
│   └── routes/
│       ├── auth.routes.js        # Login y registro
│       ├── usuarios.routes.js    # CRUD de usuarios
│       ├── carreras.routes.js    # CRUD de carreras, planes y materias
│       ├── coordinador.routes.js # Endpoints del coordinador
│       ├── chat.routes.js        # Mensajería interna
│       └── anuncios.routes.js    # Publicación y consulta de anuncios
│
└── src/                          # Frontend (React + TypeScript)
    ├── assets/                   # Imágenes y recursos estáticos
    ├── components/               # Componentes reutilizables
    ├── contexts/                 # Contextos de React (tema, auth)
    ├── data/                     # Servicios de llamadas a la API
    ├── hooks/                    # Custom hooks
    ├── pages/                    # Páginas principales por rol
    └── types/                    # Tipos TypeScript compartidos
```

---

## Funcionalidades por módulo

### Autenticación
- Login con usuario y contraseña
- Tokens JWT con expiración de 2 horas
- Rutas protegidas según rol en frontend y backend

### Dashboard del Alumno
- **Inicio:** datos personales, carrera, plan de estudios y estatus académico con foto de perfil
- **Mi Kardex:** plan de estudios visualizado por semestre con el avance de cada materia (aprobada, cursando, por cursar, reprobada)
- **Lista de materias:** materias agrupadas por estatus
- **Anuncios:** comunicados publicados por los coordinadores
- **Chat:** mensajería directa con el coordinador académico

### Dashboard del Coordinador
- **Inicio:** estadísticas de la carrera (alumnos activos, materias, secciones)
- **Alumnos:** tabla con todos los alumnos de la carrera y acceso al detalle académico individual
- **Detalle de alumno:** editor de estatus, calificación y periodo por materia; y vista de kardex resumido por columnas
- **Gestión de Carreras:** consulta de carreras y editor interactivo de planes de estudio con drag & drop
- **Materias:** tabla de materias disponibles en la carrera con semestre sugerido y origen
- **Reportes académicos:** cuatro tipos de reporte con filtros, búsqueda, ordenamiento y paginación:
  - Inscripciones por periodo
  - Rendimiento académico por semestre
  - Historial de bajas (deserción) por año
  - Tasas de aprobación por materia
- **Anuncios:** publicación y eliminación de comunicados hacia alumnos de una carrera o de todas
- **Chat:** bandeja de conversaciones con los alumnos de la carrera

### Dashboard del Administrador
- **Usuarios:** crear, editar y eliminar usuarios de cualquier rol; editar datos personales y asignar carrera/plan a alumnos
- **Carreras:** crear, editar y eliminar carreras del sistema
- **Planes de Estudio (PlanesBuilder):** editor visual con drag & drop para distribuir materias por semestre dentro de un plan

---

## API — Rutas principales

| Método | Ruta | Descripción | Auth requerida |
|---|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión | No |
| GET | `/api/usuarios` | Listar usuarios | Sí |
| POST | `/api/usuarios` | Crear usuario | Sí |
| PUT | `/api/usuarios/:id` | Editar usuario | Sí |
| DELETE | `/api/usuarios/:id` | Eliminar usuario (soft-delete para alumnos) | Sí |
| GET | `/api/carreras` | Listar carreras | No |
| GET | `/api/coordinador/alumnos` | Alumnos de la carrera | Sí (coordinador/admin) |
| PUT | `/api/coordinador/avance/:carreraId/:alumnoId/:materiaId` | Actualizar avance de materia | Sí |
| GET | `/api/coordinador/reportes/:tipo` | Reportes académicos | Sí |
| GET | `/api/chat/conversaciones` | Conversaciones del usuario | Sí |
| POST | `/api/chat/mensajes` | Enviar mensaje | Sí |
| GET | `/api/anuncios` | Listar anuncios | Sí |
| POST | `/api/anuncios` | Publicar anuncio | Sí (coordinador) |

---

## Cómo ejecutar el proyecto localmente

### Requisitos
- Node.js 18+
- MySQL 8+

### 1. Configurar la base de datos

Ejecutar el script SQL incluido en `/aScripts/base_datos_completa.sql` para crear el esquema y los datos iniciales.

### 2. Backend

```bash
cd dwa2/api
npm install
```

Crear un archivo `.env` en `dwa2/api/` con las siguientes variables:

```env
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=siex
JWT_SECRET=una_clave_segura
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

```bash
node server.js
```

### 3. Frontend

```bash
cd dwa2
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## Base de datos

El esquema incluye las siguientes tablas principales:

| Tabla | Descripción |
|---|---|
| `usuarios` | Datos de acceso de todos los usuarios del sistema |
| `alumnos` | Datos extendidos del alumno (matrícula, generación, estatus) |
| `coordinadores` | Datos extendidos del coordinador (oficina, especialidad) |
| `carreras` | Catálogo de carreras del instituto |
| `planes_estudio` | Planes de estudio asociados a cada carrera |
| `materias` | Catálogo global de materias |
| `carrera_materias` | Relación entre carrera y sus materias con semestre sugerido |
| `alumno_carrera` | Asignación de alumno a su carrera |
| `alumno_materias` | Avance académico del alumno por materia (estatus, calificación, periodo) |
| `inscripciones` | Historial de inscripciones por alumno y periodo |
| `bajas` | Registro de bajas académicas |
| `conversaciones` / `mensajes` | Sistema de chat interno |
| `anuncios` | Comunicados publicados por coordinadores |

---

## Autores

Desarrollado como proyecto académico — IEST 2026.
