"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { PERMISSIONS } from "@/config/permissions"
import { useCurrentUser } from "@/hooks/use-current-user"

import {
  agregarFavorito,
  listarFavoritos,
  obtenerFavoritosIds,
  quitarFavorito,
} from "../api/client"

/**
 * Hooks de favoritos. Toda la interacción del usuario pasa por aquí; los
 * componentes no llaman al cliente directamente.
 */

export const favoritosKeys = {
  ids: ["favoritos", "ids"] as const,
  pagina: (page: number, limit: number) =>
    ["favoritos", "pagina", page, limit] as const,
}

/** Cuántos favoritos caben en el badge antes de pasar a "99+". */
export const TOPE_CONTADOR = 99

/**
 * Ids + total de los favoritos del usuario. Es la fuente ÚNICA tanto del
 * contador del header como del estado de cada corazón, para que no puedan
 * contradecirse: si vinieran de dos consultas, un alta podría dejar el
 * corazón lleno y el contador sin mover.
 *
 * `enabled` por permiso y no solo por sesión: un usuario autenticado sin
 * `favoritos:read` (personal interno, por ejemplo) no tiene esta superficie,
 * y pedirla sería un 401 garantizado en cada carga de página.
 *
 * `retry: false` — los dos fallos esperables (sin sesión, endpoint aún no
 * publicado) no se arreglan reintentando, y esta consulta se dispara en
 * TODAS las rutas por el header.
 */
export function useFavoritosIds() {
  const { user, permissions, isPending: sesionPendiente } = useCurrentUser()
  const habilitada =
    !sesionPendiente &&
    Boolean(user) &&
    permissions.includes(PERMISSIONS.favoritos.read)

  const query = useQuery({
    queryKey: favoritosKeys.ids,
    queryFn: ({ signal }) => obtenerFavoritosIds(signal),
    enabled: habilitada,
    retry: false,
    staleTime: 60 * 1000,
  })

  return {
    ids: query.data?.ids ?? [],
    total: query.data?.total ?? 0,
    /**
     * Hay que pintar la interacción de favoritos en esta sesión.
     *
     * Exige que la consulta haya ido bien, no solo que no sea uno de los dos
     * fallos conocidos: si falla por cualquier otra causa —el API responde
     * 503 cuando no alcanza nuestro JWKS, por ejemplo— `ids` llega vacío y
     * los corazones se pintarían TODOS vacíos, afirmando que no hay nada
     * guardado cuando en realidad no lo sabemos. Ante la duda, no se ofrece
     * la interacción.
     */
    activo: habilitada && !query.isError,
    isPending: query.isPending && habilitada,
  }
}

/** Un producto concreto está en favoritos. */
export function useEsFavorito(productoId: string) {
  const { ids, activo } = useFavoritosIds()
  return { esFavorito: ids.includes(productoId), activo }
}

/**
 * Alta/baja con actualización OPTIMISTA sobre la caché de ids.
 *
 * Optimista a propósito: marcar un favorito es una acción de bajo riesgo y
 * altísima frecuencia, y esperar el ida y vuelta hace que el corazón se
 * sienta roto. Ante un fallo se revierte al valor exacto anterior (no a un
 * recálculo), y al terminar se invalida para reconciliar con el servidor.
 *
 * Se invalida también la página de favoritos: si el usuario quita uno desde
 * esa misma vista, la lista tiene que dejar de mostrarlo.
 */
export function useAlternarFavorito() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productoId,
      esFavorito,
    }: {
      productoId: string
      esFavorito: boolean
    }) =>
      esFavorito ? quitarFavorito(productoId) : agregarFavorito(productoId),

    onMutate: async ({ productoId, esFavorito }) => {
      await queryClient.cancelQueries({ queryKey: favoritosKeys.ids })
      const previo = queryClient.getQueryData<{
        ids: string[]
        total: number
      }>(favoritosKeys.ids)

      if (previo) {
        const ids = esFavorito
          ? previo.ids.filter((id) => id !== productoId)
          : [...previo.ids, productoId]
        // El total se AJUSTA en ±1; no se recalcula como `ids.length`. El API
        // recorta `ids` a 1000 pero `total` es el conteo real, así que con
        // 1500 favoritos llegan 1000 ids y `total: 1500`: derivar el total de
        // la longitud dejaría el contador en 1001 tras marcar uno.
        const total = Math.max(0, previo.total + (esFavorito ? -1 : 1))
        queryClient.setQueryData(favoritosKeys.ids, { ids, total })
      }

      return { previo }
    },

    onError: (_error, _variables, contexto) => {
      if (contexto?.previo) {
        queryClient.setQueryData(favoritosKeys.ids, contexto.previo)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoritosKeys.ids })
      queryClient.invalidateQueries({ queryKey: ["favoritos", "pagina"] })
    },
  })
}

/**
 * Página de favoritos con el producto completo, para la vista dedicada.
 *
 * `keepPreviousData` para que al cambiar de página la anterior siga visible
 * (atenuada por la vista con `isPlaceholderData`) en vez de parpadear a
 * esqueleto — el mismo trato que el listado del catálogo.
 */
export function useFavoritosPagina(page: number, limit: number) {
  return useQuery({
    queryKey: favoritosKeys.pagina(page, limit),
    queryFn: ({ signal }) => listarFavoritos({ page, limit }, signal),
    placeholderData: keepPreviousData,
    retry: false,
  })
}
