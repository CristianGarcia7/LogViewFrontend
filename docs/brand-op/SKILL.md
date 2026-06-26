---
name: brand-op
description: >
  Genera interfaces gráficas (componentes React/HTML, mockups, fragmentos CSS/Tailwind)
  siguiendo al 100% el Brand Guideline de Omnicom Production (OP Mode — dark).

  Usa esta skill SIEMPRE que el usuario pida: crear o diseñar un componente, una pantalla,
  un layout, una card, un modal, un badge, un botón, una tabla, un formulario, o cualquier
  elemento visual. También úsala cuando el usuario mencione "brand guideline", "tokens",
  "modo OP", "nuestros estilos", "OP style", "Omnicom Production UI", o pida que algo
  "siga los lineamientos visuales", "respete los tokens" o "use nuestros colores".

  NUNCA hardcodees colores, tamaños ni tiempos sin referenciar los tokens de esta skill.
  Cita el token fuente en un comentario inline en cada valor visual que uses.
---

# Brand-OP — Brand Guideline de Omnicom Production

Antes de generar cualquier elemento visual, lee los archivos de referencia relevantes
para el trabajo en cuestión. Este documento es el índice y los principios base.

---

## Principios

| Principio | Regla |
|-----------|-------|
| **Dark-first** | El sistema es oscuro. `level_1` (`#080808`) es el canvas base. |
| **Jerarquía de superficies** | Usa `level_0` → `level_6` para crear profundidad. Nunca inventes un gris fuera de la escala. |
| **Shine doctrine** | Animaciones en dos capas: fondo/glow lento (400ms), contenido rápido (300ms). |
| **Sin inline styles** | Todo se resuelve con tokens. Cita el token en comentario inline. |
| **Radius nested** | `outer_radius − padding = inner_radius`. |
| **Consistencia de radius** | No mezcles radius-8 y radius-10 en el mismo contexto visual. |
| **3 estados mínimos** | Todo componente tiene: `loading`, `error`, y `content/empty`. |

---

## Índice de referencias

Lee el archivo correspondiente según lo que vayas a construir:

| Archivo | Cuándo leerlo |
|---------|---------------|
| `references/colors.md` | Cualquier elemento con color: superficies, marca, transparencias, botones, strokes |
| `references/typography.md` | Texto, labels, headings, CTAs, captions |
| `references/spacing.md` | Padding, gap, márgenes de cualquier componente o container |
| `references/radius-strokes.md` | Border radius y grosor de bordes |
| `references/grid-layout.md` | Layout de página, columnas, sidebar, max-widths |
| `references/motion.md` | Transiciones, animaciones, Shine Doctrine, easing |

---

## Checklist antes de emitir código

- [ ] Leí los archivos de referencia relevantes para este componente
- [ ] Colores → tokens de `colors.md`. Comentario inline en cada valor
- [ ] Tipografía → `typography.md`. Font Mulish siempre
- [ ] Spacing → `spacing.md`. Sin valores arbitrarios
- [ ] Radius → `radius-strokes.md`. Aplicar nested radius
- [ ] Animaciones → `motion.md`. Respetar Shine Doctrine
- [ ] 3 estados implementados: `loading`, `error`, `content/empty`
- [ ] `prefers-reduced-motion` presente si hay animaciones
