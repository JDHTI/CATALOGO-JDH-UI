import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { JdhButton } from "@/components/common/jdh-button"

/**
 * Salida de la pantalla de ingreso hacia el catálogo público.
 *
 * `/ingreso` es la única ruta de la app sin chrome —sin header, sin menú, sin
 * footer—, así que quien llega aquí (por un enlace, o desde `proxy.ts` al
 * pedir una ruta privada) se queda sin ninguna forma de volver que no sea el
 * botón atrás del navegador. Y ese ni siquiera sirve cuando la redirección lo
 * trajo: lo devolvería a la ruta protegida, que lo manda otra vez aquí.
 *
 * Deliberadamente delineado sobre tinta: el catálogo es la salida, no la
 * acción primaria que la pantalla propone, pero debe conservar contraste
 * sobre cualquiera de las tres fotografías.
 */
export function BackToCatalog() {
  return (
    <JdhButton
      asChild
      variant="outline-on-ink"
      size="sm"
      className="-ml-4 bg-[var(--color-ink)]/25 backdrop-blur-sm"
    >
      <Link href="/">
        <ArrowLeft />
        Volver al catálogo
      </Link>
    </JdhButton>
  )
}
