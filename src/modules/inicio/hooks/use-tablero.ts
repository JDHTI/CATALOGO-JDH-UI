"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"

/**
 * Tablero rotativo: un pool de N elementos del que solo se ven los primeros
 * `visibles`. El resto es la COLA. Rotar una celda la cambia por la cabeza de
 * la cola y manda la saliente al final, así que:
 *
 * - nunca hay dos celdas visibles con el mismo elemento (cada uno está en una
 *   sola posición del arreglo), y
 * - con el tiempo pasan todos: la cola es FIFO, nadie se queda sin turno.
 *
 * El número de visibles cambia con el breakpoint sin reacomodar nada: es solo
 * dónde se corta el mismo arreglo.
 */
export function rotarCelda<T>(orden: T[], visibles: number, celda: number) {
  if (orden.length <= visibles || celda >= visibles) return orden
  const siguiente = orden.slice()
  const [entrante] = siguiente.splice(visibles, 1)
  siguiente.push(siguiente[celda])
  siguiente[celda] = entrante
  return siguiente
}

/**
 * `cuantas` celdas distintas al azar entre las visibles, evitando las del
 * tick anterior para que el cambio se reparta por todo el tablero.
 */
export function elegirCeldas(
  visibles: number,
  cuantas: number,
  evitar: readonly number[] = [],
  azar: () => number = Math.random
): number[] {
  const candidatas = Array.from({ length: visibles }, (_, i) => i).filter(
    (i) => !evitar.includes(i)
  )
  const pool =
    candidatas.length >= cuantas
      ? candidatas
      : Array.from({ length: visibles }, (_, i) => i)
  const elegidas: number[] = []
  while (elegidas.length < Math.min(cuantas, pool.length)) {
    const i = pool[Math.floor(azar() * pool.length)]
    if (!elegidas.includes(i)) elegidas.push(i)
  }
  return elegidas
}

/** Fisher–Yates. */
export function barajar<T>(lista: readonly T[], azar = Math.random): T[] {
  const copia = lista.slice()
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

function suscribirVisibilidad(avisar: () => void) {
  document.addEventListener("visibilitychange", avisar)
  return () => document.removeEventListener("visibilitychange", avisar)
}

/** `false` con la pestaña en segundo plano. */
export function usePestanaVisible() {
  return useSyncExternalStore(
    suscribirVisibilidad,
    () => document.visibilityState === "visible",
    () => true
  )
}

export interface OpcionesTablero {
  /** Celdas visibles en el breakpoint actual. */
  visibles: number
  /** Rotar o no (en vista, pestaña visible, sin reduced-motion). */
  activo: boolean
  intervaloMs: number
  /** Celdas por tick: se elige al azar entre estos dos valores. */
  celdasPorTick: readonly [number, number]
  /** Desfase entre las celdas de un mismo tick. */
  desfaseMs: number
}

/**
 * Orden del tablero y su rotación. El primer render usa el orden recibido
 * (el del servidor, para que la hidratación coincida) y se baraja al montar:
 * cada visita arranca en otro punto del pool.
 *
 * Se vuelve a barajar solo si cambia el CONTENIDO de la lista (`clave`), no
 * su referencia: un nuevo payload RSC trae un arreglo nuevo con los mismos
 * logos, y rebarajar ahí cambiaría todas las celdas a la vez.
 */
export function useTablero<T>(
  elementos: readonly T[],
  clave: (elemento: T) => string,
  { visibles, activo, intervaloMs, celdasPorTick, desfaseMs }: OpcionesTablero
) {
  const [orden, setOrden] = useState<T[]>(() => elementos.slice())
  const ultimas = useRef<number[]>([])
  const firma = elementos.map(clave).join("\n")

  useEffect(() => {
    // Barajar en el servidor rompería la hidratación, y la ruta es estática:
    // sería el mismo orden para todos hasta el siguiente `revalidate`.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ver arriba
    setOrden(barajar(elementos))
    // `firma` y no `elementos`: ver el comentario de la función.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma])

  const rota = activo && elementos.length > visibles

  useEffect(() => {
    if (!rota) return

    const pendientes = new Set<ReturnType<typeof setTimeout>>()
    const tick = () => {
      const [min, max] = celdasPorTick
      const cuantas = min + Math.floor(Math.random() * (max - min + 1))
      const celdas = elegirCeldas(visibles, cuantas, ultimas.current)
      ultimas.current = celdas

      celdas.forEach((celda, n) => {
        const t = setTimeout(() => {
          pendientes.delete(t)
          setOrden((actual) => rotarCelda(actual, visibles, celda))
        }, n * desfaseMs)
        pendientes.add(t)
      })
    }

    const intervalo = setInterval(tick, intervaloMs)
    return () => {
      clearInterval(intervalo)
      pendientes.forEach(clearTimeout)
    }
  }, [rota, visibles, intervaloMs, celdasPorTick, desfaseMs])

  return orden
}
