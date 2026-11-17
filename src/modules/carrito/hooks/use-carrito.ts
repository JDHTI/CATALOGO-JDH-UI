"use client"

import { useMutation, useQuery } from "@tanstack/react-query"

import { useCurrentUser } from "@/hooks/use-current-user"
import { getQueryClient } from "@/lib/query-client"

import {
  agregarAlCarrito,
  comprarLista,
  enviarPedido,
  fijarCantidad,
  obtenerCarrito,
  obtenerPedido,
  obtenerResumenFinalizar,
  quitarDelCarrito,
  vaciarCarrito,
} from "../api/client"
import type { Carrito, Pedido } from "../types"

/**
 * Hooks del carrito de EMPLEADOS.
 *
 * Usan SIEMPRE el `QueryClient` global (`getQueryClient()`, el singleton del
 * navegador) y no el del contexto: «Comprar esta lista» vive dentro de la
 * vista de listas, que monta su propio `QueryClientProvider` aislado. Con el
 * del contexto, el contador del header no se enteraría de esa compra.
 */

export const carritoKeys = {
  carrito: ["carrito"] as const,
  finalizar: ["carrito", "finalizar"] as const,
  pedido: (id: string) => ["pedidos", id] as const,
}

/** La sesión es de personal JDH (Entra): única audiencia del carrito. */
export function useEsEmpleado(): boolean {
  const { user } = useCurrentUser()
  return user?.empleado === true
}

/**
 * El carrito del empleado: contador del header y pantalla `/carrito`.
 * Deshabilitado para anónimos y clientes, que no tienen carrito (el API les
 * respondería 401/403 en cada página).
 */
export function useCarrito() {
  const empleado = useEsEmpleado()
  return useQuery(
    {
      queryKey: carritoKeys.carrito,
      queryFn: ({ signal }) => obtenerCarrito(signal),
      enabled: empleado,
      staleTime: 30 * 1000,
      retry: false,
    },
    getQueryClient()
  )
}

/** Toda mutación devuelve el carrito completo: se REEMPLAZA el estado. */
function guardarCarrito(carrito: Carrito) {
  const client = getQueryClient()
  client.setQueryData(carritoKeys.carrito, carrito)
  // El resumen de finalizar depende del carrito: se recalcula al volver.
  client.invalidateQueries({ queryKey: carritoKeys.finalizar })
}

export function useAgregarAlCarrito() {
  return useMutation(
    {
      mutationFn: ({
        productoId,
        cantidad,
      }: {
        productoId: string
        cantidad: number
      }) => agregarAlCarrito(productoId, cantidad),
      onSuccess: guardarCarrito,
    },
    getQueryClient()
  )
}

export function useFijarCantidad() {
  return useMutation(
    {
      mutationFn: ({
        productoId,
        cantidad,
      }: {
        productoId: string
        cantidad: number
      }) => fijarCantidad(productoId, cantidad),
      onSuccess: guardarCarrito,
    },
    getQueryClient()
  )
}

export function useQuitarDelCarrito() {
  return useMutation(
    {
      mutationFn: (productoId: string) => quitarDelCarrito(productoId),
      onSuccess: guardarCarrito,
    },
    getQueryClient()
  )
}

export function useVaciarCarrito() {
  return useMutation(
    { mutationFn: vaciarCarrito, onSuccess: guardarCarrito },
    getQueryClient()
  )
}

export function useComprarLista() {
  return useMutation(
    {
      mutationFn: ({
        listaId,
        modo,
      }: {
        listaId: string
        modo: "sumar" | "reemplazar"
      }) => comprarLista(listaId, modo),
      onSuccess: (resultado) => guardarCarrito(resultado.carrito),
    },
    getQueryClient()
  )
}

/**
 * Resumen para finalizar. `staleTime: 0` a propósito: el total que se
 * muestra es el que viaja como `totalEsperado`, así que tiene que ser el
 * vigente al entrar a la pantalla.
 */
export function useResumenFinalizar() {
  const empleado = useEsEmpleado()
  return useQuery(
    {
      queryKey: carritoKeys.finalizar,
      queryFn: ({ signal }) => obtenerResumenFinalizar(signal),
      enabled: empleado,
      staleTime: 0,
      retry: false,
    },
    getQueryClient()
  )
}

/**
 * Envío del pedido. Al registrarse, el API vacía el carrito: se refleja en
 * la caché y se siembra el pedido para que la confirmación pinte sin esperar.
 */
export function useEnviarPedido() {
  return useMutation(
    {
      mutationFn: ({
        totalEsperado,
        nota,
      }: {
        totalEsperado: number
        nota: string
      }) => enviarPedido(totalEsperado, nota),
      onSuccess: (pedido: Pedido) => {
        const client = getQueryClient()
        client.setQueryData(carritoKeys.pedido(pedido.id), pedido)
        client.removeQueries({ queryKey: carritoKeys.finalizar })
        client.invalidateQueries({ queryKey: carritoKeys.carrito })
      },
    },
    getQueryClient()
  )
}

export function usePedido(id: string) {
  const empleado = useEsEmpleado()
  return useQuery(
    {
      queryKey: carritoKeys.pedido(id),
      queryFn: ({ signal }) => obtenerPedido(id, signal),
      enabled: empleado,
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
    getQueryClient()
  )
}
