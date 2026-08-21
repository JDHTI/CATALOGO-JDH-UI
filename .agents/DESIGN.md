# DESIGN.md — Sistema de Diseño Web JDH

## Resumen

Documento maestro para **construir sitios y páginas web de Juan D. Hoyos Distribuciones (JDH)**. Define la estética (minimalismo corporativo, monocromo basado en negro), los _design tokens_ como **variables CSS**, y las especificaciones de los componentes compartidos (header, footer, botones, enlaces, formularios, cards, navegación). Es la **fuente única de verdad para web** y gobierna las notas de esta sección ([[05 - UI Design/Buttons]], [[05 - UI Design/Navigation]], [[05 - UI Design/Cards]], etc.). Cualquier IA o desarrollador que genere una web JDH parte de aquí.

## Estado

🟡 Derivado — nuevo estándar corporativo web definido en sesión de consolidación 2026-07-16. La colorimetría monocroma se deriva de los neutrales oficiales de marca; la estructura de tokens y las specs de componentes siguen estándares públicos de la industria (ver Fuente). Pendiente de ratificación formal del área de marca (no bloqueante).

## Fuente

- **Colorimetría:** neutrales oficiales JDH (`#1D1D1B` Negro, `#FFFFFF` Blanco y grises cálidos) de [[06 - Design System/Design Tokens]] y [[09 - Sources/Manual de Marca 2025]] (P20-21). El Azul JDH `#16304E` **no se usa en la interfaz** — vive únicamente en el logo (decisión de esta sesión: UI monocroma).
- **Tipografía:** Centrale Sans (skill `jdh-imagen-corporativa`, `assets/fonts/`).
- **Arquitectura de tokens:** W3C Design Tokens Community Group; práctica de Style Dictionary / Tokens Studio; consistente con las 3 capas de [[06 - Design System/Design Tokens]].
- **Patrones de sistema y componentes:** convenciones públicas consolidadas de Vercel **Geist**, **Linear**, **Stripe**, Apple **Human Interface Guidelines**, IBM **Carbon**, GitHub **Primer**, **Material Design 3** y Shopify **Polaris**. No se copia ninguno; se adopta el mínimo común denominador probado.
- **Accesibilidad:** **WCAG 2.2 nivel AA** (contraste, foco visible, objetivos táctiles, movimiento reducido).

## Propósito

Que construir una web JDH sea **resolver una consulta a tokens y componentes**, no improvisar valores. Un agente pregunta "¿qué rol cumple este elemento?" y obtiene una variable CSS con un valor único; "¿qué componente es?" y obtiene su anatomía, estados y CSS.

## Problema que Resuelve

Elimina la ambigüedad "¿qué negro/gris/espacio/radio uso?", evita el look "de plantilla" (bordes redondeados excesivos, sombras genéricas, colores por defecto del framework) y garantiza que toda web JDH se lea como una sola familia visual, coherente con la marca y accesible.

## Cuándo Utilizarlo

Siempre que se diseñe, genere o revise **cualquier interfaz web o móvil de JDH**: landing pages, aplicaciones, dashboards, portales, formularios, correos HTML. Es el paso previo obligatorio antes de escribir markup o CSS.

## Cuándo NO Utilizarlo

- No para **presentaciones/PPTX** ni piezas de marca impresas/redes → usa la skill `jdh-imagen-corporativa` y [[04 - Presentation Design]].
- No para **crear valores nuevos "al vuelo"**: si una web parece necesitar un token que no existe aquí, es _conocimiento faltante_ → se registra en [[00 - Home/Conocimiento Faltante]], no se inventa.
- No para **color de datos** (gráficos/charts): la UI es monocroma, pero la visualización de datos puede usar la rampa de azul → defer a [[04 - Presentation Design/Charts]] y la skill `dataviz`.

---

## 1. Principios de diseño

1. **Minimalismo corporativo, no minimalismo decorativo.** Cada elemento justifica su presencia. Si algo puede quitarse sin perder claridad, se quita. El vacío (espacio en blanco) es un componente activo, no un sobrante.
2. **Monocromo disciplinado.** La interfaz se construye en **negro, blanco y grises cálidos**. Sin color de acento en el chrome. La jerarquía se logra con **contraste, peso tipográfico y espacio**, no con color. El único color de marca (Azul JDH) aparece solo en el logo.
3. **El negro es la firma.** Header, footer, botón primario y estados activos son negros (`#1D1D1B`). El negro estructura la página; el blanco la deja respirar.
4. **Tipografía como voz.** Centrale Sans lleva la personalidad. Jerarquía por tamaño y peso, no por adornos. Titulares grandes y limpios; cuerpo cómodo de leer.
5. **Estructura honesta.** Divisores, _eyebrows_ y etiquetas comunican algo verdadero del contenido (jerarquía, secuencia real). No se decora con numeración `01/02/03` salvo que el contenido sea de verdad una secuencia.
6. **Bordes antes que sombras.** La separación se resuelve con líneas _hairline_ (1px) y superficies planas antes que con sombras. Las sombras existen pero son sutiles y escasas.
7. **Movimiento con intención.** Transiciones breves y funcionales (hover, foco, entrada). Nada rebota ni gira. Se respeta `prefers-reduced-motion`.
8. **Accesible por construcción.** Contraste AA, foco siempre visible, HTML semántico, objetivos táctiles ≥44px. No es una capa final: es un requisito de cada componente.

**Referencias estéticas** (dirección, no copia): la sobriedad monocroma de Vercel/Linear, el rigor tipográfico y de espacio de Stripe, la calma de Apple.

---

## 2. Design Tokens (variables CSS)

Arquitectura idéntica a [[06 - Design System/Design Tokens]]: **primitive → semantic → component**. En web se expresan como **custom properties** (`--token`). Un artefacto consume la capa **semántica**; nunca escribe un valor crudo.

> **Nota sobre el "negro".** El negro de la marca es `#1D1D1B` (Negro JDH), no `#000000` puro. Se usa `#1D1D1B` para todas las superficies negras: es el negro correcto de marca y, además, el negro puro (`#000`) resulta áspero en pantalla (práctica estándar en sistemas de diseño). El `#000000` puro está **prohibido** como superficie o texto.

### 2.1 Capa primitiva — Neutrales (rampa monocroma)

Reutiliza los primitivos neutrales de marca. Es la única paleta de la interfaz.

```css
:root {
  /* Neutrales cálidos oficiales JDH — capa primitiva */
  --neutral-0: #ffffff; /* Blanco JDH */
  --neutral-100: #f2f2f2; /* gris muy claro (accent3) */
  --neutral-200: #d9d9d9; /* gris claro (accent5) */
  --neutral-300: #c8c8c4; /* gris medio-claro (folHlink) */
  --neutral-500: #919189; /* gris medio (accent6) */
  --neutral-700: #343430; /* gris oscuro (accent1) */
  --neutral-900: #1d1d1b; /* Negro JDH */

  /* Overlays para superficies negras (separación sin introducir grises nuevos) */
  --overlay-on-dark-04: rgba(255, 255, 255, 0.04);
  --overlay-on-dark-08: rgba(255, 255, 255, 0.08);
  --overlay-on-dark-12: rgba(255, 255, 255, 0.12);
  --overlay-on-dark-64: rgba(255, 255, 255, 0.64);
  --overlay-on-light-04: rgba(29, 29, 27, 0.04);
  --overlay-on-light-08: rgba(29, 29, 27, 0.08);
}
```

### 2.2 Capa semántica — Color (tema claro por defecto)

El sitio es **claro por defecto** (lienzo blanco, texto negro) con **chrome negro** (header/footer/botón primario siempre oscuros). Los tokens `*-ink*` son el negro fijo del chrome; no cambian con el tema.

```css
:root {
  /* Superficies (tema claro) */
  --color-bg: var(--neutral-0); /* fondo base de página */
  --color-bg-subtle: var(--neutral-100); /* secciones alternas, zebra */
  --color-surface: var(--neutral-0); /* cards/paneles */
  --color-surface-subtle: var(--neutral-100); /* card sobre fondo blanco */

  /* Bordes */
  --color-border: var(--neutral-200); /* divisor/borde por defecto (hairline) */
  --color-border-strong: var(--neutral-300); /* borde con más presencia */

  /* Texto */
  --color-text: var(--neutral-900); /* texto primario */
  --color-text-secondary: var(--neutral-700); /* texto de apoyo */
  --color-text-tertiary: var(--neutral-500); /* metadatos, captions */
  --color-text-disabled: var(--neutral-300); /* deshabilitado */

  /* Chrome negro (fijo, no cambia con el tema) */
  --color-ink: var(
    --neutral-900
  ); /* fondo negro: header, footer, botón primario */
  --color-ink-hover: var(--neutral-700); /* hover de superficie negra */
  --color-on-ink: var(--neutral-0); /* texto/icono sobre negro */
  --color-on-ink-muted: var(
    --overlay-on-dark-64
  ); /* texto secundario sobre negro */
  --color-ink-border: var(--overlay-on-dark-12); /* borde/divisor sobre negro */

  /* Interacción / foco */
  --color-focus: var(--neutral-900); /* anillo de foco sobre claro */
  --color-focus-on-ink: var(--neutral-0); /* anillo de foco sobre negro */
  --color-selection: var(--overlay-on-light-08); /* ::selection */
}
```

### 2.3 Tema oscuro (opcional, mismo sistema invertido)

Como la paleta es monocroma, el modo oscuro es trivial: se invierten superficies y texto. El chrome negro se mantiene coherente. Se activa con `prefers-color-scheme` y/o `[data-theme="dark"]` (el toggle explícito debe ganar).

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg: var(--neutral-900);
    --color-bg-subtle: var(--neutral-700);
    --color-surface: var(--neutral-900);
    --color-surface-subtle: var(--neutral-700);
    --color-border: var(--overlay-on-dark-12);
    --color-border-strong: var(--overlay-on-dark-08);
    --color-text: var(--neutral-0);
    --color-text-secondary: var(--neutral-300);
    --color-text-tertiary: var(--neutral-500);
    --color-text-disabled: var(--neutral-700);
    --color-focus: var(--neutral-0);
    --color-selection: var(--overlay-on-dark-08);
  }
}
:root[data-theme="dark"] {
  /* mismos overrides que el bloque anterior */
}
```

> Regla: **componer siempre en pares.** Todo color se declara para claro y para oscuro. Si un color solo funciona en un tema, está mal elegido.

### 2.4 Tipografía

```css
:root {
  /* Familias */
  --font-sans:
    "Centrale Sans", "Montserrat", system-ui, -apple-system, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;
  --font-mono:
    ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace;

  /* Pesos (Centrale Sans) */
  --fw-light: 300; /* uso puntual, titulares muy grandes */
  --fw-regular: 400; /* cuerpo */
  --fw-medium: 500; /* subtítulos, labels, botones */
  --fw-bold: 700; /* títulos, énfasis */

  /* Escala tipográfica (rem, base 16px — escala ~1.2/1.25) */
  --fs-caption: 0.75rem; /* 12px */
  --fs-sm: 0.875rem; /* 14px */
  --fs-body: 1rem; /* 16px — base */
  --fs-lead: 1.125rem; /* 18px */
  --fs-h6: 1.25rem; /* 20px */
  --fs-h5: 1.5rem; /* 24px */
  --fs-h4: 1.875rem; /* 30px */
  --fs-h3: 2.25rem; /* 36px */
  --fs-h2: 3rem; /* 48px */
  --fs-h1: 3.75rem; /* 60px */
  --fs-display: 4.5rem; /* 72px — héroes */

  /* Interlineado */
  --lh-tight: 1.1; /* titulares grandes */
  --lh-snug: 1.25; /* títulos medios */
  --lh-normal: 1.5; /* cuerpo */
  --lh-relaxed: 1.65; /* texto largo */

  /* Tracking (letter-spacing) */
  --ls-tight: -0.02em; /* titulares grandes */
  --ls-normal: 0;
  --ls-wide: 0.08em; /* eyebrows/labels en MAYÚSCULA */
}
```

**Reglas tipográficas**

- **Cuerpo:** `--fs-body` / `--fw-regular` / `--lh-normal`. Longitud de línea óptima **60–75 caracteres** (`max-width: 65ch`).
- **Títulos:** `--fw-bold` (o `--fw-medium` para subtítulos). Cuanto más grande el título, más negativo el tracking (`--ls-tight`) y más ajustado el interlineado (`--lh-tight`).
- **Eyebrows / labels / overlines:** `--fs-caption` o `--fs-sm`, `--fw-medium`, `text-transform: uppercase`, `--ls-wide`. Es el recurso de estructura característico del sistema (en vez de color).
- **Énfasis en párrafo:** en presentaciones JDH se resalta con Bold azul; **en web monocroma** el énfasis es `--fw-bold` en el mismo color de texto (no se introduce azul). No usar subrayado (reservado a enlaces) ni cursiva para énfasis.
- **Fuente web:** cargar Centrale Sans vía `@font-face` en formato **`.woff2`** (los `.otf` de la skill deben convertirse). Usar `font-display: swap`. Fallback declarado arriba. → _Conversión .otf→.woff2 registrada como pendiente en [[00 - Home/Conocimiento Faltante]]._

```css
/* Ejemplo de carga (rutas a definir en el proyecto) */
@font-face {
  font-family: "Centrale Sans";
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("/fonts/centrale-sans-regular.woff2") format("woff2");
}
/* repetir para 300, 500, 700 y sus itálicas según se necesiten */
```

### 2.5 Espacio (base 4px)

Consistente con [[06 - Design System/Spacing Scale]]. **Todo margen/padding/gap es múltiplo de 4px.**

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-24: 6rem; /* 96px */
  --space-32: 8rem; /* 128px */
}
```

- **Ritmo vertical de secciones:** `--space-24` a `--space-32` entre secciones grandes (desktop); `--space-12`/`--space-16` en móvil. El espacio generoso es parte de la estética.
- **Padding interno de componentes:** ver cada componente en §4.

### 2.6 Radio de borde (contenido)

Minimalismo corporativo = radios **pequeños y consistentes**, nunca "pill" salvo en chips/tags.

```css
:root {
  --radius-none: 0;
  --radius-sm: 4px; /* botones, inputs, controles (por defecto) */
  --radius-md: 8px; /* cards, contenedores */
  --radius-lg: 12px; /* modales, superficies grandes */
  --radius-full: 9999px; /* solo chips/tags/avatares */
}
```

> Elegir **un** radio de control para todo el sitio (recomendado `--radius-sm`) y no mezclar. Alternativa válida y más severa: `--radius-none` (esquinas rectas) para un tono aún más editorial/corporativo — decidir por proyecto y mantenerlo.

### 2.7 Bordes, elevación y foco

```css
:root {
  /* Grosor de borde */
  --border-width: 1px; /* hairline por defecto */
  --border-width-strong: 2px; /* énfasis / estado activo */

  /* Elevación — sutil y escasa (preferir bordes) */
  --shadow-none: none;
  --shadow-sm: 0 1px 2px rgba(29, 29, 27, 0.06);
  --shadow-md: 0 4px 12px rgba(29, 29, 27, 0.08);
  --shadow-lg: 0 12px 32px rgba(29, 29, 27, 0.12); /* solo overlays: modal, menú, popover */

  /* Foco (accesibilidad — nunca se elimina) */
  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;
}
```

Ver escala completa en [[05 - UI Design/Elevation]]. Regla: superficies de contenido usan **borde**, no sombra; la sombra se reserva para elementos que flotan sobre el resto (menús, modales, popovers, toasts).

### 2.8 Movimiento

```css
:root {
  --duration-fast: 120ms; /* hover, cambios de color */
  --duration-base: 200ms; /* la mayoría de transiciones */
  --duration-slow: 320ms; /* entradas, overlays */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1); /* entrada/salida general */
  --ease-out: cubic-bezier(0, 0, 0.2, 1); /* apariciones */
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Anima solo `opacity` y `transform` (rinden mejor). Evita animar `width/height/top/left`. Ver [[06 - Design System/Patterns]] para animaciones de patrón.

### 2.9 Layout, breakpoints y z-index

```css
:root {
  /* Contenedor y grid */
  --container-max: 1200px; /* ancho máximo de contenido */
  --container-wide: 1440px; /* héroes/secciones full-bleed acotadas */
  --gutter: var(--space-6); /* canaleta horizontal (24px; 16px en móvil) */
  --grid-columns: 12;

  /* Z-index — escala nombrada, sin números mágicos */
  --z-base: 0;
  --z-dropdown: 1000;
  --z-sticky: 1100; /* header sticky */
  --z-overlay: 1200; /* backdrop */
  --z-modal: 1300;
  --z-popover: 1400;
  --z-toast: 1500;
}
```

**Breakpoints** (mobile-first, `min-width`):

| Nombre | Valor    | Uso            |
| ------ | -------- | -------------- |
| `sm`   | `640px`  | móvil grande   |
| `md`   | `768px`  | tablet         |
| `lg`   | `1024px` | desktop        |
| `xl`   | `1280px` | desktop grande |

Grid de 12 columnas, canaleta `--gutter`, contenido centrado dentro de `--container-max`. Detalle en [[05 - UI Design/Layout]], [[05 - UI Design/Responsive]] y [[06 - Design System/Grid System]].

---

## 3. Base / Reset (fundaciones globales)

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}
* {
  margin: 0;
}
html {
  -webkit-text-size-adjust: 100%;
  scroll-behavior: smooth;
}
body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: var(--fs-body);
  line-height: var(--lh-normal);
  font-weight: var(--fw-regular);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
img,
picture,
svg,
video {
  display: block;
  max-width: 100%;
}
::selection {
  background: var(--color-selection);
}

/* Foco visible global — accesibilidad no negociable */
:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus);
  outline-offset: var(--focus-ring-offset);
  border-radius: var(--radius-sm);
}
```

---

## 4. Componentes compartidos

Cada componente: **propósito → anatomía → variantes → estados → reglas → CSS de referencia**. Los estados obligatorios en todo control interactivo son: `default`, `hover`, `active`, `focus-visible`, `disabled` (y `loading` cuando aplique).

### 4.1 Header (negro)

**Propósito:** navegación principal y presencia de marca. Es negro (`--color-ink`) en todo momento, en claro y oscuro.

**Anatomía**

```
┌───────────────────────────────────────────────────────────────┐
│  [logo-blanco]        Inicio  Nosotros  Servicios  Contacto  [CTA] │  ← fondo --color-ink
└───────────────────────────────────────────────────────────────┘
   ↑ isotipo/logo blanco     ↑ enlaces --color-on-ink      ↑ botón
```

**Reglas**

- Fondo `--color-ink`; logo en **blanco** (`isotipo-blanco.svg` / `logo-completo-blanco.svg` de la skill). Respetar área de seguridad del logo (§skill).
- Altura recomendada 64–72px desktop, 56px móvil. Padding horizontal `--gutter`.
- Enlaces: `--color-on-ink`, `--fw-medium`, `--fs-sm`. Hover: subrayado 1px o cambio a `--color-on-ink-muted`. Enlace activo (página actual): subrayado persistente + `aria-current="page"`.
- Divisor inferior: `--color-ink-border` (1px) o sombra `--shadow-sm` al hacer scroll si es `sticky` (`--z-sticky`).
- Móvil: colapsar navegación en menú (hamburguesa) con panel a pantalla completa o _drawer_; botón con `aria-expanded` y objetivo ≥44px.
- Un solo CTA en el header (botón primario invertido, ver §4.3).

```css
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8);
  height: 72px;
  padding-inline: var(--gutter);
  background: var(--color-ink);
  color: var(--color-on-ink);
  border-bottom: var(--border-width) solid var(--color-ink-border);
}
.header__nav {
  display: flex;
  gap: var(--space-6);
}
.header__link {
  color: var(--color-on-ink);
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  text-decoration: none;
  padding-block: var(--space-2);
  transition: color var(--duration-fast) var(--ease-standard);
}
.header__link:hover {
  color: var(--color-on-ink-muted);
}
.header__link[aria-current="page"] {
  text-decoration: underline;
  text-underline-offset: 6px;
}
```

### 4.2 Footer (negro)

**Propósito:** cierre de página, navegación secundaria, información corporativa y legal.

**Reglas**

- Fondo `--color-ink`, texto `--color-on-ink` / `--color-on-ink-muted`. Coherente con el header (mismo negro).
- Estructura en columnas (logo + tagline, enlaces por categoría, contacto/sedes, legal). Sedes JDH: Medellín, Bogotá, Armenia, Bucaramanga, Urabá, Cartagena, Barranquilla.
- Logo **blanco** (`logo-completo-blanco`). Área de seguridad respetada.
- Títulos de columna: `--fs-sm`, `--fw-medium`, MAYÚSCULA, `--ls-wide`, en `--color-on-ink-muted`.
- Barra legal inferior separada por borde `--color-ink-border`: copyright + enlaces legales, `--fs-caption`.
- Padding vertical generoso: `--space-16`/`--space-24`.

```css
.footer {
  background: var(--color-ink);
  color: var(--color-on-ink);
  padding: var(--space-24) var(--gutter) var(--space-8);
}
.footer__grid {
  max-width: var(--container-max);
  margin-inline: auto;
  display: grid;
  grid-template-columns: 2fr repeat(3, 1fr);
  gap: var(--space-12);
}
.footer__col-title {
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  text-transform: uppercase;
  letter-spacing: var(--ls-wide);
  color: var(--color-on-ink-muted);
  margin-bottom: var(--space-4);
}
.footer__legal {
  max-width: var(--container-max);
  margin: var(--space-16) auto 0;
  padding-top: var(--space-6);
  border-top: var(--border-width) solid var(--color-ink-border);
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  font-size: var(--fs-caption);
  color: var(--color-on-ink-muted);
}
@media (max-width: 768px) {
  .footer__grid {
    grid-template-columns: 1fr;
  }
}
```

### 4.3 Botones

Jerarquía de **tres niveles**. El primario es negro (la firma del sistema). Ver también [[05 - UI Design/Buttons]].

| Variante              | Uso                                    | Relleno       | Texto            | Borde                                    |
| --------------------- | -------------------------------------- | ------------- | ---------------- | ---------------------------------------- |
| **Primario**          | acción principal (1 por vista/sección) | `--color-ink` | `--color-on-ink` | ninguno                                  |
| **Secundario**        | acción alterna                         | transparente  | `--color-text`   | 1px `--color-border-strong`              |
| **Terciario / ghost** | acción de bajo énfasis, enlaces-acción | transparente  | `--color-text`   | ninguno (hover: `--overlay-on-light-04`) |

**Reglas transversales**

- Altura: `sm` 32px, `md` 40px (por defecto), `lg` 48px. Objetivo táctil real ≥44px en móvil (usar padding).
- Tipografía: `--fw-medium`, `--fs-sm`/`--fs-body`. Radio `--radius-sm`. Padding horizontal `--space-4`/`--space-6`.
- **Estados** obligatorios (primario): hover `--color-ink-hover`; active = hover + `transform: translateY(1px)`; focus-visible = anillo `--color-focus` con offset; disabled = `opacity: .4` + `cursor: not-allowed`.
- Máximo **un botón primario** por bloque de decisión. No dos negros compitiendo.
- Icono + texto: `gap: --space-2`; iconos de trazo (ver [[05 - UI Design/Icons]]). Nunca solo color para comunicar (añadir texto/aria-label).

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 40px;
  padding-inline: var(--space-6);
  font-family: var(--font-sans);
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  border-radius: var(--radius-sm);
  border: var(--border-width) solid transparent;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}
.btn:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus);
  outline-offset: var(--focus-ring-offset);
}
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--color-ink);
  color: var(--color-on-ink);
}
.btn--primary:hover:not(:disabled) {
  background: var(--color-ink-hover);
}
.btn--primary:active:not(:disabled) {
  transform: translateY(1px);
}

.btn--secondary {
  background: transparent;
  color: var(--color-text);
  border-color: var(--color-border-strong);
}
.btn--secondary:hover:not(:disabled) {
  background: var(--overlay-on-light-04);
  border-color: var(--color-text);
}

.btn--ghost {
  background: transparent;
  color: var(--color-text);
}
.btn--ghost:hover:not(:disabled) {
  background: var(--overlay-on-light-04);
}
```

> **Sobre fondo negro** (header/footer/secciones inverse): el CTA se invierte — fondo `--color-on-ink` (blanco) y texto `--color-ink`; el secundario usa borde `--color-ink-border` y texto `--color-on-ink`.

### 4.4 Enlaces

- Color = color de texto actual (`--color-text`), **subrayado** como señal de enlace (`text-underline-offset: 2px`). Hover: cambia grosor/opacidad del subrayado, no el color (monocromo).
- Enlaces dentro de párrafo siempre subrayados; enlaces de navegación pueden ir sin subrayado si el contexto lo deja claro.
- `:focus-visible` con el anillo global. Estados `:visited` no cambian de color (se evita el morado por defecto).

```css
.link {
  color: var(--color-text);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
  transition: text-decoration-thickness var(--duration-fast)
    var(--ease-standard);
}
.link:hover {
  text-decoration-thickness: 2px;
}
```

### 4.5 Formularios (inputs, textarea, select)

Ver también [[05 - UI Design/Inputs]].

**Reglas**

- Superficie `--color-surface`, borde `--color-border` (1px), texto `--color-text`, placeholder `--color-text-tertiary`. Radio `--radius-sm`. Altura 40px (coincide con botón `md`).
- **Label siempre visible** encima del campo (no solo placeholder). Asociar con `for`/`id`.
- Foco: borde `--color-text` + anillo `--color-focus` (offset). Nunca eliminar el foco.
- **Estado de error:** el error **no** se comunica solo por color (la UI es monocroma). Se usa: borde `--border-width-strong` + **texto de error visible** + icono + `aria-invalid="true"` + `aria-describedby`. El texto es la señal primaria.
- Mensajes de ayuda: `--fs-sm`, `--color-text-tertiary`, debajo del campo.
- Objetivos táctiles ≥44px; espaciado entre campos `--space-4`/`--space-6`.

```css
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.field__label {
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  color: var(--color-text);
}
.input {
  height: 40px;
  padding-inline: var(--space-3);
  background: var(--color-surface);
  color: var(--color-text);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  font-size: var(--fs-body);
  transition: border-color var(--duration-fast) var(--ease-standard);
}
.input::placeholder {
  color: var(--color-text-tertiary);
}
.input:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus);
  outline-offset: var(--focus-ring-offset);
  border-color: var(--color-text);
}
.input[aria-invalid="true"] {
  border-width: var(--border-width-strong);
  border-color: var(--color-text);
}
.field__error {
  font-size: var(--fs-sm);
  color: var(--color-text);
  font-weight: var(--fw-medium);
}
```

### 4.6 Cards

Ver también [[05 - UI Design/Cards]].

- Superficie `--color-surface`, **borde** `--color-border` (1px) en lugar de sombra por defecto. Radio `--radius-md`. Padding `--space-6`/`--space-8`.
- Card interactiva (enlace): hover = `--color-border-strong` o `--shadow-sm` + leve `translateY(-2px)`; foco visible en todo el card (`:focus-within`/anchor envolvente).
- Jerarquía interna con tipografía y espacio, no con más bordes internos.

```css
.card {
  background: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-8);
}
.card--interactive {
  transition:
    border-color var(--duration-base) var(--ease-standard),
    transform var(--duration-base) var(--ease-standard);
}
.card--interactive:hover {
  border-color: var(--color-border-strong);
  transform: translateY(-2px);
}
```

### 4.7 Navegación (patrones)

- **Navbar** (en header §4.1), **breadcrumbs**, **tabs**, **paginación**, **menú móvil**. Detalle en [[05 - UI Design/Navigation]].
- Estado activo por **subrayado o borde**, nunca solo por color. Siempre `aria-current` en el ítem activo.
- Tabs: indicador de 2px (`--border-width-strong`) en `--color-text` bajo la pestaña activa; inactivas en `--color-text-tertiary`.

---

## 5. Anti-patrones (nunca en una web JDH)

- ❌ **Color en el chrome.** Header/footer/botones no llevan azul ni ningún acento; son monocromos. El Azul JDH solo aparece en el logo.
- ❌ **Negro puro `#000000`** como superficie o texto → usar `#1D1D1B` (`--color-ink`).
- ❌ **Valores crudos** (`#333`, `18px`, `12px` de radio) en el markup → usar variables/tokens.
- ❌ **Comunicar estado solo con color** (rojo/verde). En monocromo, el estado va con texto + icono + peso/borde.
- ❌ **Eliminar el foco** (`outline: none`) sin reemplazo visible → violación WCAG.
- ❌ **Sombras genéricas** por todos lados / bordes redondeados grandes (look "Bootstrap") → bordes hairline, radios pequeños.
- ❌ **Más de un botón primario** compitiendo en el mismo bloque de decisión.
- ❌ **Degradados, sombras de colores, glows, neomorfismo** → contradicen el minimalismo corporativo.
- ❌ **Numeración `01/02/03`** u otros marcadores de secuencia cuando el contenido no es una secuencia.
- ❌ **Texto secundario en el color de texto primario** (o viceversa) → romper jerarquía.
- ❌ **Fuente por defecto** (Arial/Times) sin declarar el fallback correcto de Centrale Sans.

---

## 6. Reglas para IA

Al generar cualquier web/UI JDH:

1. **Emite el bloque `:root` de tokens primero** (o enlázalo). Después construye solo con variables — nunca un valor crudo.
2. **Monocromo estricto en la UI.** No introduzcas azul, teal ni ningún hue en botones, fondos, bordes o texto. El único color permitido fuera de neutrales es el logo (SVG de la skill).
3. **Chrome negro:** header, footer y botón primario usan `--color-ink`. El logo dentro de ellos es la variante **blanca**.
4. **Resuelve cada color por rol** (`¿fondo? ¿texto? ¿borde?`) → token semántico. Si un elemento no encaja en ningún rol/token, **detente y registra el faltante**, no inventes.
5. **Componentes desde §4:** reutiliza las clases/anatomías definidas antes de crear variantes nuevas.
6. **Accesibilidad como gate:** todo control tiene los 5 estados; foco visible; contraste AA verificado; HTML semántico (`<header> <nav> <main> <footer> <button> <a>`); objetivos ≥44px; `prefers-reduced-motion` respetado.
7. **Copy:** voz activa, _sentence case_, específico y sin relleno; nombra las cosas por lo que el usuario controla. Errores que explican qué pasó y cómo resolverlo; estados vacíos que invitan a actuar. (Tono JDH: cercano, confiable, claro.)
8. **Data viz** (si hay gráficos): la UI es monocroma, pero los datos pueden usar la rampa azul → sigue [[04 - Presentation Design/Charts]] / skill `dataviz`.

---

## 7. Checklist de Validación

**Tokens y color**

- [ ] Cero valores crudos en el markup: todo color/espacio/tipografía/radio = una variable.
- [ ] UI 100% monocroma; ningún hue fuera del logo.
- [ ] Ningún `#000000` puro; negro = `#1D1D1B` (`--color-ink`).
- [ ] Todo color declarado para tema claro y oscuro.

**Chrome y componentes**

- [ ] Header y footer negros, con logo blanco y área de seguridad respetada.
- [ ] ≤1 botón primario por bloque de decisión; jerarquía primario/secundario/ghost clara.
- [ ] Todo control interactivo tiene default/hover/active/focus-visible/disabled.

**Accesibilidad (WCAG 2.2 AA)**

- [ ] Contraste texto/fondo ≥ 4.5:1 (≥3:1 en texto grande e iconos). Ver [[06 - Design System/Accessibility]].
- [ ] Foco visible en todos los elementos interactivos (nunca `outline:none` sin reemplazo).
- [ ] Estado/error comunicado con texto + icono, no solo color.
- [ ] HTML semántico y `aria-*` donde corresponde (`aria-current`, `aria-expanded`, `aria-invalid`, `aria-describedby`).
- [ ] Objetivos táctiles ≥44px; `prefers-reduced-motion` respetado.

**Layout y tipografía**

- [ ] Espacios = múltiplos de 4px; secciones con ritmo `--space-24`/`--space-32`.
- [ ] Cuerpo de texto 60–75 caracteres por línea.
- [ ] Responsive verificado en `sm`/`md`/`lg`; sin scroll horizontal en móvil.

---

## 8. Ejemplos

**Hero minimalista (claro, chrome negro arriba)**

```html
<header class="header">
  <img
    src="/assets/logo-completo-blanco.svg"
    alt="Juan D. Hoyos Distribuciones"
    height="28"
  />
  <nav class="header__nav" aria-label="Principal">
    <a class="header__link" href="/nosotros">Nosotros</a>
    <a class="header__link" href="/servicios">Servicios</a>
    <a class="header__link" aria-current="page" href="/cobertura">Cobertura</a>
  </nav>
  <a class="btn btn--primary" href="/contacto">Contáctanos</a>
</header>

<main>
  <section
    style="max-width:var(--container-max);margin-inline:auto;padding:var(--space-32) var(--gutter)"
  >
    <p class="eyebrow">Distribución institucional · Food Service · Retail</p>
    <h1
      style="font-size:var(--fs-display);font-weight:var(--fw-bold);line-height:var(--lh-tight);letter-spacing:var(--ls-tight);max-width:16ch"
    >
      Llevamos tu operación más lejos.
    </h1>
    <p
      style="font-size:var(--fs-lead);color:var(--color-text-secondary);max-width:60ch;margin-top:var(--space-6)"
    >
      Presencia en siete ciudades de Colombia con la confiabilidad de siempre.
    </p>
    <div style="display:flex;gap:var(--space-3);margin-top:var(--space-8)">
      <a class="btn btn--primary" href="/contacto">Cotiza ahora</a>
      <a class="btn btn--secondary" href="/nosotros">Conócenos</a>
    </div>
  </section>
</main>
```

```css
.eyebrow {
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  text-transform: uppercase;
  letter-spacing: var(--ls-wide);
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-4);
}
```

**Sección de impacto (fondo negro, texto blanco)**

```html
<section
  style="background:var(--color-ink);color:var(--color-on-ink);padding:var(--space-32) var(--gutter)"
>
  <div
    style="max-width:var(--container-max);margin-inline:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-12)"
  >
    <div>
      <p style="font-size:var(--fs-h1);font-weight:var(--fw-bold)">7</p>
      <p style="color:var(--color-on-ink-muted)">ciudades</p>
    </div>
    <div>
      <p style="font-size:var(--fs-h1);font-weight:var(--fw-bold)">+30</p>
      <p style="color:var(--color-on-ink-muted)">años de operación</p>
    </div>
    <div>
      <p style="font-size:var(--fs-h1);font-weight:var(--fw-bold)">24/7</p>
      <p style="color:var(--color-on-ink-muted)">soporte logístico</p>
    </div>
  </div>
</section>
```

---

## Relacionado

- [[05 - UI Design/Buttons]] · [[05 - UI Design/Inputs]] · [[05 - UI Design/Cards]] · [[05 - UI Design/Navigation]] — specs de componentes (este doc los gobierna)
- [[05 - UI Design/Layout]] · [[05 - UI Design/Responsive]] · [[05 - UI Design/Spacing]] · [[05 - UI Design/Elevation]] · [[05 - UI Design/Icons]] — fundaciones de UI
- [[06 - Design System/Design Tokens]] — primitivos y capa semántica (fuente de los neutrales)
- [[06 - Design System/Color Tokens]] · [[06 - Design System/Typography Scale]] · [[06 - Design System/Spacing Scale]] · [[06 - Design System/Grid System]]
- [[06 - Design System/Accessibility]] — umbrales WCAG y foco
- [[06 - Design System/Components]] — catálogo transversal (presentación + web)
- [[04 - Presentation Design/Charts]] — color de datos (fuera de la UI monocroma)
- [[02 - Brand System/Colores]] — 3 colores oficiales; skill `jdh-imagen-corporativa` (logo, tipografía, tono)
- [[00 - Home/Conocimiento Faltante]] — pendiente: conversión Centrale Sans .otf → .woff2
