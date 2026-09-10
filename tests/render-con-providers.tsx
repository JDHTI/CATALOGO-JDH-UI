import type { ReactElement, ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render as renderRtl } from "@testing-library/react"
import { renderToStaticMarkup as renderToStaticMarkupReact } from "react-dom/server"

/**
 * Render de pruebas con los providers que la app SIEMPRE tiene.
 *
 * `src/app/layout.tsx` envuelve todo en `QueryProvider`, así que cualquier
 * componente de producto puede usar hooks de TanStack Query — hoy lo hace
 * `FavoritoBoton`, dentro de la card y de la ficha. Renderizar esos
 * componentes pelados sería probarlos en un árbol que no existe en ninguna
 * parte de la aplicación, y el fallo ("No QueryClient set") sería del montaje
 * de la prueba, no del componente.
 *
 * Un cliente NUEVO por render, con reintentos apagados: así una prueba no
 * hereda la caché de la anterior ni se queda esperando reintentos de una
 * consulta que en pruebas nunca va a responder.
 */
function crearClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

function ConProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={crearClient()}>{children}</QueryClientProvider>
  )
}

/** Igual que el `render` de RTL, con los providers de la app. */
export function render(ui: ReactElement) {
  return renderRtl(ui, { wrapper: ConProviders })
}

/** Igual que `renderToStaticMarkup`, con los providers de la app. */
export function renderToStaticMarkup(ui: ReactElement) {
  return renderToStaticMarkupReact(<ConProviders>{ui}</ConProviders>)
}

export { screen, fireEvent, within } from "@testing-library/react"
