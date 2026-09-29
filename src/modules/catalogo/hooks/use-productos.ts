"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { CatalogoApiError } from "../api/errors"
import {
  buscarProductos,
  listarDestacados,
  listarMarcas,
  listarProductos,
  listarProveedores,
  obtenerProducto,
} from "../api/client"
import type {
  MarcasQueryParams,
  Producto,
  ProductosQueryParams,
} from "../types"

/**
 * Hooks de lectura del catálogo (endpoints públicos, sin sesión). Toda la
 * data de productos en componentes cliente pasa por aquí — nunca `fetch`
 * suelto en un `useEffect` (convención del repo).
 *
 * No hay datos de relleno en ningún nivel: cuando el API no responde, el
 * consumidor recibe `isError` y decide si muestra un estado explícito (el
 * catálogo, donde el usuario vino a ver productos) o se oculta (las
 * secciones de la homepage).
 */

export const catalogoKeys = {
  productos: (params: ProductosQueryParams) =>
    ["catalogo", "productos", params] as const,
  producto: (id: string) => ["catalogo", "producto", id] as const,
  destacados: (limite: number) => ["catalogo", "destacados", limite] as const,
  mismaMarca: (marcaId: string, limite: number) =>
    ["catalogo", "misma-marca", marcaId, limite] as const,
  proveedores: ["catalogo", "proveedores"] as const,
  marcas: (params: MarcasQueryParams) =>
    ["catalogo", "marcas", params] as const,
}

/** Los ejes de clasificación son conjuntos pequeños y estables frente a los
 *  ~9.000 productos: vale una caché larga. */
const CLASIFICACION_STALE_MS = 5 * 60 * 1000

/** Listado paginado. `keepPreviousData` evita el "flash" de skeleton al
 *  cambiar de página o filtro: la página anterior queda visible (atenuada
 *  por la vista vía `isPlaceholderData`) mientras llega la nueva. */
export function useProductos(
  params: ProductosQueryParams,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: catalogoKeys.productos(params),
    queryFn: ({ signal }) => listarProductos(params, signal),
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
  })
}

/**
 * Vitrina de la home. La rotación del backend usa semilla del DÍA, así que la
 * respuesta es estable durante horas: no tiene sentido revalidarla al volver a
 * la pestaña ni al remontar el carrusel, y con `staleTime` corto sería la
 * consulta más repetida del sitio (la home es la ruta más visitada).
 */
const DESTACADOS_STALE_MS = 30 * 60 * 1000

export function useDestacados(limite: number) {
  return useQuery({
    queryKey: catalogoKeys.destacados(limite),
    queryFn: ({ signal }) => listarDestacados(limite, signal),
    staleTime: DESTACADOS_STALE_MS,
  })
}

/** ¿Tiene foto? Mismo criterio que la card: imagen primaria o galería. */
function tieneImagen(producto: Producto): boolean {
  return producto.imagenUrl != null || producto.imagenes.length > 0
}

/**
 * Hasta `limite` productos CON imagen de la misma marca que `producto`,
 * excluyéndolo — la sección "Más de la marca" de la ficha.
 *
 * El id de la marca sale de `producto.marcaId` cuando el API lo publica. Hasta
 * entonces se resuelve por NOMBRE entre las marcas del proveedor del producto
 * (`GET /brands?supplierId=`): acotado al proveedor, el nombre es inequívoco,
 * y esa lista ya suele estar en caché por los filtros del listado.
 *
 * Se pide `limite + 1` con `orderBy=conImagen` porque el propio producto puede
 * venir en la página; los que llegan sin foto (la marca tiene menos de
 * `limite` con imagen) se descartan en vez de rellenar con placeholders.
 * Sin `keepPreviousData`: al saltar de un producto a otro de marca distinta,
 * mostrar un instante la marca anterior sería mentir.
 */
export function useMismaMarca(producto: Producto, limite: number) {
  const nombreMarca = producto.marca.trim().toLowerCase()
  const resolverPorNombre = producto.marcaId == null && nombreMarca !== ""
  const marcas = useMarcas(
    { supplierId: producto.proveedor.id },
    { enabled: resolverPorNombre }
  )
  const marcaId =
    producto.marcaId ??
    marcas.data?.find((m) => m.nombre.trim().toLowerCase() === nombreMarca)
      ?.id ??
    null

  const query = useQuery({
    queryKey: catalogoKeys.mismaMarca(marcaId ?? "", limite),
    queryFn: ({ signal }) =>
      listarProductos(
        { brandId: marcaId!, orderBy: "conImagen", limit: limite + 1 },
        signal
      ),
    enabled: marcaId != null,
    staleTime: DESTACADOS_STALE_MS,
    select: (pagina) =>
      pagina.data
        .filter((p) => p.id !== producto.id && tieneImagen(p))
        .slice(0, limite),
  })

  // Sin marca resoluble no hay nada que pedir: se informa como "vacío", no
  // como "cargando para siempre". Ojo: una query deshabilitada queda en
  // `isPending` (TanStack v5), así que solo cuenta la que de verdad corre.
  const sinMarca =
    producto.marcaId == null &&
    (nombreMarca === "" || (marcas.isSuccess && marcaId == null))

  return {
    productos: query.data ?? [],
    isPending:
      !sinMarca &&
      ((resolverPorNombre && marcas.isPending) ||
        (marcaId != null && query.isPending)),
    isError: (resolverPorNombre && marcas.isError) || query.isError,
  }
}

/** Mínimo de caracteres antes de consultar el API desde el buscador. */
export const MIN_CARACTERES_BUSQUEDA = 1

/** Sugerencias por consulta. Son las que caben en el panel sin scroll. */
export const LIMITE_SUGERENCIAS = 5

/**
 * Cuánto se considera fresca una sugerencia ya traída. Cinco minutos, no el
 * minuto por defecto del `QueryClient`: el nombre de un producto no cambia
 * durante una sesión, y este número es el que decide cuántas veces un mismo
 * usuario vuelve a pedirle al API un término que ya buscó.
 */
const SUGERENCIAS_STALE_MS = 5 * 60 * 1000

/** Las sugerencias sobreviven toda la sesión en memoria: son 5 objetos por
 *  término, y volver a un término anterior debe abrir el panel sin red. */
const SUGERENCIAS_GC_MS = 30 * 60 * 1000

/**
 * Sugerencias del buscador del header (`ProductSearchBar`): las primeras
 * coincidencias del término que se está TECLEANDO, no una página del listado.
 * Es una query aparte de `useProductos` a propósito, y cada opción está aquí
 * por una razón de CARGA, no de UI — el buscador es el endpoint más caliente
 * de la tienda (se dispara mientras se teclea, en todas las rutas del
 * catálogo) y el que peor escala si se deja con los valores por defecto:
 *
 * - `limit` chico: el panel muestra 5, así que se piden 5 — no una página de
 *   12 de la que se descartan 7.
 * - `enabled`: con menos de `MIN_CARACTERES_BUSQUEDA` el API devolvería media
 *   bodega, y con el panel cerrado el resultado no se ve. Teclear con el
 *   panel cerrado (tras un Escape) no consume peticiones.
 * - `staleTime` de 5 min + `gcTime` de 30 min: borrar un caracter y volver a
 *   escribirlo, o repetir una búsqueda de hace un rato, sale de memoria.
 * - `retry: false`: es la opción MÁS importante con muchos usuarios a la vez.
 *   El default del `QueryClient` reintenta, y ante un 429 o un 5xx eso
 *   multiplica por cuatro la carga exactamente cuando el backend está
 *   sufriendo. Una sugerencia fallida no se reintenta: el usuario sigue
 *   tecleando y la siguiente pulsación ya genera otra consulta.
 * - `keepPreviousData`: mientras llega el término nuevo se mantienen las
 *   sugerencias del anterior (la vista las atenúa con `isPlaceholderData`),
 *   así el panel no parpadea vacío en cada pulsación.
 *
 * Y el `queryFn` propaga el `signal`: TanStack Query aborta la petición
 * anterior cuando llega un término más nuevo, en vez de dejar tres corriendo.
 *
 * El debounce NO vive aquí: es responsabilidad del input (cuánto esperar
 * antes de considerar que el usuario terminó de teclear es una decisión de
 * interacción, no de caché).
 */
export function useBusquedaProductos(
  termino: string,
  { habilitada = true, limite = LIMITE_SUGERENCIAS, pagina = 1 } = {}
) {
  // Solo recorta los extremos: no modifica los caracteres internos del SKU.
  const search = termino.trim()
  const params: ProductosQueryParams = {
    search,
    limit: limite,
    page: pagina,
    searchMode: "nameOrSkuExact",
  }

  return useQuery({
    queryKey: catalogoKeys.productos(params),
    queryFn: ({ signal }) => buscarProductos(params, signal),
    enabled: habilitada && search.length >= MIN_CARACTERES_BUSQUEDA,
    staleTime: SUGERENCIAS_STALE_MS,
    gcTime: SUGERENCIAS_GC_MS,
    retry: false,
    placeholderData: keepPreviousData,
  })
}

/** Detalle de un producto. */
export function useProducto(id: string) {
  return useQuery({
    queryKey: catalogoKeys.producto(id),
    queryFn: ({ signal }) => obtenerProducto(id, signal),
    // Un 404 no se resuelve reintentando (el id no existe).
    retry: false,
  })
}

/** Proveedores — primer eje de clasificación. */
export function useProveedores() {
  return useQuery({
    queryKey: catalogoKeys.proveedores,
    queryFn: ({ signal }) => listarProveedores(signal),
    staleTime: CLASIFICACION_STALE_MS,
  })
}

/**
 * Marcas — segundo eje. `supplierId` las acota al proveedor seleccionado.
 *
 * `noImplementado` distingue "el backend todavía no publica /brands" (404)
 * de una caída real: con un 404 la UI oculta el eje marca en silencio en vez
 * de mostrar un error que el usuario no puede resolver.
 */
export function useMarcas(
  params: MarcasQueryParams = {},
  options: { enabled?: boolean } = {}
) {
  const query = useQuery({
    queryKey: catalogoKeys.marcas(params),
    queryFn: ({ signal }) => listarMarcas(params, signal),
    enabled: options.enabled ?? true,
    staleTime: CLASIFICACION_STALE_MS,
    retry: (intento, error) =>
      error instanceof CatalogoApiError && error.statusCode === 404
        ? false
        : intento < 2,
  })

  const noImplementado =
    query.error instanceof CatalogoApiError && query.error.statusCode === 404

  return { ...query, noImplementado }
}
