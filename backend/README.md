# REDCO — Backend

API REST desarrollada con NestJS + TypeScript + Prisma.

---

## Arquitectura de módulos

```
src/
├── modules/
│   ├── identity/       → Usuarios, auth, roles
│   ├── reports/        → Reportes ciudadanos
│   ├── incidents/      → Gestión de incidentes
│   ├── people/         → Personas desaparecidas/localizadas
│   ├── organizations/  → Organizaciones participantes
│   ├── units/          → Unidades de respuesta
│   ├── assignments/    → Asignación de unidades
│   ├── geography/      → Ubicaciones geográficas
│   ├── evidence/       → Archivos adjuntos
│   └── audit/          → Trazabilidad
├── shared/             → Utilidades compartidas entre módulos
├── config/             → Configuración centralizada
├── app.module.ts       → Módulo raíz
└── main.ts             → Entry point
```

Cada módulo sigue la separación:

```
module/
├── domain/         → Entidades y puertos (sin dependencias de framework)
├── application/    → Casos de uso
├── infrastructure/ → Repositorios, adaptadores externos
└── presentation/   → Controllers, DTOs
```

---

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run start:dev
```

## Documentación API

Swagger disponible en: `http://localhost:3000/api/docs`

---

## Prisma

```bash
# Generar cliente
npm run prisma:generate

# Crear migración
npm run prisma:migrate:dev

# Prisma Studio (UI de base de datos)
npm run prisma:studio
```

---

## Estado

🟡 **Pendiente** — Estructura lista. Módulos e implementación en progreso.
