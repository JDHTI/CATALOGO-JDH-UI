import { z } from "zod"

import { productoDtoSchema, aProducto } from "@/modules/catalogo/schemas/api"

import type {
  ListaPedido,
  ListaPedidoItem,
  ListaItemsRespuesta,
  ListasMeta,
  ListasRespuesta,
} from "../types"

const listaDto = z.object({
  id: z.coerce.string(),
  name: z.string(),
  itemCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const listasMetaDtoSchema = z.object({
  total: z.number(),
  maxLists: z.number(),
})

export const listaItemDtoSchema = z.object({
  productId: z.coerce.string(),
  quantity: z.number().int().positive(),
  productActive: z.boolean(),
  product: productoDtoSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

const itemsMetaDtoSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
})

export const listasDtoSchema = z.object({
  data: z.array(listaDto),
  meta: listasMetaDtoSchema,
})

export const listaDtoSchema = listaDto

export const listaItemsDtoSchema = z.object({
  data: z.array(listaItemDtoSchema),
  meta: itemsMetaDtoSchema,
})

export const listaErrorDtoSchema = z
  .object({
    statusCode: z.number().optional(),
    message: z.union([z.string(), z.array(z.string())]).optional(),
    code: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough()

export type ListaDto = z.infer<typeof listaDto>
export type ListaItemDto = z.infer<typeof listaItemDtoSchema>

export function aLista(dto: ListaDto): ListaPedido {
  return dto
}

export function aListaItem(dto: ListaItemDto): ListaPedidoItem {
  return { ...dto, product: aProducto(dto.product) }
}

export function aListas(dto: z.infer<typeof listasDtoSchema>): ListasRespuesta {
  return {
    data: dto.data.map(aLista),
    meta: dto.meta,
  }
}

export function aListaItems(
  dto: z.infer<typeof listaItemsDtoSchema>
): ListaItemsRespuesta {
  return {
    data: dto.data.map(aListaItem),
    meta: dto.meta,
  }
}

export type { ListaPedido, ListaPedidoItem, ListasMeta }
