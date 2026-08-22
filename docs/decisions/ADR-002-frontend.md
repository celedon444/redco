# ADR-002 — Decisión de Arquitectura: Stack Frontend

**Estado**: Aceptado  
**Fecha**: 2026-08  
**Autores**: Equipo REDCO

---

## Contexto

El proyecto requiere una interfaz web moderna, responsiva y con soporte para mapas interactivos.

Se evaluaron las siguientes alternativas:

1. **React + Vite + TypeScript + Tailwind CSS** ← seleccionada
2. Next.js
3. Vue.js

---

## Decisión

Se adopta **React con Vite** como herramienta de build, **TypeScript** para tipado estático y **Tailwind CSS** para estilos.

---

## Justificación

| Criterio                     | Razón                                              |
|------------------------------|----------------------------------------------------|
| SPA sin SSR                  | REDCO no requiere SEO ni SSR en el MVP             |
| Vite sobre CRA               | Más rápido, moderno y con mejor DX                 |
| TypeScript                   | Tipado estático, mejor mantenibilidad              |
| Tailwind CSS                 | Productividad alta, sin CSS personalizado extenso  |
| Next.js descartado           | Complejidad innecesaria para el alcance del MVP    |

---

## Consecuencias

- El frontend se desarrolla como SPA desacoplada del backend.
- La comunicación con el backend se realiza exclusivamente a través de la REST API.
- El enrutamiento es gestionado por React Router en el cliente.
- Los mapas se implementan con Leaflet + React Leaflet sobre OpenStreetMap.

---

## Referencias

- Vite Documentation: https://vitejs.dev
- Tailwind CSS Documentation: https://tailwindcss.com
- React Router: https://reactrouter.com
