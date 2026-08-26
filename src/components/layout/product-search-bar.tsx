"use client"

import * as React from "react"
import type { Route } from "next"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"

import { BusquedaSugerencias } from "@/modules/catalogo/components/busqueda-sugerencias"
import {
  LIMITE_SUGERENCIAS,
  MIN_CARACTERES_BUSQUEDA,
  useBusquedaProductos,
} from "@/modules/catalogo/hooks/use-productos"
import { useMontado } from "@/hooks/use-montado"
import { cn } from "@/lib/utils"

const RUTA_CATALOGO = "/productos"

/**
 * Cuánto se espera tras la última pulsación antes de consultar el API. 220ms
 * es el punto en que un tecleo normal (≈150–200ms entre letras) produce UNA
 * petición por palabra y no una por letra, sin que la lista se sienta
 * retrasada al parar de escribir.
 */
const DEBOUNCE_MS = 220

/**
 * Buscador del header (logo → ESTO → accesos de cuenta): campo de texto,
 * botón de envío y un panel de SUGERENCIAS que se abre mientras se teclea.
 *
 * Es el ÚNICO buscador de la aplicación. El listado tenía el suyo propio y se
 * retiró: dos campos de búsqueda en la misma pantalla obligan a adivinar cuál
 * manda. Este escribe `?q=` en `/productos`, que es lo que lee `CatalogoView`.
 *
 * Dos caminos, no uno: el panel resuelve "quiero ESTE producto" (navega
 * directo al detalle) y el submit resuelve "quiero VER lo que hay" (navega al
 * listado con `?q=`). Ninguno reemplaza al otro — por eso el panel siempre
 * termina en un enlace al catálogo completo.
 *
 * Busca por NOMBRE de producto: es el único eje que un comprador tiene en la
 * cabeza al escribir. Los otros dos ejes del catálogo (proveedor y marca)
 * viven en el panel de filtros del listado, no aquí.
 *
 * Está sincronizado con la URL en ambos sentidos: muestra el término activo
 * cuando estás en el catálogo (aunque hayas llegado por un enlace o con el
 * botón atrás) y lo limpia al salir. Y al buscar CONSERVA los filtros de
 * proveedor y marca ya puestos — el API los combina con el término, así que
 * buscar dentro de un proveedor es justo lo que el usuario espera—,
 * reiniciando solo la paginación.
 *
 * Fondo `--color-paper` (blanco fijo, no reactivo al tema) a propósito: sobre
 * el chrome negro del header, un buscador blanco resalta como el elemento de
 * acción principal de la franja — por eso su texto usa los tokens
 * `on-paper`, no los `on-ink` del resto del header. El PANEL sí es
 * `bg-popover` (reactivo al tema): no está sobre el chrome negro, está sobre
 * el contenido de la página.
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
  const [valor, setValor] = React.useState("")

  return (
    <FormularioBusqueda
      className={className}
      valor={valor}
      onValor={setValor}
      construirHref={(termino) =>
        (termino
          ? `${RUTA_CATALOGO}?q=${encodeURIComponent(termino)}`
          : RUTA_CATALOGO) as Route
      }
    />
  )
}

function BuscadorConectado({ className }: { className?: string }) {
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

  const construirHref = React.useCallback(
    (nuevoTermino: string) => {
      // Partir de los params actuales conserva proveedor y marca; fuera del
      // catálogo se empieza en limpio.
      const params = new URLSearchParams(enCatalogo ? searchParams : undefined)
      if (nuevoTermino) params.set("q", nuevoTermino)
      else params.delete("q")
      params.delete("pagina")

      const query = params.toString()
      return `${RUTA_CATALOGO}${query ? `?${query}` : ""}` as Route
    },
    [enCatalogo, searchParams]
  )

  return (
    <FormularioBusqueda
      className={className}
      // Hasta montar se pinta vacío, igual que el HTML del servidor y que el
      // fallback del Suspense. Si aquí se volcara el término de la URL, el
      // `value` del input diferiría del servido y React tiraría el árbol con
      // un error de hidratación.
      valor={montado ? valor : ""}
      onValor={setValor}
      construirHref={construirHref}
      // Solo cuando hay una búsqueda APLICADA: limpiar devuelve el catálogo
      // completo, así que es una acción sobre los resultados, no sobre el
      // texto que estás tecleando.
      onLimpiar={montado && termino ? () => setValor("") : undefined}
    />
  )
}

/**
 * Presentación e interacción compartidas por las dos versiones: el input, el
 * combobox (panel de sugerencias + navegación con flechas) y el submit.
 */
function FormularioBusqueda({
  className,
  valor,
  onValor,
  construirHref,
  onLimpiar,
}: {
  className?: string
  valor: string
  onValor: (valor: string) => void
  /** Destino del listado para un término dado (conserva filtros vigentes). */
  construirHref: (termino: string) => Route
  onLimpiar?: () => void
}) {
  const router = useRouter()
  const montado = useMontado()
  const contenedorRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const idBase = React.useId()
  const listboxId = `${idBase}-sugerencias`
  const opcionId = React.useCallback(
    (indice: number) => `${idBase}-sugerencia-${indice}`,
    [idBase]
  )

  // El panel se abre al enfocar o teclear y se cierra explícitamente (Escape,
  // clic fuera, navegación). NO se cierra en `blur`: el blur llega antes que
  // el clic sobre una sugerencia y se lo comería.
  const [abiertoManual, setAbiertoManual] = React.useState(false)
  const [indiceActivo, setIndiceActivo] = React.useState(-1)

  // Debounce del término: el input responde a cada pulsación, el API no.
  const [terminoDiferido, setTerminoDiferido] = React.useState("")
  React.useEffect(() => {
    const siguiente = valor.trim()
    const id = window.setTimeout(
      () => setTerminoDiferido(siguiente),
      DEBOUNCE_MS
    )
    return () => window.clearTimeout(id)
  }, [valor])

  const consultable = terminoDiferido.length >= MIN_CARACTERES_BUSQUEDA
  const abierto = montado && abiertoManual && consultable

  // La query se ata a `abierto`, no solo al término: tras un Escape el usuario
  // puede seguir tecleando sin que el panel esté visible, y pedirle
  // sugerencias al API para algo que nadie va a ver es carga regalada. Al
  // reabrir, el término ya visitado sale de la caché sin red.
  const sugerencias = useBusquedaProductos(terminoDiferido, {
    habilitada: abierto,
    limite: LIMITE_SUGERENCIAS,
  })
  const productos = sugerencias.data?.data ?? []

  // El resaltado del teclado no sobrevive a un cambio de término: el producto
  // que estaba en la posición 3 ya no es el mismo. Estado derivado durante el
  // render, no un effect (mismo patrón que la sincronía con la URL).
  const [terminoResaltado, setTerminoResaltado] =
    React.useState(terminoDiferido)
  if (terminoDiferido !== terminoResaltado) {
    setTerminoResaltado(terminoDiferido)
    setIndiceActivo(-1)
  }

  const cerrar = React.useCallback(() => {
    setAbiertoManual(false)
    setIndiceActivo(-1)
  }, [])

  // Clic/tap fuera cierra el panel. Mismo mecanismo que `MegaMenu`
  // (`pointerdown` en document) para que un tap en móvil también cuente.
  React.useEffect(() => {
    if (!abierto) return

    const onPointerDown = (event: PointerEvent) => {
      if (contenedorRef.current?.contains(event.target as Node)) return
      cerrar()
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [abierto, cerrar])

  // Mantiene visible la opción resaltada al recorrer la lista con flechas.
  React.useEffect(() => {
    if (indiceActivo < 0) return
    document
      .getElementById(opcionId(indiceActivo))
      ?.scrollIntoView({ block: "nearest" })
  }, [indiceActivo, opcionId])

  function irA(href: Route) {
    cerrar()
    // Cierra el teclado en móvil: con el panel cerrado y la navegación en
    // curso, dejarlo abierto tapa media pantalla de resultados.
    inputRef.current?.blur()
    router.push(href)
  }

  function enviar() {
    irA(construirHref(valor.trim()))
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      // Con el panel abierto, Escape solo lo cierra (el término sigue ahí para
      // poder enviarlo); ya cerrado, el input mantiene el comportamiento nativo.
      if (abierto) {
        event.preventDefault()
        cerrar()
      }
      return
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!consultable) return
      event.preventDefault()
      // Flecha abajo con el panel cerrado lo vuelve a abrir sin teclear nada.
      if (!abierto) {
        setAbiertoManual(true)
        return
      }
      if (productos.length === 0) return
      setIndiceActivo((indice) => {
        if (event.key === "ArrowDown") return (indice + 1) % productos.length
        return indice <= 0 ? productos.length - 1 : indice - 1
      })
      return
    }

    if (event.key === "Enter" && abierto && indiceActivo >= 0) {
      const elegido = productos[indiceActivo]
      if (!elegido) return
      // Con una sugerencia resaltada, Enter va al producto, no al listado.
      event.preventDefault()
      irA(`/productos/${elegido.id}` as Route)
    }
  }

  return (
    <div ref={contenedorRef} className={cn("relative", className)}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          enviar()
        }}
        role="search"
        aria-label="Buscar productos"
        className="flex h-11 w-full items-stretch rounded-lg border border-transparent bg-[var(--color-paper)] transition-colors focus-within:border-[var(--color-ink)]"
      >
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={abierto}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            abierto && indiceActivo >= 0 ? opcionId(indiceActivo) : undefined
          }
          autoComplete="off"
          value={valor}
          onChange={(event) => {
            onValor(event.target.value)
            setAbiertoManual(true)
          }}
          onFocus={() => setAbiertoManual(true)}
          onKeyDown={onKeyDown}
          placeholder="Buscar productos por nombre…"
          aria-label="Buscar productos por nombre"
          className="min-w-0 flex-1 bg-transparent px-4 text-sm text-[var(--color-on-paper)] outline-none placeholder:text-[var(--color-on-paper-muted)] [&::-webkit-search-cancel-button]:appearance-none"
        />

        {onLimpiar ? (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => {
              onLimpiar()
              irA(construirHref(""))
            }}
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

      {abierto ? (
        <BusquedaSugerencias
          productos={productos}
          cargando={sugerencias.isFetching && productos.length === 0}
          error={sugerencias.isError}
          atenuado={sugerencias.isPlaceholderData}
          termino={terminoDiferido}
          total={sugerencias.data?.meta.total}
          listboxId={listboxId}
          opcionId={opcionId}
          indiceActivo={indiceActivo}
          onActivar={setIndiceActivo}
          onCerrar={cerrar}
          hrefVerTodos={construirHref(valor.trim())}
        />
      ) : null}
    </div>
  )
}
