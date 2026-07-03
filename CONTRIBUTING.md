# Guía de Contribución — Gestión, Clean Coding y Automatización

Este documento resume las reglas de flujo de trabajo acordadas por el equipo para
`epn-event-manager` y `epn-instruments-crud`, en el marco del taller de madurez de
software (Gestión ágil + Clean Code + CI/CD).

## 1. Gestión del Backlog

El trabajo de ambos repositorios se gestiona en un único **GitHub Project (Kanban)**
compartido por el equipo, con las columnas: `Backlog` → `Ready` → `In Progress` →
`In Review` → `Done`.

### Tipos de ticket (GitHub Issues)

Cada ticket se etiqueta obligatoriamente con uno de estos tipos:

| Tipo              | Label            | Uso                                            |
|-------------------|------------------|-------------------------------------------------|
| Feature           | `type:feature`   | Nueva funcionalidad visible para el usuario     |
| Bug               | `type:bug`       | Corrección de un comportamiento incorrecto       |
| Technical Debt    | `type:tech-debt` | Refactor, limpieza de code smells, arquitectura |
| Task              | `type:task`      | Documentación, investigación, configuración      |

### Definition of Ready (DoR)

Un ticket puede pasar a `In Progress` solo si cumple:

- Título claro y descripción del problema/objetivo.
- Criterios de aceptación explícitos (lista verificable).
- Repositorio y módulo afectado identificados.

### Definition of Done (DoD)

Un ticket se cierra solo si:

- El código fue revisado y aprobado por al menos un compañero del equipo.
- El pipeline de CI pasó en verde (lint, build, tests, coverage ≥ 80%).
- No introduce code smells conocidos (God Objects, métodos largos, nombres mágicos).
- Está documentado (README, comentarios donde el "por qué" no es obvio, Swagger si aplica).

## 2. Estrategia de ramas

- `main`: siempre desplegable, protegida.
- `develop`: integración de features antes de release.
- `feature/<ticket-id>-<descripcion-corta>`: una rama por ticket.
- **Prohibido el push directo a `main` o `develop`.** Todo cambio entra por Pull Request.

## 3. Pull Requests

- Se abre un PR formal usando la plantilla de `.github/pull_request_template.md`.
- El merge queda bloqueado automáticamente si:
  - El pipeline de CI falla (lint, build, test o coverage).
  - No cuenta con al menos 1 aprobación de revisión técnica de otro integrante.
- Preferir *squash merge* para mantener un historial limpio en `main`/`develop`.

## 4. Pipeline de Integración Continua

Cada repositorio (`epn-event-manager`, `epn-instruments-crud`) tiene su propio workflow
de GitHub Actions (`.github/workflows/ci-*.yml`) que ejecuta, en orden:

1. **Lint** — estilo de código (ESLint + Prettier).
2. **Build** — compilación TypeScript (`nest build`).
3. **Test** — pruebas unitarias con Jest.
4. **Coverage Check** — falla si la cobertura de la lógica de negocio (`*.service.ts`,
   `*.mapper.ts`) baja del 80%.

## 5. Logging

Todos los servicios usan un logger estructurado (`AppLogger`) con niveles
`DEBUG` / `INFO` / `WARN` / `ERROR` y timestamp ISO 8601, en vez de `console.log`
directo. Nunca se registran datos sensibles en texto plano.
