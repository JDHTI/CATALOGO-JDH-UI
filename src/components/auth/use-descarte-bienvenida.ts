"use client"

import * as React from "react"

/** Clave por usuario: descartar el saludo en una cuenta no lo descarta en otra. */
function clave(userId: string): string {
  return `jdh:bienvenida-descartada:${userId}`
}

/**
 * Evento propio para avisar del descarte dentro de ESTA pestaña. El evento
 * `storage` del navegador solo lo reciben las OTRAS, así que sin este el
 * componente que acaba de escribir no se enteraría de su propia escritura.
 */
const EVENTO_LOCAL = "jdh:bienvenida-descartada"

/**
 * Respaldo en memoria para cuando `localStorage` no se puede escribir (modo
 * privado, almacenamiento bloqueado por política). Sin esto el botón de cerrar
 * no haría nada en esos navegadores: la escritura falla en silencio y la
 * siguiente lectura devuelve lo de siempre. Con esto el saludo se cierra
 * durante la visita y vuelve en la próxima, que es la degradación razonable.
 */
const descartadasEnMemoria = new Set<string>()

function suscribir(alCambiar: () => void): () => void {
  window.addEventListener("storage", alCambiar)
  window.addEventListener(EVENTO_LOCAL, alCambiar)
  return () => {
    window.removeEventListener("storage", alCambiar)
    window.removeEventListener(EVENTO_LOCAL, alCambiar)
  }
}

/**
 * ¿El usuario ya cerró el saludo de bienvenida?
 *
 * Se resuelve con `useSyncExternalStore` y no con `useState` + `useEffect`
 * porque eso es literalmente lo que es: una lectura de un almacén externo
 * (`localStorage`) que además puede cambiar por fuera de React. React usa la
 * instantánea del servidor para el HTML —oculto, que es la opción segura— y
 * la del cliente en cuanto hidrata, sin desajuste de hidratación y sin un
 * `setState` dentro de un efecto. De regalo queda sincronizado entre pestañas:
 * cerrar el saludo en una lo cierra en todas.
 *
 * Devuelve `true` (descartada, es decir, no mostrar) mientras no haya usuario,
 * en el servidor, y si el almacenamiento está bloqueado y no se puede leer.
 */
export function useDescarteBienvenida(userId: string | null): {
  descartada: boolean
  descartar: () => void
} {
  const leerCliente = React.useCallback(() => {
    if (!userId) return true
    if (descartadasEnMemoria.has(userId)) return true
    try {
      return window.localStorage.getItem(clave(userId)) === "1"
    } catch {
      // Modo privado o almacenamiento bloqueado: se muestra el saludo. Un
      // saludo de más es mejor que un componente que revienta por no poder
      // recordar que ya se cerró.
      return false
    }
  }, [userId])

  const descartada = React.useSyncExternalStore(
    suscribir,
    leerCliente,
    () => true
  )

  const descartar = React.useCallback(() => {
    if (!userId) return
    descartadasEnMemoria.add(userId)
    try {
      window.localStorage.setItem(clave(userId), "1")
    } catch {
      // Ya quedó en memoria: se cierra durante esta visita y vuelve en la
      // siguiente, que es lo mejor que se puede hacer sin almacenamiento.
    }
    window.dispatchEvent(new Event(EVENTO_LOCAL))
  }, [userId])

  return { descartada, descartar }
}
