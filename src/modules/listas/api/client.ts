import {
  aLista,
  aListaItem,
  aListaItems,
  aListas,
  listaDtoSchema,
  listaErrorDtoSchema,
  listaItemDtoSchema,
  listaItemsDtoSchema,
  listasDtoSchema,
} from "../schemas/api"
import type {
  ListaItemsRespuesta,
  ListaPedido,
  ListasRespuesta,
} from "../types"

/** Error con código estable para que el editor no dependa de mensajes humanos. */
export class ListasApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message)
    this.name = "ListasApiError"
  }
}

export class ListasNoAutenticadoError extends ListasApiError {
  constructor() {
    super(401, "La sesión es necesaria para administrar listas", "UNAUTHENTICATED")
    this.name = "ListasNoAutenticadoError"
  }
}

async function pedir<T>(
  path: "" | `/${string}`,
  schema: { parse: (value: unknown) => T },
  init?: RequestInit & { signal?: AbortSignal }
): Promise<T> {
  const respuesta = await fetch(`/api/listas${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })

  if (respuesta.status === 401) throw new ListasNoAutenticadoError()

  const cuerpo = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    const error = listaErrorDtoSchema.safeParse(cuerpo)
    const message = error.success
      ? [error.data.message].flat().filter(Boolean).join(", ")
      : `Listas respondió ${respuesta.status}`
    throw new ListasApiError(
      respuesta.status,
      message || `Listas respondió ${respuesta.status}`,
      error.success ? error.data.code : undefined
    )
  }

  return schema.parse(cuerpo)
}

export async function listarListas(signal?: AbortSignal): Promise<ListasRespuesta> {
  return aListas(await pedir("", listasDtoSchema, { signal }))
}

export async function crearLista(name: string): Promise<ListaPedido> {
  return aLista(
    await pedir("", listaDtoSchema, {
      method: "POST",
      body: JSON.stringify({ name }),
    })
  )
}

export async function obtenerLista(
  id: string,
  signal?: AbortSignal
): Promise<ListaPedido> {
  return aLista(
    await pedir(`/${encodeURIComponent(id)}`, listaDtoSchema, { signal })
  )
}

export async function renombrarLista(id: string, name: string): Promise<ListaPedido> {
  return aLista(
    await pedir(`/${encodeURIComponent(id)}`, listaDtoSchema, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    })
  )
}

export async function eliminarLista(id: string): Promise<void> {
  await pedirVacia(`/${encodeURIComponent(id)}`, { method: "DELETE" })
}

export async function listarItems(
  id: string,
  params: { page?: number; limit?: number } = {},
  signal?: AbortSignal
): Promise<ListaItemsRespuesta> {
  const query = new URLSearchParams()
  if (params.page) query.set("page", String(params.page))
  if (params.limit) query.set("limit", String(params.limit))
  const suffix = query.toString() ? `?${query}` : ""
  return aListaItems(
    await pedir(
      `/${encodeURIComponent(id)}/items${suffix}` as `/${string}`,
      listaItemsDtoSchema,
      { signal }
    )
  )
}

export async function establecerCantidad(
  listaId: string,
  productoId: string,
  quantity: number
) {
  return aListaItem(
    await pedir(
      `/${encodeURIComponent(listaId)}/items/${encodeURIComponent(productoId)}`,
      listaItemDtoSchema,
      { method: "PUT", body: JSON.stringify({ quantity }) }
    )
  )
}

export async function eliminarItem(
  listaId: string,
  productoId: string
): Promise<void> {
  await pedirVacia(
    `/${encodeURIComponent(listaId)}/items/${encodeURIComponent(productoId)}`,
    { method: "DELETE" }
  )
}

async function pedirVacia(path: `/${string}`, init: RequestInit): Promise<void> {
  const respuesta = await fetch(`/api/listas${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init.headers },
  })
  if (respuesta.status === 401) throw new ListasNoAutenticadoError()
  if (!respuesta.ok) {
    const cuerpo = listaErrorDtoSchema.safeParse(
      await respuesta.json().catch(() => null)
    )
    throw new ListasApiError(
      respuesta.status,
      cuerpo.success
        ? [cuerpo.data.message].flat().filter(Boolean).join(", ")
        : `Listas respondió ${respuesta.status}`,
      cuerpo.success ? cuerpo.data.code : undefined
    )
  }
}
