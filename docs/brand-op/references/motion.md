# Motion — OP Brand Guideline

---

## Tokens base

```
fast:     120ms  cubic-bezier(0.2,  0,    0,   1)   ← ui       → press, toggles, checkboxes
standard: 300ms  cubic-bezier(0.2,  0,    0,   1)   ← ui       → base del sistema
slow:     400ms  cubic-bezier(0.16, 1,    0.3, 1)   ← premium  → glow, gradients, modales
story:    600ms  cubic-bezier(0,    0,    0.58,1)   ← editorial → onboarding (raro, intencional)
```

---

## Shine Doctrine

Las animaciones de elementos destacados tienen **dos capas independientes**:

```
Capa 1 — background_glow:  slow(400ms) + premium easing
         Propiedades: background-position, box-shadow, opacity

Capa 2 — content_response: standard(300ms) + ui easing
         Propiedades: color, transform, scale
```

El fondo/glow viaja lento para que el ojo perciba el movimiento del degradado.
El contenido (texto/icono) responde rápido para no sentirse lento.

---

## Propiedades animables

```
✅ opacity · transform · background-position · color · box-shadow
❌ width · height · top · left · margin · padding
```

### Gradient performante

```css
/* Nunca animar background directamente */
background-size: 200% 200%;
background-position: 0% 0%;
transition: background-position 400ms cubic-bezier(0.16,1,0.3,1);

/* En hover: */
background-position: 100% 100%;
```

---

## Displacement (distancias de desplazamiento)

```
micro_shift:      4px   → hover de iconos, pequeños saltos
enter_exit:      16px   → entrada de modales / drawers / toasts
page_transition: 32px   → transiciones entre pantallas
```

---

## Patrones por componente

### Button
```css
/* Press */
transition: transform 120ms cubic-bezier(0.2,0,0,1),
            background-color 120ms cubic-bezier(0.2,0,0,1);

/* Hover — Capa 1: glow */
transition: background-position 400ms cubic-bezier(0.16,1,0.3,1),
            box-shadow 400ms cubic-bezier(0.16,1,0.3,1),
            opacity 400ms cubic-bezier(0.16,1,0.3,1);

/* Hover — Capa 2: content */
transition: color 300ms cubic-bezier(0.2,0,0,1),
            transform 300ms cubic-bezier(0.2,0,0,1);
```

### Card default
```css
transition: transform 300ms cubic-bezier(0.2,0,0,1),
            box-shadow 300ms cubic-bezier(0.2,0,0,1);
```

### Card featured (con gradient)
```css
transition: background-position 400ms cubic-bezier(0.16,1,0.3,1),
            box-shadow 400ms cubic-bezier(0.16,1,0.3,1);
```

### Modal / Drawer
```css
/* Contenedor */
transition: transform 400ms cubic-bezier(0.16,1,0.3,1),
            opacity 400ms cubic-bezier(0.16,1,0.3,1);

/* Overlay backdrop */
transition: opacity 300ms cubic-bezier(0.2,0,0,1);
```

### Dropdown / Accordion
```css
/* Apertura — evitar height: auto */
transition: height 300ms cubic-bezier(0.16,1,0.3,1);

/* Item hover */
transition: background-color 120ms cubic-bezier(0.2,0,0,1);
```

### Tooltip
```css
transition: opacity 120ms cubic-bezier(0.2,0,0,1),
            transform 120ms cubic-bezier(0.2,0,0,1);
```

---

## Accesibilidad (obligatorio en todo componente con animaciones)

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition: opacity 0ms !important;
    animation: none !important;
  }
  /* Excepción: cambios de color puros sin desplazamiento son aceptables */
}
```
