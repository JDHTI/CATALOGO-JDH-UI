# Contenido editorial y SEO de productos

Contrato revisado en [API PR #6](https://github.com/JDHTI/CATALOGO-JDH-API/pull/6),
commit `472e7422de87b48504b2cd293703e7b58af90bef`, y en su
[`docs/product-content-migration.md`](https://github.com/JDHTI/CATALOGO-JDH-API/blob/472e7422de87b48504b2cd293703e7b58af90bef/docs/product-content-migration.md).

## Datos y presentación

`descripcionLarga` es **texto plano**, con párrafos separados por una línea
vacía. La guía del API indica que el importador rechaza HTML. La UI lo presenta
en `<section>` y `<p>` mediante React: escapa etiquetas, atributos y scripts,
sin interpretar HTML ni usar `dangerouslySetInnerHTML`.

El adaptador acepta campos ausentes durante el despliegue progresivo, `null`,
SEO parcial y cadenas vacías. Normaliza contenido editorial vacío a `null`.
Un tipo incorrecto sigue siendo un error de contrato; no se fabrica contenido.

La ficha omite la sección editorial pendiente. Conserva `descripcion` bajo
«Descripción ERP» en la ficha técnica: puede ser un código operativo.
Las cards del catálogo y la home muestran únicamente la identificación del
producto. `seo.description` se reserva para metadatos y `descripcionLarga`
para la ficha individual. El contrato actual no incluye un resumen editorial
breve para tarjetas; hasta que se publique uno, se omite ese párrafo sin
fabricarlo a partir del código ERP ni recortar textos genéricos del detalle.
Se conservan SKU, marca, fabricante, proveedor, categorías, `imagenUrl` y galería.
Se transporta también `imagenUrlFallback` cuando el API lo envíe: el DTO del
PR revisado todavía no lo publica. La imagen visible intenta variante,
`imagenUrl`, `imagenUrlFallback` y finalmente el placeholder, sin ciclos.

## Metadatos y datos estructurados

La página de detalle y `generateMetadata` comparten una consulta pública con
`React.cache`, limitada a diez segundos. El contenido llega en el HTML inicial;
no depende de un fetch posterior del navegador. La caché es por request.

| Salida                                           | Fuente                               | Fallback |
| ------------------------------------------------ | ------------------------------------ | -------- |
| title, OG title, Twitter title                   | `seo.title`                          | `nombre` |
| description, OG description, Twitter description | `seo.description`                    | `nombre` |
| Descripción visible                              | `descripcionLarga`                   | Se omite |
| JSON-LD description                              | `descripcionLarga` visible           | Se omite |
| OG/Twitter/JSON-LD image                         | Variante full primaria o `imagenUrl` | Se omite |

El título editorial es absoluto para evitar duplicar la marca con el template
del layout. Se reemplazan también los metadatos de Twitter y las imágenes
heredadas del sitio; un producto sin foto no anuncia la foto del camión.

`NEXT_PUBLIC_SITE_URL` configura el origen público de producción de la UI
(default existente: `https://catalogo.jdh.com.co`). Usar ese mismo origen en
previews. Canonical del detalle: `/productos/{id codificado}`, sin parámetros
de seguimiento. Canonical del listado: `/productos`, agrupando las variantes
de filtros y paginación del explorador. No se utiliza el SKU, el API o el CDN
para construir la identidad pública.

JSON-LD `Product` contiene nombre, URL y, solo si existen, SKU, marca,
descripción editorial e imagen primaria HTTP(S) absoluta. No agrega ofertas,
precios, disponibilidad, reseñas ni puntuaciones. No usa el respaldo de imagen
ni asume que las imágenes secundarias estén disponibles. La serialización
escapa `<` antes de insertarse como texto de un script JSON-LD; una cadena
`</script>` del API no puede cerrar el elemento.

## Estados y pruebas

`loading.tsx` anuncia la carga. Solo un 404 del API llama a `notFound()` y
muestra la salida al catálogo; Next agrega `noindex`. En streaming Next puede
haber enviado HTTP 200 antes de conocer el 404. Los errores de red, timeout,
429, 5xx y contrato se propagan al límite `error.tsx`, cuyo `retry` vuelve a
consultar el servidor (API de Next 16.3). No se publica JSON-LD de un producto
ausente o fallido. Los fallos de carga también emiten `noindex`, incluso si
el streaming ya envió HTTP 200. El listado conserva carga, vacío, filtros y reintento;
oculta la paginación anterior cuando falla la consulta.

- `pnpm test`: contratos completos, nulos y anteriores; llamadas de listado,
  destacados y detalle; SEO parcial; canonical; escape de HTML y JSON-LD;
  contenido SSR de componentes; estados de listado/detalle y fallos de imagen.
- `pnpm test:integration`: levanta Next y un API sintético en puertos temporales.
  Verifica respuestas HTTP completas con datos editoriales, pendientes,
  anteriores y hostiles; metadatos, canonical, JSON-LD parseable, ausencia de
  imágenes heredadas, una lectura por request, 404 y fallo de API.
- `pnpm typecheck`, `pnpm lint`, `pnpm build`.

Los datos sintéticos viven exclusivamente en `tests/`. La prueba HTTP define
credenciales ficticias para arrancar el módulo de auth; no consulta una base
real ni altera datos del backend. No prueba OAuth ni garantiza resultados
enriquecidos de Google. Para validar el despliegue final, repetir la inspección
con un producto editorial del API publicado y su URL pública.
