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

/**
 * Base del API para una petición.
 *
 * `NEXT_PUBLIC_API_URL` puede ser ABSOLUTA (Vercel, local) o RELATIVA al origen
 * (`/api/v1`, en tienda.jdh.local, donde Caddy sirve UI y API en el mismo
 * origen). La relativa existe porque esa variable se hornea en el bundle: con
 * un host fijo, quien entra por la IP o por un nombre público pide los
 * productos a un `.local` que desde fuera no resuelve, y el catálogo queda
 * vacío. Relativa, el navegador la completa con el origen por el que entró.
 *
 * En el servidor no hay origen del que colgarla: ahí se usa `BACKEND_API_URL`,
 * el API por la red interna (el mismo que usan favoritos y listas).
 */
export function resolverApiBaseUrl(
  configurada: string | undefined,
  origenNavegador: string | undefined,
  interna: string | undefined
): string {
  const base = configurada || "http://localhost:8080/api/v1"
  if (!base.startsWith("/")) return base
  if (origenNavegador) return `${origenNavegador}${base}`
  if (interna) return interna
  throw new Error(
    `NEXT_PUBLIC_API_URL es relativa (${base}) y falta BACKEND_API_URL para las peticiones del servidor`
  )
}

function apiBaseUrl(): string {
  return resolverApiBaseUrl(
    process.env.NEXT_PUBLIC_API_URL,
    typeof window === "undefined" ? undefined : window.location.origin,
    process.env.BACKEND_API_URL
  ).replace(/\/+$/, "")
}

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
  console.warn(`[catalogo] ${detalle} — API en ${apiBaseUrl()}`)
}

/**
 * `signal` viene del `queryFn` de TanStack Query, que lo aborta cuando la
 * consulta queda obsoleta (el componente se desmonta, o llega un término de
 * búsqueda más nuevo). Sin él, teclear "coca cola" deja tres peticiones vivas
 * compitiendo por pintar el mismo panel: trabajo que el backend ya hizo para
 * nada y, con muchos usuarios simultáneos, carga puramente desperdiciada.
 */
/**
 * De dónde salen los productos.
 *
 * - `publico`: directo al API, sin token. Cacheable y compartido — es la
 *   inmensa mayoría del tráfico (anónimos y clientes).
 * - `empleado`: por el route handler `/api/productos/*` de ESTA app, que
 *   reenvía al API con el JWT del usuario (`backendFetch`). El token no sale
 *   del servidor; desde el navegador la autoridad sigue siendo la cookie. El
 *   API responde lo mismo más `precioEmpleado`.
 *
 * Solo `/products*` tiene variante de empleado: el resto de endpoints no lleva
 * precio y sigue público.
 */
export type FuenteProductos = "publico" | "empleado"

/** `/products/x` → `/api/productos/x` en el origen actual. */
function urlEmpleado(path: `/${string}`): string | null {
  if (typeof window === "undefined") return null
  if (path !== "/products" && !path.startsWith("/products/")) return null
  return `${window.location.origin}/api/productos${path.slice("/products".length)}`
}

/**
 * Fallos del puente de empleados que NO deben dejar el catálogo en blanco: sin
 * sesión (401, p. ej. la cookie caducó), puente sin configurar (501) o API
 * inalcanzable (502/503). Se cae al público: el empleado ve el catálogo sin
 * su precio en vez de un error. Un 404 o un 400 sí se propagan — dicen algo
 * del recurso, no del puente.
 */
const FALLOS_DEL_PUENTE = new Set([401, 501, 502, 503])

async function apiGet<Schema extends z.ZodType>(
  path: `/${string}`,
  schema: Schema,
  params?: Record<string, string | number | undefined>,
  signal?: AbortSignal,
  fuente: FuenteProductos = "publico"
): Promise<z.infer<Schema>> {
  const viaEmpleado = fuente === "empleado" ? urlEmpleado(path) : null
  const url = new URL(viaEmpleado ?? `${apiBaseUrl()}${path}`)
  for (const [clave, valor] of Object.entries(params ?? {})) {
    if (valor !== undefined && valor !== "") {
      url.searchParams.set(clave, String(valor))
    }
  }

  const respuesta = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
    // Respuesta privada del empleado: nunca a ninguna caché compartida.
    ...(viaEmpleado && { cache: "no-store" as const }),
  })

  if (viaEmpleado && FALLOS_DEL_PUENTE.has(respuesta.status)) {
    avisarDegradacion(
      `empleado-${respuesta.status}`,
      `/api/productos respondió ${respuesta.status}: el catálogo cae al API público, SIN precio de empleado`
    )
    return apiGet(path, schema, params, signal, "publico")
  }

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
  signal?: AbortSignal,
  fuente: FuenteProductos = "publico"
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
          signal,
          fuente
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
    await apiGet("/products", paginaProductosDtoSchema, query, signal, fuente)
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
  signal?: AbortSignal,
  fuente: FuenteProductos = "publico"
): Promise<Paginado<Producto>> {
  try {
    return await pedirDestacados(limit, signal, fuente)
  } catch (error) {
    if (error instanceof CatalogoApiError && error.statusCode === 404) {
      avisarDegradacion(
        "destacados",
        "el API no publica GET /products/destacados (404): la vitrina cae al listado, sin reparto por marca ni rotación"
      )
      return listarProductos({ limit, orderBy: "conImagen" }, signal, fuente)
    }
    throw error
  }
}

async function pedirDestacados(
  limit?: number,
  signal?: AbortSignal,
  fuente: FuenteProductos = "publico"
): Promise<Paginado<Producto>> {
  const dto = await apiGet(
    "/products/destacados",
    paginaProductosDtoSchema,
    { limit },
    signal,
    fuente
  )
  return aPaginaProductos(dto)
}

/** `GET /products/:id` — detalle de un producto. */
export async function obtenerProducto(
  id: string,
  signal?: AbortSignal,
  fuente: FuenteProductos = "publico"
): Promise<Producto> {
  const dto = await apiGet(
    `/products/${encodeURIComponent(id)}`,
    productoDtoSchema,
    undefined,
    signal,
    fuente
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
