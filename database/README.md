# REDCO — Base de Datos

Esta carpeta complementa la gestión de base de datos del proyecto.

---

## Tecnología

- **Motor**: PostgreSQL + PostGIS
- **ORM**: Prisma (ubicado en `backend/prisma/`)

---

## Estructura

```
database/
├── migrations/   → Migraciones SQL manuales (si aplica)
├── seeds/        → Scripts de datos iniciales
└── README.md
```

> **Nota**: Las migraciones principales se generan y gestionan con Prisma desde el directorio `backend/prisma/`.
> Esta carpeta puede usarse para migraciones SQL adicionales o scripts de inicialización.

---

## Estado

🟡 **Pendiente** — El esquema de base de datos se definirá en la siguiente fase.
