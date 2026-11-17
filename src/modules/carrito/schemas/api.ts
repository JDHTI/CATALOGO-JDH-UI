import { z } from "zod"

import { aProducto, productoDtoSchema } from "@/modules/catalogo/schemas/api"

import type {
  Carrito,
  LineaPedido,
  Pedido,
  ResultadoCompraLista,
  ResumenFinalizar,
} from "../types"

/**
 * DTOs de `/cart*` y `/orders*` (jdh-catalogo-api, `docs/carrito-pedidos.md`).
 * Importes en PESOS enteros; los mappers los pasan a centavos.
 */

const idSchema = z.coerce.string()
const pesos = z.number()
const pesosONull = z.number().nullable()

/** Pesos enteros del API → centavos del dominio. */
export const aCentavos = (valor: number) => Math.round(valor * 100)
const aCentavosONull = (valor: number | null) =>
  valor === null ? null : aCentavos(valor)

const lineaCarritoDtoSchema = z.object({
  productId: idSchema,
  cantidad: z.number().int(),
  producto: productoDtoSchema,
  disponible: z.boolean(),
  precioUnitario: pesosONull,
  totalLinea: pesosONull,
  precioCambio: z.boolean(),
})

export const carritoDtoSchema = z.object({
  items: z.array(lineaCarritoDtoSchema),
  resumen: z.object({
    lineas: z.number().int(),
    unidades: z.number().int(),
    subtotal: pesos,
    lineasNoDisponibles: z.number().int(),
  }),
})

export const compraListaDtoSchema = z.object({
  carrito: carritoDtoSchema,
  agregados: z.number().int(),
  omitidos: z.array(
    z.object({
      productId: idSchema,
      nombre: z.string(),
      motivo: z.enum(["inactivo", "sin_precio", "limite"]),
    })
  ),
})

const lineaPedidoDtoSchema = z.object({
  productId: idSchema,
  sku: z.string(),
  nombre: z.string(),
  cantidad: z.number().int(),
  precioUnitario: pesos,
  totalLinea: pesos,
})

const solicitanteDtoSchema = z.object({
  nombre: z.string(),
  email: z.string(),
})

export const resumenFinalizarDtoSchema = z.object({
  lineas: z.array(lineaPedidoDtoSchema),
  subtotal: pesos,
  impuestos: pesos,
  total: pesos,
  ivaPorConfirmar: z.boolean(),
  fechaFoto: z.string().nullish(),
  solicitante: solicitanteDtoSchema,
  noDisponibles: z.array(idSchema),
})

export const pedidoDtoSchema = z.object({
  id: idSchema,
  numero: z.string(),
  fecha: z.string(),
  solicitante: solicitanteDtoSchema,
  nota: z.string().nullish(),
  lineas: z.array(lineaPedidoDtoSchema),
  subtotal: pesos,
  impuestos: pesos,
  total: pesos,
  ivaPorConfirmar: z.boolean().nullish(),
  fechaFoto: z.string().nullish(),
  correo: z.enum(["pendiente", "enviado", "error", "deshabilitado"]),
})

/**
 * Cuerpo de los errores del API: NestJS, y en los 409 un `code` estable
 * (`PRECIOS_CAMBIARON`, `NO_DISPONIBLES`, `CARRITO_VACIO`, `LIMITE_LINEAS`)
 * con sus datos. `resumen` y `noDisponibles` quedan como `unknown` aquí y se
 * validan aparte en el cliente.
 */
export const errorCarritoDtoSchema = z
  .object({
    statusCode: z.number().optional(),
    message: z.union([z.string(), z.array(z.string())]).optional(),
    code: z.string().optional(),
    resumen: z.unknown().optional(),
    noDisponibles: z.unknown().optional(),
  })
  .passthrough()

export const noDisponiblesDtoSchema = z.array(idSchema)

/* ——— Mappers DTO → dominio ——— */

export function aCarrito(dto: z.infer<typeof carritoDtoSchema>): Carrito {
  return {
    lineas: dto.items.map((linea) => ({
      productoId: linea.productId,
      cantidad: linea.cantidad,
      producto: aProducto(linea.producto),
      disponible: linea.disponible,
      precioUnitario: aCentavosONull(linea.precioUnitario),
      totalLinea: aCentavosONull(linea.totalLinea),
      precioCambio: linea.precioCambio,
    })),
    resumen: { ...dto.resumen, subtotal: aCentavos(dto.resumen.subtotal) },
  }
}

export function aResultadoCompraLista(
  dto: z.infer<typeof compraListaDtoSchema>
): ResultadoCompraLista {
  return {
    carrito: aCarrito(dto.carrito),
    agregados: dto.agregados,
    omitidos: dto.omitidos.map((o) => ({
      productoId: o.productId,
      nombre: o.nombre,
      motivo: o.motivo,
    })),
  }
}

function aLineaPedido(dto: z.infer<typeof lineaPedidoDtoSchema>): LineaPedido {
  return {
    productoId: dto.productId,
    sku: dto.sku,
    nombre: dto.nombre,
    cantidad: dto.cantidad,
    precioUnitario: aCentavos(dto.precioUnitario),
    totalLinea: aCentavos(dto.totalLinea),
  }
}

export function aResumenFinalizar(
  dto: z.infer<typeof resumenFinalizarDtoSchema>
): ResumenFinalizar {
  return {
    lineas: dto.lineas.map(aLineaPedido),
    subtotal: aCentavos(dto.subtotal),
    impuestos: aCentavos(dto.impuestos),
    total: aCentavos(dto.total),
    ivaPorConfirmar: dto.ivaPorConfirmar,
    fechaFoto: dto.fechaFoto ?? null,
    solicitante: dto.solicitante,
    noDisponibles: dto.noDisponibles,
  }
}

export function aPedido(dto: z.infer<typeof pedidoDtoSchema>): Pedido {
  return {
    id: dto.id,
    numero: dto.numero,
    fecha: dto.fecha,
    solicitante: dto.solicitante,
    nota: dto.nota?.trim() || null,
    lineas: dto.lineas.map(aLineaPedido),
    subtotal: aCentavos(dto.subtotal),
    impuestos: aCentavos(dto.impuestos),
    total: aCentavos(dto.total),
    ivaPorConfirmar: dto.ivaPorConfirmar ?? false,
    fechaFoto: dto.fechaFoto ?? null,
    correo: dto.correo,
  }
}
