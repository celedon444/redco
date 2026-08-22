# ADR-001 — Decisión de Arquitectura: Monolito Modular

**Estado**: Aceptado  
**Fecha**: 2026-08  
**Autores**: Equipo REDCO

---

## Contexto

REDCO es un proyecto académico desarrollado por un equipo de 2 personas con alcance de MVP.

Se evaluaron las siguientes alternativas arquitectónicas:

1. Monolito tradicional (sin separación modular)
2. **Monolito Modular** ← seleccionada
3. Microservicios

---

## Decisión

Se adopta una arquitectura de **Monolito Modular** con separación por capas inspirada en Clean Architecture y principios de Arquitectura Hexagonal.

---

## Justificación

| Criterio                     | Monolito Modular |
|------------------------------|------------------|
| Simplicidad operacional      | ✅ Alta           |
| Adecuado para equipo pequeño | ✅ Sí             |
| Separación de responsabilidades | ✅ Por módulo  |
| Testabilidad                 | ✅ Alta           |
| Escalabilidad futura         | ⚠️ Limitada      |
| Complejidad de despliegue    | ✅ Baja           |

Los microservicios fueron descartados por su complejidad operacional innecesaria para un equipo de 2 personas en un proyecto académico.

---

## Consecuencias

- Cada módulo de dominio sigue una separación interna: `domain / application / infrastructure / presentation`.
- La capa `domain` no debe depender de frameworks ni infraestructura.
- Los módulos se comunican entre sí a través de interfaces definidas, no directamente.

---

## Referencias

- Robert C. Martin — Clean Architecture
- Vaughn Vernon — Implementing Domain-Driven Design
