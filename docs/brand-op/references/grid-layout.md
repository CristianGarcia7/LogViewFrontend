# Grid & Layout — OP Brand Guideline

---

## Sistema de columnas

```
Columns: 12
```
El contenido siempre se alinea a las 12 columnas del contenedor activo.

---

## Containers

```
Container main:   max-width 1376px   → cuando el sidebar NO está presente
Container altern: max-width 1135px   → cuando el sidebar SÍ está presente
```

Con sidebar activo: `width_main = viewport − 141px`.

---

## Márgenes y gutters

```
Margin desktop default:  32px
Margin desktop compact:  24px

Gutter default:          24px
Gutter dense:            16px
```

---

## Sidebar

```
Width:  141px  (fijo, no collapsa)
Gap con contenido: 0px
Margin interno: 32px
Gutter interno: 24px
```

---

## Patrones de layout

### Con sidebar
```css
.layout {
  display: grid;
  grid-template-columns: 141px 1fr;  /* sidebar + contenido */
}
.content {
  max-width: 1135px;
  padding: 0 32px;                   /* margin desktop */
}
```

### Sin sidebar
```css
.content {
  max-width: 1376px;
  margin: 0 auto;
  padding: 0 32px;                   /* margin desktop */
}
```

### Grid de 12 columnas
```css
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;                         /* gutter default */
}
```
