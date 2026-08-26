"use client"

import { useSyncExternalStore } from "react"

const sinSuscripcion = () => () => {}
const enCliente = () => true
const enServidor = () => false

/**
 * `false` durante el render del servidor y en el primer render del cliente;
 * `true` a partir de ahí.
 *
 * Sirve para que un componente que depende de algo que solo existe en el
 * navegador (la URL, `matchMedia`, una query ya resuelta en caché) pinte en
 * la hidratación exactamente el mismo HTML que mandó el servidor, y solo
 * después muestre el estado real. Sin esto React encuentra diferencias y
 * descarta el árbol con un error de hidratación.
 *
 * Va por `useSyncExternalStore` y no por un `useEffect` con `setState`: es el
 * mecanismo que React ofrece para leer fuentes externas —tiene un snapshot
 * de servidor explícito— y además la regla `react-hooks/set-state-in-effect`
 * prohíbe la otra vía, con razón (renders en cascada).
 */
export function useMontado(): boolean {
  return useSyncExternalStore(sinSuscripcion, enCliente, enServidor)
}
