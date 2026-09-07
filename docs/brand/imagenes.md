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
- **Ubicación: la carpeta `site/banners/` del bucket**, no el repo. Se sube
  desde el repo del API y cambia el sitio sin desplegar (se refleja en ~5
  minutos):

  ```bash
  pnpm site-images:upload -- --categoria=banners --slug=home-desktop-1 --archivo=./pieza.png
  ```

- **El `--slug` tiene que ser exacto**, porque la UI no lista la carpeta: sabe
  de antemano qué nombres buscar. Los huecos publicados hoy son
  `home-desktop-1` + `home-mobile-1` y `home-desktop-2` + `home-mobile-2`
  (ojo: el formato va **antes** del índice) — la lista viva está en
  `src/modules/inicio/placements.ts`. Un archivo con otro nombre **no se
  muestra**, y un hueco sin su pieza de escritorio se omite.
- El slug nombra el **hueco, no la campaña**: para cambiar el creativo se
  sobreescribe `home-desktop-1`, no se sube `blackfriday-2026`. Así la URL
  nunca cambia. Añadir un TERCER banner sí requiere tocar el código.
- Rotan en el orden declarado en `placements.ts` (`home-1`, luego `home-2`).
- El comando reencoda a WebP, así que puedes entregar PNG/JPG/TIFF/AVIF.

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

- **El componente NO pone texto encima.** Hasta ahora reservaba el 45%
  izquierdo para un eyebrow, un titular y dos botones; se retiraron, porque el
  arte se cambia sin desplegar y cualquier copy del código puede contradecir la
  pieza vigente. **Todo el mensaje va horneado en el arte**, y ya no hay zona
  segura que respetar por el copy — la pieza se ve completa.
- **ENCUADRE, que sí condiciona la composición:** `object-cover` recorta.
  - **Escritorio (`md`+):** anclado al CENTRO. Con la caja más apaisada que el
    16:9 del master (1920×916 ≈ 2.1:1) se recorta arriba y abajo.
  - **Móvil (<768px):** anclado a la DERECHA (`object-right`). El viewport es
    angosto y alto, así que se ve una franja vertical del **lado derecho** de
    la pieza, completa. **Pon ahí el motivo principal**; el lado izquierdo es
    lo primero que se pierde en móvil.
- **Ubicación: la carpeta `site/hero/` del bucket**, con el slug
  **`home-desktop`**:

  ```bash
  pnpm site-images:upload -- --categoria=hero --slug=home-desktop --archivo=./hero.png
  ```

  La UI publica el primer slug de `HERO_SLUGS` que exista
  (`src/modules/inicio/placements.ts`; hoy `home-desktop` y, como alternativa,
  `home`). Se puede dejar el arte de la próxima campaña subido con otro nombre
  y activarlo cuando toque renombrándolo.

- El hero es **una sola pieza** para todos los anchos, solo cambia el anclaje
  del recorte. Aunque el slug diga `-desktop`, no hay un `home-mobile` en uso;
  si el recorte a la derecha no basta para móvil, la salida es una pieza propia
  y una segunda `<Image>` con `md:hidden`, como ya hacen los banners.

- **No hay respaldo local.** Sin pieza subida la sección se dibuja sin imagen
  (el copy es negro sobre fondo claro, sigue legible y con el mismo alto). El
  antiguo `public/photos/hero-alimentos.png` se retira del repo junto con los
  demás assets que pasan al bucket, así que el hero **depende** de que esta
  pieza exista.
- Peso objetivo: ≤ 400 KB. La pieza actual pesa 399 KB — justo en el límite.

## 4. Imágenes de producto

Vienen del bucket (`imagenUrl`), no del repo. Un solo master **cuadrado**
sirve a los cuatro usos, y desde el 2026-09-07 **todas las cajas son 1:1**, así
que el master se ve entero: `object-cover` sobre una caja cuadrada no recorta
nada. Antes la card era `aspect-[4/3]` y se comía ~12.5% arriba y abajo.

| Uso                    | Caja            | Ancho máx. en pantalla |
| ---------------------- | --------------- | ---------------------- |
| Card del listado       | `aspect-square` | 258px (4 columnas)     |
| Card en el homepage    | `aspect-square` | ~448px (carrusel)      |
| Detalle del producto   | `aspect-square` | ~696px                 |
| Miniatura del buscador | cuadrada        | 56px                   |

| Pieza  | **Exportar**    | Relación |
| ------ | --------------- | -------- |
| Master | **1600 × 1600** | 1:1      |

- Mínimo aceptable: 1200 × 1200. Por debajo, el detalle se ve blando.
- **Fondo blanco o gris neutro** (el catálogo es monocromo, ver `DESIGN.md`)
  y producto centrado con **~10% de aire alrededor**. Ese aire ahora se VE
  en todas las cajas: ya no hay recorte que lo absorba, así que un master con
  el producto pegado al borde se nota, y uno con demasiado aire deja el
  producto pequeño en la card. 10% es el punto medio.
- Peso objetivo: ≤ 120 KB.
- Sin imagen la UI no se rompe: `ProductoImagen` pinta un placeholder
  monocromo. Es parte del diseño, no un estado de error.
