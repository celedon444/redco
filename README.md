# REDCO — Red de Emergencias y Desastres de Colombia

> Proyecto académico — Asignatura: Arquitectura de Software

---

## Descripción

**REDCO** es una plataforma web MVP que permite centralizar, verificar, gestionar y visualizar información relacionada con emergencias y desastres en Colombia.

REDCO **no** es un sistema de prevención ni reemplaza los sistemas oficiales de emergencia. Su propósito es facilitar la gestión y consulta de información durante y después de una emergencia.

---

## Módulos principales

| Módulo          | Descripción                                                    |
|-----------------|----------------------------------------------------------------|
| `identity`      | Usuarios, autenticación, autorización y roles                  |
| `reports`       | Reportes ciudadanos                                            |
| `incidents`     | Gestión de incidentes                                          |
| `people`        | Personas desaparecidas o localizadas                           |
| `organizations` | Organizaciones participantes                                   |
| `units`         | Unidades de respuesta                                          |
| `assignments`   | Asignación de unidades a incidentes                            |
| `geography`     | Ubicaciones e información geográfica                           |
| `evidence`      | Fotografías y archivos adjuntos                                |
| `audit`         | Trazabilidad y registro de acciones                            |

---

## Stack tecnológico

| Capa           | Tecnología                                   |
|----------------|----------------------------------------------|
| Frontend       | React, Vite, TypeScript, Tailwind CSS        |
| Backend        | NestJS, TypeScript, REST, Swagger/OpenAPI    |
| Base de datos  | PostgreSQL + PostGIS                         |
| ORM            | Prisma                                       |
| Autenticación  | JWT, Passport, Argon2                        |
| Mapas          | OpenStreetMap + Leaflet                      |
| Testing        | Jest, Supertest, Playwright                  |
| Infraestructura| Docker, Docker Compose, GitHub Actions       |

---

## Arquitectura

**Monolito Modular** con separación por capas:

```
Presentation
    ↓
Application
    ↓
Domain
    ↓
Infrastructure
```

Principios aplicados: Clean Architecture, alta cohesión, bajo acoplamiento, inversión de dependencias, testabilidad.

---

## Estructura del proyecto

```
redco/
├── frontend/       → SPA React + Vite + TypeScript + Tailwind CSS
├── backend/        → API REST NestJS
├── database/       → Migraciones y seeds
├── docs/           → Documentación técnica y arquitectónica
├── .github/        → GitHub Actions (CI/CD)
├── docker-compose.yml
└── README.md
```

---

## Inicio rápido

> ⚠️ Pendiente de configuración. Ver secciones `frontend/README.md` y `backend/README.md`.

```bash
# Levantar entorno de desarrollo con Docker
docker-compose up -d
```

---

## Equipo

Proyecto desarrollado por 2 desarrolladores como parte de la asignatura **Arquitectura de Software**.

---

## Estado

🟡 **En construcción** — Estructura inicial creada. Implementación en progreso.
