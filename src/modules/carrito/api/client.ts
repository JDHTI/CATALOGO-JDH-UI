import type { z } from "zod"

import {
  aCarrito,
  aPedido,
  aResultadoCompraLista,
  aResumenFinalizar,
  carritoDtoSchema,
  compraListaDtoSchema,
  errorCarritoDtoSchema,
  noDisponiblesDtoSchema,
  pedidoDtoSchema,
  resumenFinalizarDtoSchema,
} from "../schemas/api"
import type {
  Carrito,
  Pedido,
  ResultadoCompraLista,
  ResumenFinalizar,
} from "../types"

/**
 * Cliente del carrito y los pedidos: habla con los route handlers de ESTA
 * app (`/api/carrito/*`, `/api/pedidos/*`), que reenvían al API con el JWT
 * del empleado. Nada de token ni base URL aquí: mismo origen, cookie sola.
 *
 * Toda operación del carrito devuelve el carrito COMPLETO: los hooks
 * reemplazan el estado con la respuesta en vez de recalcular nada.
 */

/**
 * `code` estable de los 409 del carrito: la UI ramifica por él, no por el
 * texto del mensaje. Un código que esta versión no conoce llega como string.
 */
export type CodigoErrorCarrito =
  "PRECIOS_CAMBIARON" | "NO_DISPONIBLES" | "CARRITO_VACIO" | "LIMITE_LINEAS"

/** Error del API con el estado y, en los 409, su `code` y sus datos. */
export class CarritoApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly code?: CodigoErrorCarrito | (string & {}),
    /** PRECIOS_CAMBIARON: el resumen nuevo a mostrar. */
    readonly resumen?: ResumenFinalizar,
    /** NO_DISPONIBLES: los productos que bloquean el envío. */
    readonly noDisponibles?: string[]
  ) {
    super(message)
    this.name = "CarritoApiError"
  }
}

async function pedir<Schema extends z.ZodType>(
  path: `/api/${"carrito" | "pedidos"}${string}`,
  schema: Schema,
  init: { method?: string; body?: unknown; signal?: AbortSignal } = {}
): Promise<z.infer<Schema>> {
  const respuesta = await fetch(path, {
    method: init.method ?? "GET",
    signal: init.signal,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init.body !== undefined && { "Content-Type": "application/json" }),
    },
    ...(init.body !== undefined && { body: JSON.stringify(init.body) }),
  })

  const cuerpo: unknown = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    const error = errorCarritoDtoSchema.safeParse(cuerpo)
    const datos = error.success ? error.data : undefined
    const mensaje =
      [datos?.message].flat().filter(Boolean).join(", ") ||
      `El carrito respondió ${respuesta.status}`
    // Los datos adjuntos se validan aparte: si el resumen no encajara, se
    // pierde solo el resumen, no el `code` ni el mensaje.
    const resumen = resumenFinalizarDtoSchema.safeParse(datos?.resumen)
    const noDisponibles = noDisponiblesDtoSchema.safeParse(datos?.noDisponibles)
    throw new CarritoApiError(
      respuesta.status,
      mensaje,
      datos?.code,
      resumen.success ? aResumenFinalizar(resumen.data) : undefined,
      noDisponibles.success ? noDisponibles.data : undefined
    )
  }
  return schema.parse(cuerpo)
}

const item = (productoId: string) =>
  `/api/carrito/items/${encodeURIComponent(productoId)}` as const

export async function obtenerCarrito(signal?: AbortSignal): Promise<Carrito> {
  return aCarrito(await pedir("/api/carrito", carritoDtoSchema, { signal }))
}

/** «Agregar al carrito»: SUMA `cantidad` a lo que ya haya. */
export async function agregarAlCarrito(
  productoId: string,
  cantidad: number
): Promise<Carrito> {
  return aCarrito(
    await pedir(item(productoId), carritoDtoSchema, {
      method: "POST",
      body: { quantity: cantidad },
    })
  )
}

/** Stepper: FIJA la cantidad (1..9999). */
export async function fijarCantidad(
  productoId: string,
  cantidad: number
): Promise<Carrito> {
  return aCarrito(
    await pedir(item(productoId), carritoDtoSchema, {
      method: "PUT",
      body: { quantity: cantidad },
    })
  )
}

export async function quitarDelCarrito(productoId: string): Promise<Carrito> {
  return aCarrito(
    await pedir(item(productoId), carritoDtoSchema, { method: "DELETE" })
  )
}

export async function comprarLista(
  listaId: string,
  modo: "sumar" | "reemplazar"
): Promise<ResultadoCompraLista> {
  return aResultadoCompraLista(
    await pedir(
      `/api/carrito/desde-lista/${encodeURIComponent(listaId)}`,
      compraListaDtoSchema,
      { method: "POST", body: { mode: modo } }
    )
  )
}

export async function obtenerResumenFinalizar(
  signal?: AbortSignal
): Promise<ResumenFinalizar> {
  return aResumenFinalizar(
    await pedir("/api/carrito/finalizar", resumenFinalizarDtoSchema, {
      signal,
    })
  )
}

/**
 * Envía el pedido. `totalEsperado` es el total MOSTRADO (centavos): viaja en
 * pesos, y si la lista cambió desde entonces el API responde 409 con el
 * resumen nuevo en vez de registrar un total que el empleado no aceptó.
 */
export async function enviarPedido(
  totalEsperado: number,
  nota: string
): Promise<Pedido> {
  const texto = nota.trim()
  return aPedido(
    await pedir("/api/carrito/finalizar", pedidoDtoSchema, {
      method: "POST",
      body: {
        totalEsperado: Math.round(totalEsperado / 100),
        ...(texto && { nota: texto }),
      },
    })
  )
}

export async function obtenerPedido(
  id: string,
  signal?: AbortSignal
): Promise<Pedido> {
  return aPedido(
    await pedir(`/api/pedidos/${encodeURIComponent(id)}`, pedidoDtoSchema, {
      signal,
    })
  )
}
