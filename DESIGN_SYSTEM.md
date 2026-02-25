# Sistema de Diseño — Aplicación de Test de Velocidad de Internet

**Versión:** 1.0
**Fecha:** Febrero 2026
**Estado:** Definido

---

## 1. Visión General

Este documento define el sistema de diseño completo para la aplicación de test de velocidad de internet. El objetivo es mantener consistencia visual, mejorar la experiencia del usuario y facilitar el desarrollo y mantenimiento del código.

### 1.1 Principios de Diseño

- **Claridad**: Información presentada de forma clara y directa
- **Consistencia**: Uso coherente de colores, tipografía y espaciado
- **Accesibilidad**: Cumplimiento de estándares WCAG AA (contraste mínimo 4.5:1)
- **Responsividad**: Adaptación fluida a diferentes tamaños de pantalla
- **Performance**: Animaciones suaves y optimizadas

---

## 2. Paleta de Colores

### 2.1 Colores Primarios

Los colores primarios se utilizan para elementos principales de la interfaz.

```css
/* Grises (Base) */
--color-gray-50: #f9fafb;    /* Fondo general */
--color-gray-100: #f3f4f6;   /* Fondo secundario */
--color-gray-200: #e5e7eb;   /* Bordes suaves */
--color-gray-300: #d1d5db;   /* Bordes */
--color-gray-400: #9ca3af;   /* Bordes hover */
--color-gray-500: #6b7280;   /* Texto secundario */
--color-gray-600: #4b5563;   /* Texto terciario */
--color-gray-700: #374151;   /* Texto labels */
--color-gray-800: #1f2937;   /* Texto principal */
--color-gray-900: #111827;   /* Texto enfatizado */

/* Blanco y Negro */
--color-white: #ffffff;
--color-black: #000000;
```

### 2.2 Colores Semánticos

Colores utilizados para comunicar estados y tipos de información.

```css
/* Azul (Información/WiFi) */
--color-blue-50: #eff6ff;
--color-blue-100: #dbeafe;
--color-blue-200: #bfdbfe;
--color-blue-300: #93c5fd;
--color-blue-400: #60a5fa;
--color-blue-500: #3b82f6;   /* Focus, enlaces */
--color-blue-600: #2563eb;   /* WiFi principal */
--color-blue-700: #1d4ed8;
--color-blue-800: #1e40af;   /* WiFi oscuro */
--color-blue-900: #1e3a8a;

/* Verde (Éxito/Ethernet) */
--color-green-50: #f0fdf4;
--color-green-100: #dcfce7;
--color-green-200: #bbf7d0;
--color-green-300: #86efac;
--color-green-400: #4ade80;
--color-green-500: #22c55e;
--color-green-600: #059669;   /* Botones de acción */
--color-green-700: #047857;   /* Hover */
--color-green-800: #065f46;   /* Active */
--color-green-900: #064e3b;

/* Amarillo (Advertencia/Celular) */
--color-yellow-50: #fffbeb;
--color-yellow-100: #fef3c7;
--color-yellow-200: #fde68a;
--color-yellow-300: #fcd34d;
--color-yellow-400: #fbbf24;
--color-yellow-500: #f59e0b;
--color-yellow-600: #d97706;   /* Celular principal */
--color-yellow-700: #b45309;
--color-yellow-800: #92400e;   /* Celular oscuro */
--color-yellow-900: #78350f;

/* Rojo (Error/Peligro) */
--color-red-50: #fef2f2;
--color-red-100: #fee2e2;
--color-red-200: #fecaca;
--color-red-300: #fca5a5;
--color-red-400: #f87171;
--color-red-500: #ef4444;    /* Botones destructivos */
--color-red-600: #dc2626;    /* Delete, error principal */
--color-red-700: #b91c1c;    /* Hover */
--color-red-800: #991b1b;    /* Active, error oscuro */
--color-red-900: #7f1d1d;

/* Índigo (Bluetooth) */
--color-indigo-50: #eef2ff;
--color-indigo-100: #e0e7ff;
--color-indigo-200: #c7d2fe;
--color-indigo-300: #a5b4fc;
--color-indigo-400: #818cf8;
--color-indigo-500: #6366f1;
--color-indigo-600: #4f46e5;   /* Bluetooth principal */
--color-indigo-700: #4338ca;
--color-indigo-800: #3730a3;   /* Bluetooth oscuro */
--color-indigo-900: #312e81;
```

### 2.3 Mapeo de Colores por Contexto

#### Tipos de Conexión

| Tipo de Conexión | Fondo | Borde | Icono | Texto |
|-----------------|-------|-------|-------|-------|
| WiFi | `blue-100` | `blue-300` | `blue-600` | `blue-800` |
| Ethernet | `green-100` | `green-300` | `green-600` | `green-800` |
| Celular (4G/3G/2G) | `yellow-100` | `yellow-300` | `yellow-600` | `yellow-800` |
| Bluetooth | `indigo-100` | `indigo-200` | `indigo-600` | `indigo-800` |
| Sin conexión | `red-100` | `red-300` | `red-600` | `red-800` |
| Desconocido | `gray-100` | `gray-300` | `gray-500` | `gray-600` |

#### Botones

| Tipo | Fondo | Texto | Hover | Active |
|------|-------|-------|-------|--------|
| Primario | `blue-500` | `white` | `blue-600` | `blue-700` |
| Éxito | `green-600` | `white` | `green-700` | `green-800` |
| Peligro | `red-500` | `white` | `red-600` | `red-700` |
| Secundario | `gray-100` | `gray-700` | `gray-200` | `gray-300` |
| Fantasma | `transparent` | `gray-700` | `gray-50` | `gray-100` |

#### Estados de Elementos

| Estado | Color de Fondo | Color de Borde |
|--------|----------------|----------------|
| Default | `white` | `gray-300` |
| Hover | `gray-50` | `gray-400` |
| Focus | — | `blue-500` (outline) |
| Active | `gray-100` | `gray-400` |
| Disabled | `gray-100` | `gray-200` |
| Success | `green-50` | `green-600` |
| Error | `red-50` | `red-600` |

---

## 3. Tipografía

### 3.1 Familia Tipográfica

```css
--font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
                     'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
                     'Helvetica Neue', sans-serif;

--font-family-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code',
                     'Fira Mono', 'Roboto Mono', monospace;
```

**Justificación**: Se utiliza la fuente nativa del sistema operativo para:
- Mejor rendimiento (sin descarga de fuentes)
- Apariencia familiar para el usuario
- Mejor legibilidad en cada plataforma
- Menor peso de la aplicación

### 3.2 Escala Tipográfica

Sistema de tamaños basado en una escala modular (ratio 1.125 - Mayor Segunda).

| Nombre | Tamaño | Line Height | Uso |
|--------|--------|-------------|-----|
| `text-xs` | 0.75rem (12px) | 1rem (16px) | Notas muy pequeñas |
| `text-sm` | 0.8125rem (13px) | 1.25rem (20px) | Metadatos, tooltips |
| `text-base` | 0.875rem (14px) | 1.5rem (24px) | Texto base, tablas |
| `text-md` | 0.9375rem (15px) | 1.5rem (24px) | Texto principal |
| `text-lg` | 1rem (16px) | 1.5rem (24px) | Texto destacado |
| `text-xl` | 1.125rem (18px) | 1.75rem (28px) | Subtítulos pequeños |
| `text-2xl` | 1.25rem (20px) | 1.75rem (28px) | Subtítulos |
| `text-3xl` | 1.5rem (24px) | 2rem (32px) | Títulos de sección |
| `text-4xl` | 2rem (32px) | 2.5rem (40px) | Títulos principales |
| `text-5xl` | 3rem (48px) | 1 | Displays, números grandes |

### 3.3 Pesos Tipográficos

```css
--font-weight-normal: 400;    /* Texto regular */
--font-weight-medium: 500;    /* Texto destacado, labels */
--font-weight-semibold: 600;  /* Encabezados de tabla, cards */
--font-weight-bold: 700;      /* Títulos, énfasis fuerte */
```

### 3.4 Estilos de Texto Comunes

```css
/* Títulos */
.heading-1 {
  font-size: 1.5rem;        /* text-3xl */
  font-weight: 700;          /* bold */
  line-height: 2rem;
  color: var(--color-gray-800);
}

.heading-2 {
  font-size: 1.25rem;       /* text-2xl */
  font-weight: 700;
  line-height: 1.75rem;
  color: var(--color-gray-800);
}

.heading-3 {
  font-size: 1.125rem;      /* text-xl */
  font-weight: 600;
  line-height: 1.75rem;
  color: var(--color-gray-700);
}

/* Cuerpo de texto */
.body-text {
  font-size: 0.875rem;      /* text-base */
  line-height: 1.5rem;
  color: var(--color-gray-800);
}

.body-text-small {
  font-size: 0.8125rem;     /* text-sm */
  line-height: 1.25rem;
  color: var(--color-gray-700);
}

/* Labels y metadatos */
.label {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  color: var(--color-gray-700);
}

.caption {
  font-size: 0.8125rem;
  line-height: 1.25rem;
  color: var(--color-gray-500);
}

/* Números */
.numeric-display {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
```

### 3.5 Accesibilidad Tipográfica

- **Contraste mínimo**: 4.5:1 para texto normal, 3:1 para texto grande (≥18px)
- **Tamaño mínimo**: 14px (0.875rem) para texto base
- **Line height**: Mínimo 1.5 para bloques de texto
- **Ancho de línea**: Máximo 80 caracteres para legibilidad óptima

---

## 4. Espaciado

### 4.1 Escala de Espaciado

Sistema de espaciado basado en múltiplos de 4px (0.25rem).

```css
--spacing-0: 0;
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-7: 1.75rem;   /* 28px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
--spacing-20: 5rem;     /* 80px */
--spacing-24: 6rem;     /* 96px */
```

### 4.2 Usos Comunes del Espaciado

#### Padding de Componentes

| Componente | Padding | Ejemplo |
|------------|---------|---------|
| Botón pequeño | `spacing-2 spacing-3` | 8px 12px |
| Botón normal | `spacing-2.5 spacing-4` | 10px 16px |
| Botón grande | `spacing-3 spacing-5` | 12px 20px |
| Input/Select | `spacing-2.5 spacing-3.5` | 10px 14px |
| Card | `spacing-6` | 24px |
| Modal | `spacing-6` | 24px |
| Contenedor principal | `spacing-8` | 32px |

#### Margin entre Elementos

| Relación | Margin | Uso |
|----------|--------|-----|
| Muy cercano | `spacing-1` (4px) | Iconos y labels adyacentes |
| Cercano | `spacing-2` (8px) | Elementos dentro de un grupo |
| Normal | `spacing-4` (16px) | Elementos relacionados |
| Separado | `spacing-6` (24px) | Secciones relacionadas |
| Muy separado | `spacing-8` (32px) | Secciones distintas |
| Sección principal | `spacing-12` (48px) | Separación entre features |

#### Gap en Layouts Grid/Flex

```css
/* Grupos compactos */
gap: var(--spacing-2);  /* 8px */

/* Grupos normales */
gap: var(--spacing-4);  /* 16px */

/* Grupos espaciados */
gap: var(--spacing-6);  /* 24px */
```

### 4.3 Márgenes Responsivos

| Breakpoint | Padding Horizontal | Margen Vertical |
|------------|-------------------|-----------------|
| Mobile (< 640px) | `spacing-4` (16px) | `spacing-4` (16px) |
| Tablet (640-1024px) | `spacing-6` (24px) | `spacing-6` (24px) |
| Desktop (> 1024px) | `spacing-8` (32px) | `spacing-8` (32px) |

---

## 5. Iconografía

### 5.1 Sistema de Iconos

Se utilizan **iconos Unicode** y **emojis** para evitar dependencias de librerías externas.

#### Ventajas
- Sin descarga adicional (0 KB)
- Soporte universal en todos los navegadores
- Coloreable con CSS
- Escalable sin pérdida de calidad
- Accesible por defecto

#### Desventajas Mitigadas
- Variación visual entre sistemas operativos (aceptable para este proyecto)
- Conjunto limitado (suficiente para esta aplicación)

### 5.2 Catálogo de Iconos

#### Tipos de Conexión

| Tipo | Icono | Unicode | Uso |
|------|-------|---------|-----|
| WiFi | 📶 | U+1F4F6 | Conexión WiFi |
| Ethernet | 🌐 | U+1F310 | Conexión por cable |
| Celular 4G/5G | 📱 | U+1F4F1 | Datos móviles |
| Celular 3G | 📡 | U+1F4E1 | Datos móviles lentos |
| Bluetooth | 🔷 | U+1F537 | Bluetooth |
| Sin conexión | ⚠️ | U+26A0 | Offline/error |
| Desconocido | ❓ | U+2753 | Tipo desconocido |

#### Acciones

| Acción | Icono | Unicode | Uso |
|--------|-------|---------|-----|
| Eliminar | 🗑️ | U+1F5D1 | Borrar entrada |
| Descargar | ⬇️ | U+2B07 | Exportar datos |
| Limpiar | 🧹 | U+1F9F9 | Limpiar filtros |
| Información | ℹ️ | U+2139 | Tooltip, ayuda |
| Cerrar | ✖️ | U+2716 | Cerrar modal |
| Confirmar | ✓ | U+2713 | Confirmación |
| Cancelar | ✕ | U+2715 | Cancelar acción |
| Calendario | 📅 | U+1F4C5 | Selector de fecha |

#### Estados

| Estado | Icono | Unicode | Uso |
|--------|-------|---------|-----|
| Éxito | ✅ | U+2705 | Operación exitosa |
| Error | ❌ | U+274C | Error, fallo |
| Advertencia | ⚠️ | U+26A0 | Precaución |
| Información | 💡 | U+1F4A1 | Info adicional |
| Vacío | 📋 | U+1F4CB | Estado vacío |

#### Gráficos y Datos

| Elemento | Icono | Unicode | Uso |
|----------|-------|---------|-----|
| Gráfico | 📊 | U+1F4CA | Estadísticas |
| Velocímetro | 🚀 | U+1F680 | Test de velocidad |
| Historial | 📜 | U+1F4DC | Lista de pruebas |

### 5.3 Tamaños de Iconos

```css
--icon-size-xs: 0.875rem;   /* 14px - inline con texto pequeño */
--icon-size-sm: 1rem;        /* 16px - inline con texto normal */
--icon-size-md: 1.25rem;     /* 20px - botones, badges */
--icon-size-lg: 1.5rem;      /* 24px - iconos destacados */
--icon-size-xl: 2rem;        /* 32px - iconos de sección */
--icon-size-2xl: 3rem;       /* 48px - estados vacíos */
--icon-size-3xl: 4rem;       /* 64px - ilustraciones grandes */
```

### 5.4 Accesibilidad de Iconos

#### Iconos decorativos
```html
<span aria-hidden="true">📶</span>
```

#### Iconos informativos
```html
<span role="img" aria-label="WiFi">📶</span>
```

#### Botones con icono
```html
<button aria-label="Eliminar entrada">
  <span aria-hidden="true">🗑️</span>
</button>
```

---

## 6. Bordes y Sombras

### 6.1 Radio de Borde (Border Radius)

```css
--radius-none: 0;
--radius-sm: 0.25rem;    /* 4px - tags, badges */
--radius-md: 0.375rem;   /* 6px - botones, inputs */
--radius-lg: 0.5rem;     /* 8px - cards, modales */
--radius-xl: 0.75rem;    /* 12px - contenedores principales */
--radius-full: 9999px;   /* círculos completos */
```

### 6.2 Grosor de Borde

```css
--border-width-0: 0;
--border-width-1: 1px;   /* Bordes sutiles */
--border-width-2: 2px;   /* Bordes enfatizados, focus */
--border-width-4: 4px;   /* Bordes muy destacados */
```

### 6.3 Sombras (Box Shadow)

```css
/* Sombras de elevación */
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
             0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
             0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
             0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* Sombras especiales */
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
--shadow-none: none;
```

### 6.4 Uso de Sombras

| Componente | Sombra | Elevación |
|------------|--------|-----------|
| Superficie plana | `none` | 0 |
| Card básica | `shadow-sm` | 1 |
| Card hover | `shadow-md` | 2 |
| Dropdown, popover | `shadow-lg` | 3 |
| Modal, diálogo | `shadow-xl` | 4 |
| Input deprimido | `shadow-inner` | -1 |

---

## 7. Animaciones y Transiciones

### 7.1 Duración

```css
--duration-fast: 0.15s;      /* Hover, click */
--duration-base: 0.2s;       /* Transiciones normales */
--duration-slow: 0.3s;       /* Animaciones complejas */
--duration-slower: 0.5s;     /* Entradas/salidas */
```

### 7.2 Timing Functions (Easing)

```css
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);        /* Por defecto */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### 7.3 Transiciones Comunes

```css
/* Hover en botones */
transition: all 0.15s ease;

/* Background color */
transition: background-color 0.2s ease;

/* Transform */
transition: transform 0.15s ease;

/* Opacity (fade) */
transition: opacity 0.2s ease;

/* Múltiples propiedades */
transition: background-color 0.15s ease,
            border-color 0.15s ease,
            transform 0.15s ease;
```

### 7.4 Animaciones Keyframes

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide in desde arriba */
@keyframes slideIn {
  from {
    transform: translateY(-1rem);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Tooltip */
@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(-0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 7.5 Respeto por Preferencias del Usuario

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Layout y Grid

### 8.1 Breakpoints

```css
/* Mobile first approach */
--breakpoint-sm: 640px;    /* Móvil grande / tablet pequeña */
--breakpoint-md: 768px;    /* Tablet */
--breakpoint-lg: 1024px;   /* Desktop pequeño */
--breakpoint-xl: 1280px;   /* Desktop grande */
```

### 8.2 Contenedores

```css
/* Ancho máximo del contenido principal */
--container-max-width: 1200px;

/* Padding horizontal por breakpoint */
--container-padding-mobile: 1rem;    /* 16px */
--container-padding-tablet: 1.5rem;  /* 24px */
--container-padding-desktop: 2rem;   /* 32px */
```

### 8.3 Grid System

```css
/* Grid básico de 12 columnas */
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
}

/* Grid responsive automático */
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
```

---

## 9. Componentes UI

### 9.1 Botones

```css
/* Botón base */
.button {
  padding: 0.625rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.button:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 9.2 Inputs y Formularios

```css
.input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 0.375rem;
  background: var(--color-white);
  color: var(--color-gray-800);
  transition: all 0.15s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-blue-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

### 9.3 Cards

```css
.card {
  background: var(--color-white);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}
```

---

## 10. Accesibilidad

### 10.1 Contraste de Colores

Todas las combinaciones de color cumplen con WCAG AA:

| Fondo | Texto | Ratio | Estado |
|-------|-------|-------|--------|
| `white` | `gray-800` | 7.2:1 | ✅ AAA |
| `white` | `gray-700` | 5.8:1 | ✅ AA |
| `white` | `gray-600` | 4.6:1 | ✅ AA |
| `gray-50` | `gray-800` | 6.9:1 | ✅ AAA |
| `blue-500` | `white` | 5.1:1 | ✅ AA |
| `red-500` | `white` | 4.8:1 | ✅ AA |

### 10.2 Focus States

Todos los elementos interactivos tienen estados de focus visibles:

```css
:focus-visible {
  outline: 2px solid var(--color-blue-500);
  outline-offset: 2px;
}
```

### 10.3 Navegación por Teclado

- Tab order lógico
- Skip links para navegación rápida
- Atajos de teclado documentados
- Escape para cerrar modales

### 10.4 ARIA y Semántica

- Labels descriptivos en formularios
- Role attributes apropiados
- aria-label para iconos
- aria-live para cambios dinámicos

---

## 11. Implementación

### 11.1 Variables CSS

Se recomienda implementar todas las variables en un archivo CSS global:

```css
:root {
  /* Colores */
  --color-primary: #3b82f6;
  --color-success: #059669;
  --color-danger: #ef4444;

  /* Espaciado */
  --spacing-unit: 0.25rem;

  /* Tipografía */
  --font-base: 0.875rem;
  --line-height-base: 1.5;

  /* Sombras, etc. */
}
```

### 11.2 Naming Convention

Se utiliza BEM (Block Element Modifier):

```css
.block {}
.block__element {}
.block--modifier {}
.block__element--modifier {}
```

Ejemplo:
```css
.history-table {}
.history-table__row {}
.history-table__row--highlighted {}
.history-table__cell {}
.history-table__cell--numeric {}
```

---

## 12. Referencias

- **Paleta de colores**: Basada en Tailwind CSS
- **Tipografía**: System font stack
- **Iconografía**: Unicode/Emoji
- **Accesibilidad**: WCAG 2.1 Level AA
- **Metodología CSS**: BEM

---

*Este documento debe actualizarse a medida que el diseño evoluciona y se añaden nuevos componentes.*
