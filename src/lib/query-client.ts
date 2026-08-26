import {
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from "@tanstack/react-query"

/**
 * Reintento por defecto pensado para una tienda con muchos visitantes a la
 * vez, no para una app interna.
 *
 * El default de TanStack Query son 3 reintentos ante CUALQUIER error. Con
 * cientos de usuarios simultáneos y un API con rate limit por IP (100 req/60s
 * en jdh-catalogo-api), eso convierte un 429 o un 5xx puntual en cuatro veces
 * la carga justo cuando el backend está al límite: el clásico bucle en el que
 * los reintentos son la causa de que la caída siga.
 *
 * - 4xx NO se reintenta nunca: un 400, un 404 o un 429 no se arregla
 *   repitiendo la misma petición. Un 429 concretamente EMPEORA.
 * - 5xx y errores de red se reintentan UNA vez: cubre el corte de conexión
 *   momentáneo sin amplificar nada.
 *
 * El código se lee por duck typing (`statusCode`, la convención de errores de
 * NestJS que usa todo el backend) y no importando `CatalogoApiError`: esto es
 * `src/lib/`, y depender de un módulo desde aquí invertiría la dirección de
 * las dependencias. Cualquier error de API que lleve `statusCode` entra en la
 * regla sin tocar este archivo.
 */
function reintentar(intento: number, error: Error) {
  const status = (error as { statusCode?: unknown }).statusCode
  if (typeof status === "number" && status >= 400 && status < 500) return false
  return intento < 1
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: reintentar,
        // El catálogo cambia por una sincronización del ERP, no de un segundo
        // a otro: volver a la pestaña no justifica refrescar TODAS las queries
        // vivas. Con muchos usuarios, ese default es un pico de tráfico
        // correlacionado (todos vuelven a la pestaña a la misma hora) que no
        // aporta datos nuevos. Los datos se refrescan al vencer su `staleTime`.
        refetchOnWindowFocus: false,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}
