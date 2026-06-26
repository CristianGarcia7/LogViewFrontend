# Radius & Strokes — OP Brand Guideline

---

## Border Radius

```
radius-2:         2px    → micro-elementos, checkboxes
radius-4:         4px    → tags, keyboard keys
radius-6:         6px    → tooltips, dropdown items
radius-8:         8px    → inputs, botones sm, cards densas  ← estándar UI
radius-10:       10px    → botones md/lg
radius-12:       12px    → cards, modales, secciones         ← estándar container
radius-16:       16px    → drawers, flotantes destacados
radius-24:       24px    → modales grandes, hero sections
radius-32:       32px    → elementos decorativos
radius-infinite: 9999px  → pills, avatares, círculos
```

### Regla nested
`outer_radius − padding = inner_radius`
Ejemplo: container `radius-16` + `padding-8` → hijo interno usa `radius-8`.

### Regla de consistencia
No mezcles `radius-8` y `radius-10` dentro del mismo contexto visual. Elige uno como estándar del componente.

---

## Strokes

```
stroke-none:   0px  → ghost / surfaces (preferir bg-color para separar zonas)
stroke-thin:   1px  → inputs, cards, divisores  ← por defecto
stroke-medium: 2px  → focus states, outline buttons
stroke-thick:  4px  → indicadores de selección fuerte, decorativos
```

### Reglas de uso
- Default siempre es `stroke-thin` (1px).
- Focus/active usa `stroke-medium` (2px).
- Para separar secciones: preferir diferencia de `background-color` sobre agregar un borde.
