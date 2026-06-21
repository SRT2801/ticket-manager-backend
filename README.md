# Ticket Manager - Backend

Sistema de gestión de tickets de soporte con reportería en Excel. Backend desarrollado con NestJS, TypeORM y PostgreSQL.

## Stack

- **TypeScript** + **NestJS** (framework backend)
- **TypeORM** (ORM con migraciones)
- **PostgreSQL 16** (base de datos)
- **JWT** (autenticación sin estado)
- **ExcelJS** (generacion de reportes `.xlsx`)
- **Nodemailer** (envio de correos)
- **PDFKit** (generacion de PDFs)
- **@nestjs/schedule** (tareas programadas)
- **Swagger** (documentacion de API)
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
| `MAIL_HOST` | `smtp.gmail.com` | Servidor SMTP |
| `MAIL_PORT` | `587` | Puerto SMTP |
| `MAIL_USER` | (requerido) | Email del remitente |
| `MAIL_PASS` | (requerido) | App password de Gmail |
| `MAIL_FROM` | `noreply@ticket-manager.com` | Remitente del correo |

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

- **Email:** `admin@example.com`
- **Password:** `admin123`

## Documentación Swagger

Disponible en: `http://localhost:3000/api`

## Despliegue

- **Backend (Railway):** [ticket-manager-backend-production.up.railway.app](https://ticket-manager-backend-production.up.railway.app)
- **Swagger:** [ticket-manager-backend-production.up.railway.app/api](https://ticket-manager-backend-production.up.railway.app/api)
- **Frontend (Vercel):** [ticket-manager-frontend-ten.vercel.app](https://ticket-manager-frontend-ten.vercel.app/login)

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

| Metodo | Endpoint | Auth | Descripcion |
|--------|----------|------|-------------|
| GET | `/reports/tickets/export` | JWT | Exportar tickets a Excel (.xlsx) |
| GET | `/reports/tickets/:id/export` | JWT | Exportar detalle de un ticket |
| POST | `/reports/send-dashboard` | JWT | Enviar reporte Excel por correo |

**Filtros para exportacion:**
- `status` — filtrar por estado
- `priority` — filtrar por prioridad
- `startDate` — fecha inicio (`YYYY-MM-DD`)
- `endDate` — fecha fin (`YYYY-MM-DD`)

### Reportes programados

El sistema envia automaticamente un reporte Excel semanal a cada usuario registrado:

- **Frecuencia**: Cada lunes a las 8:00 AM
- **Que incluye**: Solo los tickets del usuario (exportados con ExcelJS, mismo formato que `/reports/tickets/export`)
- **Requisito**: Variables SMTP configuradas (`MAIL_USER`, `MAIL_PASS`)
- **Logs**: El scheduler registra en consola el progreso y errores por usuario

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
│   ├── tickets/         # CRUD de tickets + estadisticas
│   ├── reports/          # Exportacion a Excel + envio por correo + scheduler
│   └── mail/             # Servicio de envio de correos
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
- **Modulo `reports` separado** — la logica de exportacion Excel y envio de correos esta aislada del modulo de tickets.
- **Modulo `mail`** — servicio reutilizable para envio de correos con Nodemailer + SMTP.
- **Scheduler semanal** — `@nestjs/schedule` con cron `0 8 * * 1` envia reportes Excel personalizados a cada usuario.

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
