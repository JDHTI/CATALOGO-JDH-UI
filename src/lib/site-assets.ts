/**
 * Imágenes generales del sitio (hero, banners) servidas desde el bucket.
 *
 * **No hay API de por medio, a propósito.** El backend las sube con
 * `pnpm site-images:upload` (jdh-catalogo-api) y NO expone controlador HTTP
 * para ellas: el frontend arma la URL por CONVENCIÓN, `S3_PUBLIC_URL` + una
 * key fija. Ver `docs/site-images.md` en el repo del API.
 *
 * El layout del bucket es:
 *
 *     site/hero/{slug}.webp
 *     site/banners/{slug}.webp
 *
 * y el `slug` nombra el **placement**, no la campaña (`home-desktop-1`, no
 * `blackfriday-2026`). Esa es la pieza clave del diseño: la URL nunca cambia,
 * mercadeo SOBREESCRIBE el archivo del placement. Por eso los slugs pueden
 * vivir en el código sin volver a necesitar un despliegue para cambiar el
 * arte — lo que cambia es el contenido del objeto, no su nombre.
 *
 * Productos y logos NO pasan por aquí: esos llegan con la URL completa en la
 * respuesta del API.
 */

/** Categorías que el API admite hoy (`SITE_IMAGE_CATEGORIES`). */
export type CategoriaImagenSitio = "hero" | "banners"

/**
 * Base pública del bucket — el MISMO valor que `S3_PUBLIC_URL` en el `.env`
 * del API. Hoy es el dominio público de Cloudflare R2 (`https://pub-….r2.dev`,
 * que sirve la RAÍZ del bucket, sin su nombre en la ruta); si algún día se
 * pone un Custom Domain delante, solo cambia esta variable.
 *
 * **Sin valor por defecto, a propósito.** Un default (el MinIO local, por
 * ejemplo) haría que un entorno mal configurado apuntara en silencio a un
 * bucket equivocado y diera 404 en todas las piezas, que es más difícil de
 * diagnosticar que no mostrarlas. Sin la variable, la portada usa sus
 * respaldos: el hero cae a la foto del repo y los banners no se dibujan.
 */
export const BASE_URL =
  process.env.NEXT_PUBLIC_ASSETS_CDN_URL?.replace(/\/+$/, "") ?? null

/**
 * URL pública de una pieza, o `null` si no hay bucket configurado. No
 * verifica que el objeto exista — ver `existeImagenSitio`.
 */
export function urlImagenSitio(
  categoria: CategoriaImagenSitio,
  slug: string
): string | null {
  if (!BASE_URL) return null
  return `${BASE_URL}/site/${categoria}/${slug}.webp`
}

/**
 * Cinco minutos, el mismo `max-age` con el que el API sube estas piezas
 * (`Cache-Control: public, max-age=300`). Alinear los dos números es lo que
 * hace que reemplazar un archivo se vea pronto: pedirle a Next que recuerde
 * la respuesta más tiempo que el propio objeto solo retrasaría el cambio.
 */
const REVALIDATE_S = 300

/**
 * URL de la pieza **si está subida**, `null` si no. Un `HEAD` al bucket,
 * cacheado por Next.
 *
 * La comprobación hace falta porque sin API no hay listado: la UI conoce el
 * nombre del placement pero no si el operador ya subió el archivo. Sin ella,
 * un placement vacío daría una imagen rota y el hero no podría caer a su
 * respaldo.
 *
 * Devuelve `null` también ante un error de red o sin bucket configurado —
 * mismo criterio que el resto del homepage: antes un respaldo honesto que una
 * imagen rota.
 */
export async function resolverImagenSitio(
  categoria: CategoriaImagenSitio,
  slug: string
): Promise<string | null> {
  const url = urlImagenSitio(categoria, slug)
  if (!url) return null

  try {
    const respuesta = await fetch(url, {
      method: "HEAD",
      next: { revalidate: REVALIDATE_S },
    })
    return respuesta.ok ? url : null
  } catch {
    return null
  }
}
