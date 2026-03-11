# Guía de Implementación - Gestión de Carreras para Admin

## Resumen de Cambios

He creado una nueva sección de "Gestión de Carreras" para el panel de administrador que permite visualizar todas las carreras, sus planes de estudio y los alumnos inscritos.

---

## Archivos Creados

### 1. **Tipos TypeScript** - `src/types/Carrera.ts`
Define las interfaces para:
- `Carrera` - Información básica de carrera
- `PlanEstudio` - Planes de estudio asociados
- `Alumno` - Datos de alumnos enrollados

### 2. **Service** - `src/data/carrerasService.ts`
Funciones para consumir la API:
- `getCarreras()` - Obtiene todas las carreras
- `getPlanesByCarrera(carreraId)` - Obtiene planes por carrera
- `getAlumnosByCarrera(carreraId)` - Obtiene alumnos por carrera

### 3. **Hooks** - `src/hooks/useCarreras.ts`
Hooks personalizados para manejo de estado:
- `useCarreras()` - Carga y maneja carreras
- `usePlanesByCarrera()` - Carga planes para una carrera
- `useAlumnosByCarrera()` - Carga alumnos para una carrera

### 4. **Componente** - `src/components/CarrerasList.tsx`
Componente React que:
- Muestra lista de carreras
- Permite expandir carrera para ver planes y alumnos
- Sub-componentes: PlanesList y AlumnosList

### 5. **Estilos** - `src/components/CarrerasList.module.css`
Estilos CSS modulares con:
- Diseño responsive
- Tablas bien formateadas
- Estados visuales para planes activos/inactivos

### 6. **Rutas Backend** - `api/routes/carreras.routes.js`
Endpoints Express:
- `GET /api/carreras` - Todas las carreras
- `GET /api/carreras/planes?carrera_id=X` - Planes por carrera
- `GET /api/carreras/alumnos?carrera_id=X` - Alumnos por carrera

---

## Cambios Realizados

### AdminDashboard.tsx
```typescript
// Agregado import
import { CarrerasList } from "../components/CarrerasList"

// Nuevo elemento en menuItems
{ label: "Gestión de Carreras", icon: "fa-graduation-cap", 
  onClick: () => setSeccionActual("carreras") }

// Nueva sección condicional
{seccionActual === "carreras" && (
  <div className={styles.seccion}>
    <h1>Gestión de Carreras</h1>
    <p>Visualiza todas las carreras, sus planes de estudio y los alumnos inscritos.</p>
    <CarrerasList />
  </div>
)}
```

### server.js
```javascript
// Importar rutas de carreras
import carrerasRoutes from './routes/carreras.routes.js'

// Registrar las rutas
app.use('/api/carreras', carrerasRoutes)
```

---

## Estructura de Datos

### Carrera
```json
{
  "id": 1,
  "nombre": "Ingeniería en Sistemas y Negocios Digitales",
  "abreviatura": "ISND"
}
```

### Plan de Estudio
```json
{
  "id": 1,
  "nombre": "Plan 2020",
  "carrera_id": 1,
  "estatus": true
}
```

### Alumno
```json
{
  "id": 4,
  "nombre_usuario": "alumno1",
  "correo": "alumno1@example.com",
  "matricula": "2020-ISND-001",
  "plan_id": 1,
  "estatus_academico": "inscrito",
  "generacion": "2020-2024"
}
```

---

## Funcionalidad

### Para el Administrador:

1. **Visualizar Carreras:** Lista de todas las carreras con abreviatura
2. **Expandir Carrera:** Al hacer click en una carrera se expanden dos secciones
3. **Ver Planes:** Tabla de planes de estudio (nombre, estado: Activo/Inactivo)
4. **Ver Alumnos:** Tabla con datos de alumnos inscritos:
   - Matrícula
   - Nombre
   - Correo
   - Estatus académico
   - Generación
5. **Búsqueda Visual:** Las carreras son collapsibles/expandibles

---

## Consultas de Base de Datos

### GET /api/carreras
```sql
SELECT * FROM carreras
```

### GET /api/carreras/planes?carrera_id=1
```sql
SELECT * FROM planes_estudio WHERE carrera_id = ?
```

### GET /api/carreras/alumnos?carrera_id=1
```sql
SELECT u.*, a.matricula, a.plan_id, a.estatus_academico, a.generacion, a.escuela_procedencia
FROM usuarios u
JOIN alumnos a ON u.id = a.id_alumno
JOIN planes_estudio p ON a.plan_id = p.id
WHERE p.carrera_id = ?
```

---

## Cómo Usar

### En el Panel Admin:

1. Inicia sesión como administrador
2. En el sidebar, haz click en "Gestión de Carreras"
3. Se cargarán automáticamente todas las carreras
4. Haz click en una carrera para expandir y ver:
   - Planes de estudio
   - Alumnos inscritos con sus datos

---

## Notas Técnicas

- **React Hooks:** Usa useState para manejar carreras seleccionadas
- **Llamadas API:** Fetch con async/await
- **Manejo de Errores:** Mensajes de carga y error en cada sección
- **Modularidad:** Componentes reutilizables y separados
- **CSS Modules:** Estilos encapsulados por componente
- **TypeScript:** Tipado fuerte en todos los componentes

---

## Siguientes Pasos Opcionales

Si quieres mejorar aún más esta funcionalidad, podrías:

1. **Agregar Filtros:** Filtrar por estatus, generación, etc.
2. **Exportar Datos:** Opción para descargar información en CSV/Excel
3. **Editar Carreras:** Formularios para crear/editar/eliminar carreras
4. **Gráficos:** Estadísticas visuales (cantidad de alumnos por carrera)
5. **Búsqueda:** Buscador de alumnos específicos
6. **Paginación:** Si hay muchos registros, añadir paginación

---

**¡La funcionalidad está lista para usar!**
