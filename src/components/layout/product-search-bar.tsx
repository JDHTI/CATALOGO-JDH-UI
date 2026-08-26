"use client"

import * as React from "react"
import type { Route } from "next"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"

import { useMontado } from "@/hooks/use-montado"
import { cn } from "@/lib/utils"

const RUTA_CATALOGO = "/productos"

/**
 * Buscador del header (logo → ESTO → contacto): campo de texto y botón de
 * envío en un único contenedor con borde.
 *
 * Es el ÚNICO buscador de la aplicación. El listado tenía el suyo propio y se
 * retiró: dos campos de búsqueda en la misma pantalla obligan a adivinar cuál
 * manda. Este escribe `?q=` en `/productos`, que es lo que lee `CatalogoView`.
 *
 * Por eso está sincronizado con la URL en ambos sentidos: muestra el término
 * activo cuando estás en el catálogo (aunque hayas llegado por un enlace o
 * con el botón atrás) y lo limpia al salir. Y al buscar CONSERVA los filtros
 * de proveedor y marca ya puestos — el API los combina con el término, así
 * que buscar dentro de un proveedor es justo lo que el usuario espera—,
 * reiniciando solo la paginación.
 *
 * Fondo `--color-paper` (blanco fijo, no reactivo al tema) a propósito: sobre
 * el chrome negro del header, un buscador blanco resalta como el elemento de
 * acción principal de la franja — por eso su texto usa los tokens
 * `on-paper`, no los `on-ink` del resto del header.
 */
/**
 * El buscador vive en el header, o sea en el layout de TODAS las rutas del
 * catálogo, y lee `useSearchParams`. Sin este límite de Suspense, Next se
 * niega a prerenderizar cualquier ruta estática del grupo (`/carrito`,
 * `/favoritos`…) y el build falla. El fallback es el mismo formulario con
 * estado local: durante el prerender se ve y se puede teclear igual, y al
 * hidratar toma el relevo la versión conectada a la URL.
 */
export function ProductSearchBar({ className }: { className?: string }) {
  return (
    <React.Suspense fallback={<BuscadorLocal className={className} />}>
      <BuscadorConectado className={className} />
    </React.Suspense>
  )
}

/** Versión del prerender: escribe y navega, pero no lee la URL. */
function BuscadorLocal({ className }: { className?: string }) {
  const router = useRouter()
  const [valor, setValor] = React.useState("")

  return (
    <FormularioBusqueda
      className={className}
      valor={valor}
      onValor={setValor}
      onEnviar={() => {
        const termino = valor.trim()
        router.push(
          (termino
            ? `${RUTA_CATALOGO}?q=${encodeURIComponent(termino)}`
            : RUTA_CATALOGO) as Route
        )
      }}
    />
  )
}

function BuscadorConectado({ className }: { className?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const montado = useMontado()

  const enCatalogo = pathname === RUTA_CATALOGO
  const termino = enCatalogo ? (searchParams.get("q") ?? "") : ""

  const [valor, setValor] = React.useState(termino)

  // Re-sincroniza durante el render cuando la URL cambia desde fuera: enlace
  // a `/productos?q=…`, botón atrás, o "Limpiar" en el estado vacío del
  // listado. Es el patrón oficial de React para estado derivado, sin effect.
  const [terminoPrevio, setTerminoPrevio] = React.useState(termino)
  if (termino !== terminoPrevio) {
    setTerminoPrevio(termino)
    setValor(termino)
  }

  function navegar(nuevoTermino: string) {
    // Partir de los params actuales conserva proveedor y marca; fuera del
    // catálogo se empieza en limpio.
    const params = new URLSearchParams(enCatalogo ? searchParams : undefined)
    if (nuevoTermino) params.set("q", nuevoTermino)
    else params.delete("q")
    params.delete("pagina")

    const query = params.toString()
    router.push(`${RUTA_CATALOGO}${query ? `?${query}` : ""}` as Route)
  }

  return (
    <FormularioBusqueda
      className={className}
      // Hasta montar se pinta vacío, igual que el HTML del servidor y que el
      // fallback del Suspense. Si aquí se volcara el término de la URL, el
      // `value` del input diferiría del servido y React tiraría el árbol con
      // un error de hidratación.
      valor={montado ? valor : ""}
      onValor={setValor}
      onEnviar={() => navegar(valor.trim())}
      // Solo cuando hay una búsqueda APLICADA: limpiar devuelve el catálogo
      // completo, así que es una acción sobre los resultados, no sobre el
      // texto que estás tecleando.
      onLimpiar={
        montado && termino
          ? () => {
              setValor("")
              navegar("")
            }
          : undefined
      }
    />
  )
}

/** Presentación compartida por las dos versiones. */
function FormularioBusqueda({
  className,
  valor,
  onValor,
  onEnviar,
  onLimpiar,
}: {
  className?: string
  valor: string
  onValor: (valor: string) => void
  onEnviar: () => void
  onLimpiar?: () => void
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onEnviar()
      }}
      role="search"
      aria-label="Buscar productos"
      className={cn(
        "flex h-11 w-full items-stretch rounded-lg border border-transparent bg-[var(--color-paper)] transition-colors focus-within:border-[var(--color-ink)]",
        className
      )}
    >
      <input
        type="search"
        value={valor}
        onChange={(event) => onValor(event.target.value)}
        placeholder="Buscar por nombre, código o marca…"
        aria-label="Buscar productos"
        className="min-w-0 flex-1 bg-transparent px-4 text-sm text-[var(--color-on-paper)] outline-none placeholder:text-[var(--color-on-paper-muted)] [&::-webkit-search-cancel-button]:appearance-none"
      />

      {onLimpiar ? (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={onLimpiar}
          className="flex shrink-0 items-center justify-center px-2 text-[var(--color-on-paper-muted)] transition-colors hover:text-[var(--color-on-paper)]"
        >
          <X className="size-4" />
        </button>
      ) : null}

      <button
        type="submit"
        aria-label="Buscar"
        className="flex shrink-0 items-center justify-center px-4 text-[var(--color-on-paper)] transition-colors hover:bg-[var(--color-paper-hover)]"
      >
        <Search className="size-4" />
      </button>
    </form>
  )
}
