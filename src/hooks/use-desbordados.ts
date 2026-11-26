"use client"

import * as React from "react"

/**
 * Para una fila `flex-wrap` de alto fijo con `overflow-hidden`: devuelve
 * cuántos hijos caben en el PRIMER renglón. El resto el CSS ya los recorta,
 * pero siguen en el DOM y se podrían enfocar con Tab sin verse; quien usa el
 * hook los marca `invisible` (que también los saca del orden de tabulación y
 * del árbol de accesibilidad).
 *
 * Se mide con `offsetTop` y no calculando anchos: el navegador ya hizo el
 * reparto de renglones, solo hay que leerlo. Y como los desbordados quedan
 * `invisible` (no `hidden`), conservan su caja y se vuelven a medir cuando la
 * fila crece. `ResizeObserver` sobre el contenedor cubre el cambio de ancho
 * de la ventana; `dependencias` cubre el cambio de los propios items.
 *
 * Antes de medir (SSR y primer pintado) devuelve `null`: todos los items se
 * pintan y el `overflow-hidden` recorta lo que sobre, sin salto de layout.
 */
export function useDesbordados<T extends HTMLElement>(
  dependencias: React.DependencyList
): [React.RefObject<T | null>, number | null] {
  const ref = React.useRef<T>(null)
  const [visibles, setVisibles] = React.useState<number | null>(null)

  React.useLayoutEffect(() => {
    const contenedor = ref.current
    if (!contenedor) return

    const medir = () => {
      const hijos = Array.from(contenedor.children) as HTMLElement[]
      if (hijos.length === 0) return setVisibles(0)
      const primerRenglon = hijos[0].offsetTop
      const caben = hijos.findIndex((hijo) => hijo.offsetTop > primerRenglon)
      setVisibles(caben === -1 ? hijos.length : caben)
    }

    medir()
    if (typeof ResizeObserver === "undefined") return
    const observador = new ResizeObserver(medir)
    observador.observe(contenedor)
    return () => observador.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- las dependencias las declara quien llama: son los datos que cambian los items.
  }, dependencias)

  return [ref, visibles]
}
