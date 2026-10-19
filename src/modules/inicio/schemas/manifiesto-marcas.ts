import { z } from "zod"

/**
 * `{S3_PUBLIC_URL}/brands/manifest.json` — lo publica el API al subir logos
 * (contrato en `jdh-catalogo-api/docs/brand-media.md`). Solo se valida lo que
 * la UI usa; `version` y `generadoEn` se toleran sin leerse.
 *
 * Una entrada inválida no tumba la lista: se descarta y el resto se muestra.
 *
 * `marca` llega solo cuando el logo coincide con una marca del catálogo con
 * productos activos (si no, el API lo omite). Un `marca` inválido no descarta
 * el logo: se queda sin enlace, como uno sin match.
 */
const marcaCatalogo = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  nombre: z.string(),
})

const entradaMarca = z.object({
  slug: z.string().min(1),
  logo: z.url(),
  marca: marcaCatalogo.optional().catch(undefined),
})

export const manifiestoMarcasSchema = z.object({
  marcas: z.array(z.unknown()),
})

export function parsearMarcas(entradas: unknown[]) {
  return entradas.flatMap((entrada) => {
    const r = entradaMarca.safeParse(entrada)
    return r.success ? [r.data] : []
  })
}

/**
 * Acentos y siglas que el slug no puede devolver solo. Los slugs de tres
 * letras o menos se leen como sigla por regla (`mdc` → `MDC`).
 */
const NOMBRES_ESPECIALES: Record<string, string> = {
  "nescafe-dolcegusto": "Nescafé Dolce Gusto",
  nestle: "Nestlé",
  "la-coruna": "La Coruña",
}

const PARTICULAS = new Set(["de", "del", "la", "el", "y"])

/**
 * `harinera-del-valle` → `Harinera del Valle`. Es el `alt` del logo, no el
 * nombre del catálogo: el manifiesto no trae otro.
 */
export function nombreDesdeSlug(slug: string): string {
  const especial = NOMBRES_ESPECIALES[slug]
  if (especial) return especial
  if (slug.length <= 3) return slug.toUpperCase()

  return slug
    .split("-")
    .map((palabra, i) =>
      i > 0 && PARTICULAS.has(palabra)
        ? palabra
        : palabra.charAt(0).toUpperCase() + palabra.slice(1)
    )
    .join(" ")
}
