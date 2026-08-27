# Medidas de imagen — Catálogo JDH

Especificación para producir el arte del sitio. Las medidas NO son
arbitrarias: salen de los anchos reales del layout, que están fijados por
tokens en `src/app/globals.css`.

- `--container-wide` = **1440px** y el gutter lateral es `px-6` (24px por
  lado) ⇒ el **ancho útil del sitio es 1392px**. Nada del contenido pasa de
  ahí; el hero es la única pieza full-bleed.
- `--catalogo-chrome-height` = **10.25rem (164px)** — es lo que el header
  sticky le resta al hero.

## Formato

**WebP** en todo, calidad 80–85. Es el formato que sirve `next/image` por
defecto en Next 16, así que entregar el master ya en WebP evita una
transcodificación y mantiene el repo liviano. Excepciones: logos y marcas
siguen en PNG por la transparencia.

Los masters se exportan a **2x** del tamaño en pantalla (pantallas Retina).
`next/image` nunca escala hacia arriba: si el master es más chico que lo
pedido, se sirve borroso; si es más grande, Next lo baja solo. Por eso el 2x
es el techo, no una sugerencia.

## 1. Banners publicitarios del homepage

`src/modules/inicio/components/promo-banner.tsx` — debajo de la muestra del
catálogo. **Imagen completa: sin borde, sin degradado, sin texto encima del
componente.** Todo el mensaje va horneado en el arte.

| Pieza          | Caja en pantalla  | **Exportar (2x)** | Relación |
| -------------- | ----------------- | ----------------- | -------- |
| Ancha (≥768px) | 1392 × 310 px     | **2784 × 620**    | ≈ 4.5:1  |
| Móvil (<768px) | 100vw − 48px, 2:1 | **1440 × 720**    | 2:1      |

El ancho es el ancho útil completo del sitio, de margen a margen. Solo el
ALTO se recortó a dos tercios del original (464 → 310px), así que la franja
es más baja y más apaisada que la primera versión.

- La pieza de móvil es **opcional**. Sin ella, la ancha se recorta al centro
  con `object-cover` en móvil: sirve para un fondo, se come los bordes de
  cualquier texto horneado. Si el banner lleva tipografía, entrega las dos.
- **Zona segura:** 8% de margen interno en cada lado. Nada crítico ahí. Con
  la franja ya baja, el texto horneado no debería pasar de dos líneas.
- El bloque tiene 8px de radio en las esquinas (`--jdh-radius-md`): no pongas
  nada que se lea mal recortado en la esquina.
- Peso objetivo: ≤ 200 KB por pieza.
- Ubicación: `public/banners/home-1.webp`, `home-1-movil.webp`, …

## 2. Banner de la página de productos

`src/modules/catalogo/components/catalog-banner-carousel.tsx` — dentro de la
columna de resultados, no a todo el ancho: 1392 − 280 (panel de filtros) − 32
(gap) = **1080px**.

| Pieza      | Caja en pantalla | **Exportar (2x)** | Relación |
| ---------- | ---------------- | ----------------- | -------- |
| Escritorio | 1080 × 224 px    | **2160 × 448**    | ≈ 4.8:1  |

- Este banner **sí lleva texto encima**, puesto por el componente sobre un
  degradado oscuro que arranca a la izquierda. **Deja el 45% izquierdo sin
  motivo importante** — ahí van el título y el copy.
- En móvil la columna es full width y la caja baja a 192px de alto (≈1.8:1):
  la misma imagen se recorta al centro. Mantén el motivo en el tercio central.
- Peso objetivo: ≤ 180 KB.

## 3. Hero del homepage

`src/modules/inicio/components/hero-section.tsx` — full-bleed, alto
`100svh − 164px`. En un portátil de 1440×900 la caja es 1440 × 736; en un
monitor de 1920×1080, 1920 × 916.

| Pieza  | **Exportar**    | Relación |
| ------ | --------------- | -------- |
| Master | **2560 × 1440** | 16:9     |

- **Zona segura:** el copy va anclado a la IZQUIERDA (máx. 40ch dentro del
  container) y en negro de marca, sin velo oscuro. El 45% izquierdo tiene que
  ser claro y con poco detalle, o el texto deja de leerse.
- El encuadre se recorta al centro (`object-cover object-center`): en móvil
  se ve una franja vertical del centro. Compón pensando en ese recorte.
- Hoy el archivo es `public/photos/hero-alimentos.png` — **pasarlo a WebP**;
  un PNG a este tamaño es el activo más pesado de la página.
- Peso objetivo: ≤ 400 KB.

## 4. Imágenes de producto

Vienen del bucket (`imagenUrl`), no del repo. Un solo master **cuadrado**
sirve a los tres usos, porque todos recortan con `object-cover`:

| Uso                    | Caja            | Ancho máx. en pantalla |
| ---------------------- | --------------- | ---------------------- |
| Card del listado       | `aspect-[4/3]`  | 258px (4 columnas)     |
| Card en el homepage    | `aspect-[4/3]`  | ~448px (carrusel)      |
| Detalle del producto   | `aspect-square` | ~696px                 |
| Miniatura del buscador | cuadrada        | 56px                   |

| Pieza  | **Exportar**    | Relación |
| ------ | --------------- | -------- |
| Master | **1600 × 1600** | 1:1      |

- Mínimo aceptable: 1200 × 1200. Por debajo, el detalle se ve blando.
- **Fondo blanco o gris neutro** (el catálogo es monocromo, ver `DESIGN.md`)
  y producto centrado con **~10% de aire arriba y abajo**: la card recorta el
  12.5% superior y el 12.5% inferior del cuadrado para llegar a 4:3.
- Peso objetivo: ≤ 120 KB.
- Sin imagen la UI no se rompe: `ProductoImagen` pinta un placeholder
  monocromo. Es parte del diseño, no un estado de error.
