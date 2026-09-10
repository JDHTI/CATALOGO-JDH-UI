import { haciaElApi } from "../_backend"

/**
 * `GET /api/favoritos/ids` — ids de todos los favoritos, más el total.
 *
 * Es la consulta caliente: la pide el contador del header en cada carga y de
 * ella salen también los corazones marcados del grid. Por eso devuelve solo
 * ids y no productos.
 */
export async function GET() {
  return haciaElApi("/favorites/ids")
}
