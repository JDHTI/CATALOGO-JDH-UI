"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  crearLista,
  eliminarItem,
  eliminarLista,
  establecerCantidad,
  listarItems,
  listarListas,
  renombrarLista,
} from "../api/client"

export const listasKeys = {
  all: ["listas"] as const,
  list: ["listas", "list"] as const,
  detail: (id: string) => ["listas", "detail", id] as const,
  items: (id: string, page: number, limit: number) =>
    ["listas", "items", id, page, limit] as const,
}

export function useListas() {
  return useQuery({
    queryKey: listasKeys.list,
    queryFn: ({ signal }) => listarListas(signal),
    staleTime: 15_000,
    retry: false,
  })
}

export function useListaItems(id: string | undefined) {
  return useQuery({
    queryKey: listasKeys.items(id ?? "none", 1, 100),
    queryFn: async ({ signal }) => {
      const first = await listarItems(id as string, { page: 1, limit: 100 }, signal)
      // La pertenencia debe abarcar toda la lista para no sobrescribir la
      // cantidad de un producto guardado en otra página al agregarlo.
      const data = [...first.data]
      for (let page = 2; page <= first.meta.totalPages; page++) {
        const next = await listarItems(id as string, { page, limit: 100 }, signal)
        data.push(...next.data)
      }
      return { ...first, data }
    },
    enabled: Boolean(id),
    staleTime: 5_000,
    retry: false,
  })
}

export function useCrearLista() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: crearLista,
    onSuccess: (lista) => {
      client.setQueryData(
        listasKeys.list,
        (previous: Awaited<ReturnType<typeof listarListas>> | undefined) =>
          previous
            ? {
                ...previous,
                data: [lista, ...previous.data],
                meta: { ...previous.meta, total: previous.meta.total + 1 },
              }
            : previous
      )
      client.invalidateQueries({ queryKey: listasKeys.list })
    },
  })
}

export function useRenombrarLista() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renombrarLista(id, name),
    onSuccess: (lista) => {
      client.invalidateQueries({ queryKey: listasKeys.list })
      client.setQueryData(listasKeys.detail(lista.id), lista)
    },
  })
}

export function useEliminarLista() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: eliminarLista,
    onSuccess: (_, id) => {
      client.removeQueries({ queryKey: listasKeys.detail(id) })
      client.removeQueries({ queryKey: ["listas", "items", id] })
      client.invalidateQueries({ queryKey: listasKeys.list })
    },
  })
}

export function useEstablecerCantidad() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ listaId, productoId, quantity }: { listaId: string; productoId: string; quantity: number }) =>
      establecerCantidad(listaId, productoId, quantity),
    onSuccess: (item, variables) => {
      client.setQueryData(
        listasKeys.items(variables.listaId, 1, 100),
        (previous: Awaited<ReturnType<typeof listarItems>> | undefined) =>
          previous
            ? {
                ...previous,
                data: previous.data.some((linea) => linea.productId === item.productId)
                  ? previous.data.map((linea) =>
                      linea.productId === item.productId ? item : linea
                    )
                  : [...previous.data, item],
                meta: { ...previous.meta, total: previous.meta.total + (previous.data.some((linea) => linea.productId === item.productId) ? 0 : 1) },
              }
            : previous
      )
      client.invalidateQueries({ queryKey: listasKeys.list })
      client.invalidateQueries({ queryKey: ["listas", "items", variables.listaId] })
    },
  })
}

export function useEliminarItem() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ listaId, productoId }: { listaId: string; productoId: string }) =>
      eliminarItem(listaId, productoId),
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: listasKeys.items(variables.listaId, 1, 100) })
      client.invalidateQueries({ queryKey: listasKeys.list })
    },
  })
}
