# Ticket Manager - Backend

Sistema de gestión de tickets de soporte con reportería en Excel. Backend desarrollado con NestJS, TypeORM y PostgreSQL.

## Stack

- **TypeScript** + **NestJS** (framework backend)
- **TypeORM** (ORM con migraciones)
- **PostgreSQL 16** (base de datos)
- **JWT** (autenticación sin estado)
- **ExcelJS** (generación de reportes `.xlsx`)
- **Swagger** (documentación de API)
- **Docker Compose** (entorno de desarrollo)

## Requisitos

- Node.js 20+
- Docker Desktop con Docker Compose v2

## Instalación y ejecución

### 1. Clonar e instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` si es necesario. Las credenciales por defecto son:

| Variable | Valor por defecto | Nota |
|----------|-------------------|------|
| `DATABASE_HOST` | `localhost` | `localhost` para desarrollo local, `postgres` en Docker |
| `DATABASE_PORT` | `5432` | |
| `POSTGRES_USER` | `postgres` | |
| `POSTGRES_PASSWORD` | `postgres` | |
| `POSTGRES_DB` | `ticket_manager` | |
| `JWT_SECRET` | (cambiar en producción) | |
| `JWT_EXPIRATION` | `24h` | |
| `PORT` | `3000` | |
| `ADMIN_EMAIL` | `admin@ticket-manager.com` | |
| `ADMIN_PASSWORD` | `Admin123!` | |

> **Importante:** El `docker-compose.yml` sobrescribe `DATABASE_HOST=postgres` al ejecutar en Docker.
> No modifiques `.env` para Docker — el compose se encarga de los valores correctos para el contenedor.

### 3. Levantar el entorno con Docker

```bash
# Construir imágenes
npm run docker:build

# Iniciar servicios (postgres + app)
npm run docker:up

# Ver logs
npm run docker:logs

# Detener servicios
npm run docker:down
```

El backend estará disponible en `http://localhost:3000`.

### 4. Desarrollo local (sin Docker para la app)

```bash
# La base de datos sigue en Docker
docker compose up -d postgres

# Asegurar que .env tenga DATABASE_HOST=localhost
# Luego iniciar NestJS con hot-reload
npm run start:dev
```

> **Nota:** `docker compose up -d postgres` levanta solo la BD. Si Docker ya está corriendo
> la app también, detenela primero: `docker compose stop app`

## Credenciales del admin seed

Al iniciar la aplicación, se crea automáticamente un usuario administrador:

- **Email:** `admin@ticket-manager.com`
- **Password:** `Admin123!`

## Documentación Swagger

Disponible en: `http://localhost:3000/api/docs`

## Endpoints

### Auth

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Registrar nuevo usuario |
| POST | `/auth/login` | No | Iniciar sesión (retorna JWT) |
| POST | `/auth/register/admin` | Admin | Crear nuevo administrador |

### Users

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/users/profile` | JWT | Obtener perfil del usuario |
| PATCH | `/users/profile` | JWT | Actualizar perfil |

### Tickets

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/tickets` | JWT | Crear ticket |
| GET | `/tickets` | JWT | Listar tickets (paginado, filtros) |
| GET | `/tickets/stats` | JWT | Dashboard (totales por estado + 5 recientes) |
| GET | `/tickets/:id` | JWT | Ver detalle de ticket |
| PATCH | `/tickets/:id/status` | JWT | Cambiar estado |

**Filtros soportados en `GET /tickets`:**
- `status` — `OPEN`, `IN_PROGRESS`, `CLOSED`
- `page` — número de página (default: 1)
- `limit` — resultados por página (default: 10)

### Reports

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/reports/tickets/export` | JWT | Exportar tickets a Excel (.xlsx) |
| GET | `/reports/tickets/:id/export` | JWT | Exportar detalle de un ticket |

**Filtros para exportación:**
- `status` — filtrar por estado
- `startDate` — fecha inicio (`YYYY-MM-DD`)
- `endDate` — fecha fin (`YYYY-MM-DD`)

## Roles y permisos

| Rol | Permisos |
|-----|----------|
| `USER` | Crear, ver y actualizar sus propios tickets |
| `ADMIN` | Ver y actualizar todos los tickets. Crear otros admins. |

## Estructura del proyecto

```
src/
├── config/              # Configuración centralizada
├── common/              # Componentes compartidos
│   ├── decorators/      # @CurrentUser, @Roles
│   ├── enums/           # UserRole, TicketStatus, TicketPriority
│   ├── exceptions/      # CustomException
│   ├── filters/         # HttpExceptionFilter global
│   ├── guards/          # RolesGuard
│   └── interceptors/    # ResponseInterceptor (formato estandarizado)
├── database/            # Config TypeORM, migraciones, seeds
├── modules/
│   ├── auth/            # Autenticación (registro, login, JWT)
│   ├── users/           # Perfil de usuario
│   ├── tickets/         # CRUD de tickets + estadísticas
│   └── reports/         # Exportación a Excel
├── app.module.ts
└── main.ts
```

## Decisiones de arquitectura

- **DTOs con `class-validator`** para validación de entrada en todos los endpoints.
- **JWT sin refresh token** — expiración de 24h configurable.
- **Manejo centralizado de errores** mediante `HttpExceptionFilter` global.
- **Formato estandarizado de respuestas** con `ResponseInterceptor`: `{ statusCode, message, data, timestamp, path }`.
- **Migraciones TypeORM** en lugar de `synchronize: true` (entorno productivo).
- **Seed automático** del admin al iniciar la aplicación.
- **Módulo `reports` separado** — la lógica de exportación Excel está aislada del módulo de tickets.

## Reportes Excel

El archivo generado incluye:
- **Hoja 1 — Tickets:** tabla con ID, Título, Descripción, Usuario, Email, Prioridad, Estado, Fecha de creación y actualización. Filas coloreadas según prioridad y estado.
- **Hoja 2 — Estadísticas:** resumen con total de tickets, distribución por estado y por prioridad con porcentajes.

## Comandos disponibles

```bash
npm run start:dev      # Desarrollo con hot-reload
npm run build           # Compilar TypeScript
npm run lint            # ESLint
npm run docker:build    # Construir imágenes Docker
npm run docker:up       # Iniciar servicios
npm run docker:down     # Detener servicios
npm run docker:logs     # Ver logs de todos los servicios
```

## Puerto

- App: `3000`
- PostgreSQL: `5432`
