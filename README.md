# REDCO — Red de Emergencias y Desastres de Colombia

> Proyecto académico — Asignatura: Arquitectura de Software

[![CI](https://github.com/tu-org/redco/actions/workflows/ci.yml/badge.svg)](https://github.com/tu-org/redco/actions)

---

## Descripción

**REDCO** es una plataforma web MVP que permite centralizar, verificar, gestionar y visualizar información relacionada con emergencias y desastres en Colombia.

REDCO **no** es un sistema de prevención ni reemplaza los sistemas oficiales de emergencia. Su propósito es facilitar la gestión y consulta de información durante y después de una emergencia.

---

## Requisitos previos

| Herramienta | Versión mínima | Uso |
|-------------|----------------|-----|
| [Node.js](https://nodejs.org) | 20.x LTS | Frontend y Backend |
| [npm](https://npmjs.com) | 10.x | Gestor de paquetes |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 4.x | Base de datos (PostgreSQL + PostGIS) |
| [Git](https://git-scm.com) | 2.x | Control de versiones |

---

## Instalación desde cero

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-org/redco.git
cd redco
```

### 2. Configurar variables de entorno

```bash
# Raíz del proyecto (Docker Compose)
cp .env.example .env

# Backend (desarrollo local)
cp backend/.env.example backend/.env
```

> **Importante:** Revisa los valores de `.env` y `backend/.env` antes de continuar.
> Los valores por defecto son suficientes para desarrollo local.

### 3. Levantar la base de datos

```bash
docker compose up postgres -d
```

Verifica que PostgreSQL esté corriendo:

```bash
docker compose ps
# Debe mostrar: redco_postgres   running (healthy)
```

### 4. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 5. Generar el cliente Prisma

```bash
# Dentro de backend/
npx prisma generate
```

> En este punto el schema todavía no tiene modelos de dominio.
> Se definirán en el siguiente bloque.

### 6. Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

---

## Cómo iniciar el proyecto en desarrollo

### Backend

```bash
cd backend
npm run start:dev
```

- API disponible en: `http://localhost:3000/api`
- Swagger (docs): `http://localhost:3000/api/docs`

### Frontend

```bash
cd frontend
npm run dev
```

- Aplicación disponible en: `http://localhost:5173`
- Las llamadas a `/api` se proxean automáticamente al backend (configurado en `vite.config.ts`)

---

## Comandos principales

### Docker

```bash
# Levantar solo la base de datos (flujo recomendado en desarrollo)
docker compose up postgres -d

# Ver estado de los servicios
docker compose ps

# Ver logs de PostgreSQL
docker compose logs postgres -f

# Detener servicios
docker compose down

# Detener y borrar volúmenes (reset de base de datos)
docker compose down -v
```

### Backend

```bash
cd backend

npm run start:dev      # Modo desarrollo (hot reload)
npm run build          # Compilar para producción
npm run lint           # Revisar código con ESLint
npm run test           # Ejecutar tests unitarios
npm run test:cov       # Tests con cobertura
npm run test:e2e       # Tests de integración

# Prisma
npx prisma generate            # Generar cliente Prisma
npx prisma migrate dev         # Crear y ejecutar migración
npx prisma migrate deploy      # Aplicar migraciones en producción
npx prisma studio              # Interfaz visual de la base de datos
```

### Frontend

```bash
cd frontend

npm run dev            # Modo desarrollo
npm run build          # Build de producción
npm run preview        # Preview del build
npm run lint           # ESLint
npm run type-check     # Verificación de tipos TypeScript
npm run test           # Tests unitarios con Vitest
npm run test:e2e       # Tests E2E con Playwright
```

---

## Estructura del proyecto

```
redco/
├── frontend/           → SPA React + Vite + TypeScript + Tailwind CSS
│   └── src/
│       ├── components/ → Componentes reutilizables
│       ├── pages/      → Páginas de la aplicación
│       ├── routes/     → Configuración de rutas
│       ├── services/   → Clientes HTTP (axios)
│       ├── hooks/      → Custom hooks
│       ├── types/      → Tipos TypeScript
│       └── utils/      → Utilidades
│
├── backend/            → API REST NestJS + TypeScript + Prisma
│   ├── prisma/         → Schema y migraciones de Prisma
│   └── src/
│       ├── modules/    → Módulos de dominio (10 módulos)
│       ├── shared/     → Servicios compartidos (Prisma, Guards, etc.)
│       ├── config/     → Configuración centralizada
│       ├── app.module.ts
│       └── main.ts
│
├── database/           → Seeds y migraciones SQL adicionales
├── docs/               → Documentación técnica y ADRs
├── .github/            → GitHub Actions (CI/CD)
├── docker-compose.yml  → Entorno de desarrollo
├── .env.example        → Plantilla de variables de entorno
└── README.md
```

### Módulos del backend

| Módulo | Responsabilidad |
|--------|-----------------|
| `identity` | Usuarios, autenticación, roles |
| `reports` | Reportes ciudadanos |
| `incidents` | Gestión de incidentes |
| `people` | Personas desaparecidas/localizadas |
| `organizations` | Organizaciones participantes |
| `units` | Unidades de respuesta |
| `assignments` | Asignación de unidades a incidentes |
| `geography` | Ubicaciones geográficas |
| `evidence` | Archivos adjuntos (fotografías, etc.) |
| `audit` | Trazabilidad de acciones |

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, Vite 5, TypeScript 5, Tailwind CSS 3 |
| Backend | NestJS 10, TypeScript 5, REST API, Swagger/OpenAPI |
| Base de datos | PostgreSQL 16 + PostGIS 3.4 |
| ORM | Prisma 5 |
| Autenticación | JWT, Passport, Argon2 *(bloque posterior)* |
| Mapas | OpenStreetMap + Leaflet *(bloque posterior)* |
| Testing | Jest, Supertest, Playwright, Vitest |
| Infraestructura | Docker, Docker Compose, GitHub Actions |

---

## Variables de entorno

### Raíz del proyecto (`.env`)

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `POSTGRES_USER` | Usuario de PostgreSQL | `redco` |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `redco_secret` |
| `POSTGRES_DB` | Nombre de la base de datos | `redco_db` |
| `POSTGRES_PORT` | Puerto expuesto de PostgreSQL | `5432` |
| `BACKEND_PORT` | Puerto del backend | `3000` |
| `FRONTEND_PORT` | Puerto del frontend | `5173` |

### Backend (`backend/.env`)

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión Prisma a PostgreSQL |
| `PORT` | Puerto del servidor NestJS |
| `NODE_ENV` | Entorno de ejecución |
| `FRONTEND_URL` | URL del frontend (para CORS) |
| `JWT_SECRET` | Secreto JWT *(se usará en bloque de autenticación)* |

---

## Flujo de trabajo recomendado (equipo de 2 desarrolladores)

```bash
# 1. Pull de cambios
git pull

# 2. Si hubo cambios en backend/package.json
cd backend && npm install

# 3. Si hubo nuevas migraciones de Prisma
npx prisma migrate dev

# 4. Levantar base de datos
docker compose up postgres -d

# 5. Iniciar backend y frontend en terminales separadas
npm run start:dev   # desde backend/
npm run dev         # desde frontend/
```

---

## Estado del proyecto

| Bloque | Estado |
|--------|--------|
| Bloque 1 — Fundación técnica | ⚠️ Fundación técnica implementada — validación local/CI pendiente |
| Bloque 2 — Modelo de datos | ⬜ Pendiente |
| Bloque 3 — Módulos funcionales | ⬜ Pendiente |
| Bloque 4 — Frontend funcional | ⬜ Pendiente |
| Bloque 5 — Autenticación | ⬜ Pendiente |
| Bloque 6 — Testing | ⬜ Pendiente |
| Bloque 7 — Despliegue | ⬜ Pendiente |

---

## Equipo

Proyecto desarrollado por 2 desarrolladores como parte de la asignatura **Arquitectura de Software**.
