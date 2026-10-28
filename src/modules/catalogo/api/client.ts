import type { z } from "zod"

import type {
  Categoria,
  CategoriasQueryParams,
  Marca,
  MarcasQueryParams,
  Paginado,
  Producto,
  ProductosQueryParams,
  Proveedor,
} from "../types"
import {
  aCategoria,
  aMarca,
  aPaginaProductos,
  aProducto,
  aProveedor,
  apiErrorDtoSchema,
  categoriasDtoSchema,
  marcaDtoSchema,
  marcasDtoSchema,
  paginaProductosDtoSchema,
  productoDtoSchema,
  proveedoresDtoSchema,
} from "../schemas/api"

/**
 * Cliente del API público del catálogo (jdh-catalogo-api). Corre igual en
 * navegador y en servidor — endpoints PÚBLICOS, sin sesión: para llamadas
 * autenticadas existe `src/lib/api/backend-fetch.ts`, no este cliente.
 *
 * Cada respuesta se valida con zod y se traduce a dominio en `schemas/api.ts`;
 * los componentes nunca ven el DTO crudo.
 *
 * NO hay datos de relleno: esta es la única fuente de productos de la UI. Si
 * el backend no responde, las vistas muestran su estado de error o se
 * ocultan — nunca productos inventados.
 */

import { CatalogoApiError } from "./errors"

export { CatalogoApiError }

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1"

/**
 * Las degradaciones de abajo mantienen la página en pie cuando el API va por
 * detrás de la UI, pero calladas son una trampa: el catálogo se ve "bien" y
 * simplemente ignora lo que se le pidió. Ya pasó — se probó el orden por
 * imagen contra un contenedor con el build anterior y el listado salió
 * alfabético sin que nada lo dijera.
 *
 * Se avisa UNA vez por motivo (las queries se repiten en cada paginación y en
 * cada tecla del buscador) y solo fuera de producción: al visitante no le
 * sirve de nada, al que desarrolla le ahorra la hora de buscar el bug en la UI.
 */
const yaAvisado = new Set<string>()

function avisarDegradacion(motivo: string, detalle: string) {
  if (process.env.NODE_ENV === "production" || yaAvisado.has(motivo)) return
  yaAvisado.add(motivo)
  console.warn(`[catalogo] ${detalle} — API en ${API_BASE_URL}`)
}

/**
 * `signal` viene del `queryFn` de TanStack Query, que lo aborta cuando la
 * consulta queda obsoleta (el componente se desmonta, o llega un término de
 * búsqueda más nuevo). Sin él, teclear "coca cola" deja tres peticiones vivas
 * compitiendo por pintar el mismo panel: trabajo que el backend ya hizo para
 * nada y, con muchos usuarios simultáneos, carga puramente desperdiciada.
 */
async function apiGet<Schema extends z.ZodType>(
  path: `/${string}`,
  schema: Schema,
  params?: Record<string, string | number | undefined>,
  signal?: AbortSignal
): Promise<z.infer<Schema>> {
  const url = new URL(`${API_BASE_URL}${path}`)
  for (const [clave, valor] of Object.entries(params ?? {})) {
    if (valor !== undefined && valor !== "") {
      url.searchParams.set(clave, String(valor))
    }
  }

  const respuesta = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  })

  if (!respuesta.ok) {
    // Formato de error estándar de NestJS; si no matchea, cae al statusText.
    const cuerpo = apiErrorDtoSchema.safeParse(
      await respuesta.json().catch(() => null)
    )
    const mensaje = cuerpo.success
      ? [cuerpo.data.message].flat().join(", ")
      : respuesta.statusText
    throw new CatalogoApiError(respuesta.status, mensaje)
  }

  return schema.parse(await respuesta.json())
}

/**
 * `GET /products` — listado paginado con búsqueda y filtro por proveedor.
 *
 * `orderBy` es DEGRADABLE: un API anterior al ordenamiento por imagen responde
 * 400 a un parámetro que no conoce, y eso dejaría el catálogo entero en blanco
 * por una preferencia de orden. La UI y el API se despliegan por separado, así
 * que ese desfase es un estado normal, no una avería: se reintenta sin el
 * parámetro y el usuario ve el catálogo alfabético. Mismo criterio que el 404
 * de `/brands` en `useMarcas`.
 */
export async function buscarProductos(
  params: ProductosQueryParams,
  signal?: AbortSignal
): Promise<Paginado<Producto>> {
  const search = params.search?.trim()
  // Buscar el SKU antes de paginar por nombre evita que una coincidencia
  // exacta quede fuera de las primeras sugerencias. No convertir a número:
  // los ceros iniciales y los separadores forman parte del código.
  const exactos = await listarProductos(
    { ...params, search, searchMode: "skuExact" },
    signal
  )
  if (exactos.meta.total > 0) return exactos
  return listarProductos({ ...params, search, searchMode: "name" }, signal)
}

export async function listarProductos(
  params: ProductosQueryParams = {},
  signal?: AbortSignal
): Promise<Paginado<Producto>> {
  const query = {
    page: params.page,
    limit: params.limit,
    search: params.search,
    searchMode: params.searchMode,
    supplierId: params.supplierId,
    supplierIds: params.supplierIds?.join(","),
    brandIds: params.brandIds?.join(","),
    brandId: params.brandId,
    categoryIds: params.categoryIds?.join(","),
    categoryId: params.categoryId,
    subcategoryIds: params.subcategoryIds?.join(","),
    subcategoryId: params.subcategoryId,
  }

  if (params.orderBy) {
    try {
      return aPaginaProductos(
        await apiGet(
          "/products",
          paginaProductosDtoSchema,
          { ...query, orderBy: params.orderBy },
          signal
        )
      )
    } catch (error) {
      if (!(error instanceof CatalogoApiError) || error.statusCode !== 400) {
        throw error
      }
      avisarDegradacion(
        "orderBy",
        `el API rechazó orderBy=${params.orderBy} (400): el listado sale alfabético, los productos con imagen NO van primero`
      )
    }
  }

  return aPaginaProductos(
    await apiGet("/products", paginaProductosDtoSchema, query, signal)
  )
}

/**
 * `GET /products/destacados` — la vitrina de la home.
 *
 * Endpoint propio y no `listarProductos({ orderBy: "conImagen", limit: 8 })`
 * porque el criterio necesita ver TODO el conjunto, no una página: el backend
 * reparte por marca (round-robin con cupo) y rota con semilla del día en UTC.
 * Con el simple "primeros 8 con imagen" la home mostraría siempre las mismas
 * 8 referencias de una sola marca.
 *
 * Devuelve el mismo `{ data, meta }` que el listado — `meta` solo describe lo
 * devuelto (`totalPages: 1`), no hay paginación aquí.
 *
 * Degradable igual que `orderBy`: contra un API que aún no publica el endpoint
 * (404) se cae al listado ordenado por imagen. La vitrina pierde el reparto por
 * marca y la rotación, pero la home conserva su carrusel en vez de mostrar el
 * estado vacío por un endpoint que todavía no se desplegó.
 */
export async function listarDestacados(
  limit?: number,
  signal?: AbortSignal
): Promise<Paginado<Producto>> {
  try {
    return await pedirDestacados(limit, signal)
  } catch (error) {
    if (error instanceof CatalogoApiError && error.statusCode === 404) {
      avisarDegradacion(
        "destacados",
        "el API no publica GET /products/destacados (404): la vitrina cae al listado, sin reparto por marca ni rotación"
      )
      return listarProductos({ limit, orderBy: "conImagen" }, signal)
    }
    throw error
  }
}

async function pedirDestacados(
  limit?: number,
  signal?: AbortSignal
): Promise<Paginado<Producto>> {
  const dto = await apiGet(
    "/products/destacados",
    paginaProductosDtoSchema,
    { limit },
    signal
  )
  return aPaginaProductos(dto)
}

/** `GET /products/:id` — detalle de un producto. */
export async function obtenerProducto(
  id: string,
  signal?: AbortSignal
): Promise<Producto> {
  const dto = await apiGet(
    `/products/${encodeURIComponent(id)}`,
    productoDtoSchema,
    undefined,
    signal
  )
  return aProducto(dto)
}

/** `GET /suppliers` — lista completa de proveedores (para el filtro). */
export async function listarProveedores(
  signal?: AbortSignal
): Promise<Proveedor[]> {
  const dto = await apiGet(
    "/suppliers",
    proveedoresDtoSchema,
    undefined,
    signal
  )
  return dto.map(aProveedor)
}

/**
 * `GET /brands` — lista completa de marcas, opcionalmente acotada a un
 * proveedor. Segundo eje de clasificación del catálogo, junto al proveedor.
 */
export async function listarMarcas(
  params: MarcasQueryParams = {},
  signal?: AbortSignal
): Promise<Marca[]> {
  const dto = await apiGet(
    "/brands",
    marcasDtoSchema,
    {
      supplierId: params.supplierId,
      supplierIds: params.supplierIds?.join(","),
    },
    signal
  )
  return dto.map(aMarca)
}

/**
 * `GET /categories` — árbol categoría → subcategorías, ya ordenado para
 * navegación y solo con lo que tiene productos activos. Los `supplierIds` /
 * `brandIds` acotan los CONTEOS a lo elegido en el panel de filtros; no
 * esconden categorías por sí solos más allá de las que quedan en cero.
 */
export async function listarCategorias(
  params: CategoriasQueryParams = {},
  signal?: AbortSignal
): Promise<Categoria[]> {
  const dto = await apiGet(
    "/categories",
    categoriasDtoSchema,
    {
      supplierIds: params.supplierIds?.join(","),
      brandIds: params.brandIds?.join(","),
    },
    signal
  )
  return dto.map(aCategoria)
}

/**
 * `GET /brands/:slug` — la marca de su página. 404 si no existe, si no tiene
 * productos activos o si el slug está mal formado.
 */
export async function obtenerMarca(
  slug: string,
  signal?: AbortSignal
): Promise<Marca> {
  const dto = await apiGet(
    `/brands/${encodeURIComponent(slug)}`,
    marcaDtoSchema,
    undefined,
    signal
  )
  return aMarca(dto)
}
