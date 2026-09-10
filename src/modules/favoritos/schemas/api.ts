import { z } from "zod"

/**
 * Contrato de favoritos, validado en la frontera igual que el del catálogo.
 *
 * Ojo con la topología: estos schemas NO describen al backend directamente,
 * sino a los route handlers de esta app (`/api/favoritos/*`), que son los que
 * hablan con el API del catálogo. El motivo es de seguridad, no de comodidad:
 * la llamada autenticada va firmada con un JWT de vida corta y ese token no
 * debe llegar nunca al navegador (`docs/despliegue.md` §9 — la autoridad en el
 * cliente es siempre la cookie de sesión). El route handler es el único punto
 * donde existe el token.
 *
 * El shape que devuelven es el mismo del API para que la traducción sea un
 * paso a paso y no una transformación con criterio propio.
 */

/** `GET /api/favoritos/ids` — ids + total, de una sola petición. */
export const favoritosIdsDtoSchema = z.object({
  ids: z.array(z.coerce.string()),
  total: z.number(),
})

export type FavoritosIdsDto = z.infer<typeof favoritosIdsDtoSchema>
