import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useListaItems } from "@/modules/listas/hooks/use-listas"
import { listarItems } from "@/modules/listas/api/client"
import type { ListaItemsRespuesta } from "@/modules/listas/types"

vi.mock("@/modules/listas/api/client", () => ({
  listarItems: vi.fn(),
  listarListas: vi.fn(),
  crearLista: vi.fn(),
  eliminarLista: vi.fn(),
  renombrarLista: vi.fn(),
  establecerCantidad: vi.fn(),
  eliminarItem: vi.fn(),
}))

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Provider({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

function page(productId: string, current = 1, totalPages = 1): ListaItemsRespuesta {
  return {
    data: [{ productId, quantity: 7 } as ListaItemsRespuesta["data"][number]],
    meta: { page: current, limit: 100, total: totalPages, totalPages },
  }
}

describe("productos de listas privadas", () => {
  beforeEach(() => vi.resetAllMocks())

  it("incluye productos de otras páginas para preservar su cantidad al buscar", async () => {
    vi.mocked(listarItems).mockResolvedValueOnce(page("1", 1, 2)).mockResolvedValueOnce(page("101", 2, 2))
    const { result } = renderHook(() => useListaItems("lista-a"), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data.map((item) => [item.productId, item.quantity])).toEqual([["1", 7], ["101", 7]])
  })

  it("no muestra productos de la lista anterior mientras carga otra", async () => {
    vi.mocked(listarItems).mockResolvedValueOnce(page("1")).mockImplementationOnce(() => new Promise(() => {}))
    const { result, rerender } = renderHook(({ id }) => useListaItems(id), {
      initialProps: { id: "lista-a" }, wrapper: wrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    rerender({ id: "lista-b" })
    expect(result.current.data).toBeUndefined()
    expect(result.current.isPending).toBe(true)
  })
})
