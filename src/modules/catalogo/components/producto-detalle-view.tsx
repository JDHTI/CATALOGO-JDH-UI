import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import { JdhButton } from "@/components/common/jdh-button"
import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { Producto } from "../types"
import { ProductoGaleria } from "./producto-galeria"
import { ProductoDescripcion } from "./producto-descripcion"

/**
 * Detalle de un producto real del API. El catálogo es referencia visual para
 * vendedores y clientes: identifica el producto (foto, códigos, marca,
 * fabricante, proveedor) — SIN precio ni compra. Cuando el backend defina
 * precios, el slot va debajo del encabezado (ver comentario en el JSX).
 *
 * La ficha se dimensiona al VIEWPORT y NO scrollea: la galería completa,
 * incluida la tira de miniaturas, tiene que verse sin mover la página. El
 * alto lo fija `CatalogoPage compacta`; aquí solo se reparte con flex y grid,
 * y lo que absorbe la diferencia es el recuadro de la imagen. Por eso no hay
 * `aspect-square` en este árbol y cada contenedor intermedio lleva `min-h-0`:
 * sin él, un hijo flex se niega a encoger por debajo de su contenido y
 * reaparece el scroll.
 *
 * La ÚNICA zona que puede desplazarse por dentro es la columna de texto, y
 * solo cuando no cabe: el largo de la descripción editorial no lo controlamos
 * —es texto redactado por producto— y en un móvil no entra junto a la ficha
 * técnica. La página nunca se mueve y la galería siempre se ve entera, que es
 * el requisito; recortar el texto habría escondido contenido sin que el
 * usuario tuviera forma de leerlo. De portátil hacia arriba no aparece barra
 * porque todo cabe.
 *
 * Cuando se añada el carrusel de destacados al pie habrá que revisar esto: o
 * deja de ser compacta, o el carrusel entra en el reparto.
 */
export function ProductoDetalleView({ producto }: { producto: Producto }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Productos", href: "/productos" },
          { label: producto.nombre },
        ]}
      />

      {/* En una sola columna (móvil/tablet) las dos filas se reparten el alto
          en proporción fija, 45/55. Con `auto` en la fila del texto, una
          descripción editorial larga se comía la pantalla y la foto llegaba a
          quedar en 7px; con este reparto la galería tiene su parte garantizada
          y es la descripción la que se desplaza dentro de su caja.

          `minmax(0,…)` y no `45fr`/`55fr` a secas porque un track `fr` tiene
          `min-height:auto` y se niega a bajar del tamaño de su contenido, que
          es justo lo que reintroduce el scroll. En `lg` vuelven a ser dos
          columnas en una sola fila. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,45fr)_minmax(0,55fr)] gap-6 lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)] lg:gap-8">
        {/* `key`: la galería guarda cuál miniatura está activa, y al navegar
            de un producto a otro React reutilizaría la instancia con el índice
            de la anterior. */}
        <ProductoGaleria key={producto.id} producto={producto} />

        {/* La columna entera es la zona desplazable, no solo la descripción:
            en un móvil, con la descripción en su propia caja, esa caja
            quedaba en 0px y el texto era literalmente inalcanzable. Con una
            sola zona, la galería sigue fija y completa arriba —que es lo que
            no debe exigir scroll— y todo lo demás se alcanza dentro. En
            pantallas de portátil y más no aparece barra: el contenido cabe.

            `data-lenis-prevent` NO es decorativo: Lenis se queda con el evento
            de rueda de toda la página y sin esto la columna no se movía ni un
            píxel teniendo contenido de sobra (medido: la rueda dejaba
            `scrollTop` en 0 y solo un `scrollBy` programático la desplazaba).
            Es la convención que documenta `LenisProvider`. */}
        <div
          data-lenis-prevent
          className="flex min-h-0 flex-col gap-4 overflow-y-auto"
        >
          <header className="flex shrink-0 flex-col gap-1">
            {producto.marca ? (
              <p className="text-xs font-medium tracking-wide text-muted-foreground">
                {formatNombreComercial(producto.marca)}
              </p>
            ) : null}
            <h1 className="text-xl font-bold tracking-tight text-balance sm:text-2xl">
              {producto.nombre}
            </h1>
          </header>

          {/* SLOT DE PRECIO (oculto a propósito): los precios aún no están
              definidos en el backend. Cuando existan, aquí va el bloque de
              precio según la audiencia del PriceContext — nunca antes. */}

          <ProductoDescripcion texto={producto.descripcionLarga} />

          <FichaTecnica producto={producto} />

          <div className="shrink-0">
            <JdhButton asChild variant="secondary" size="sm">
              <Link href="/productos">
                <ArrowLeft aria-hidden="true" />
                Volver a productos
              </Link>
            </JdhButton>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Ficha de identificación — pares término/valor en grid, monocromo.
 *
 * El código del producto vive aquí y ya no bajo el título: es un dato de
 * identificación como el resto, y agruparlo libera el alto que la ficha
 * necesita para caber en el viewport.
 *
 * «Referencia» es el campo que el API llama `descripcion`. Se etiquetaba como
 * «Descripción ERP», que sugiere prosa: su contenido real son códigos tipo
 * "67303855" o "CO8413". La descripción de verdad es `descripcionLarga` y se
 * pinta arriba, en su propia sección.
 */
function FichaTecnica({ producto }: { producto: Producto }) {
  // Los nombres comerciales llegan del ERP en mayúsculas sostenidas.
  const filas: { termino: string; valor: string | null; codigo?: boolean }[] = [
    { termino: "Código", valor: producto.sku, codigo: true },
    { termino: "Referencia", valor: producto.referencia || null, codigo: true },
    {
      termino: "Marca",
      valor: producto.marca ? formatNombreComercial(producto.marca) : null,
    },
    {
      termino: "Fabricante",
      valor: producto.fabricante
        ? formatNombreComercial(producto.fabricante)
        : null,
    },
    {
      termino: "Proveedor",
      valor: formatNombreComercial(producto.proveedor.nombre),
    },
    { termino: "Categoría", valor: producto.categoria?.nombre ?? null },
    { termino: "Subcategoría", valor: producto.subcategoria?.nombre ?? null },
  ].filter((f) => f.valor)

  return (
    <dl className="grid shrink-0 grid-cols-2 overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)]">
      {filas.map(({ termino, valor, codigo }) => (
        <div
          key={termino}
          className="flex flex-col gap-0.5 border-b border-[var(--color-border)] px-3 py-2 last:border-b-0 nth-last-2:border-b-0"
        >
          <dt className="text-xs text-muted-foreground">{termino}</dt>
          <dd
            className={cn(
              "truncate text-sm font-medium",
              codigo && "tabular-nums"
            )}
            title={valor ?? undefined}
          >
            {valor}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * Esqueleto del detalle mientras responde el API. Reparte el alto igual que
 * la ficha real (`flex-1` en el recuadro, no `aspect-square`): con aspecto
 * fijo desbordaba el contenedor compacto y la página daba un salto al llegar
 * los datos.
 */
export function DetalleSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando producto"
      className="flex h-full min-h-0 animate-pulse flex-col gap-4"
    >
      <span className="sr-only">Cargando producto…</span>
      <div className="h-4 w-64 shrink-0 rounded bg-[var(--color-surface-subtle)]" />
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-6 lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)] lg:gap-8">
        <div className="flex min-h-0 flex-col gap-3">
          <div className="min-h-0 flex-1 rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)]" />
          <div className="flex shrink-0 gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="size-16 rounded-[var(--jdh-radius-sm)] bg-[var(--color-surface-subtle)]"
              />
            ))}
          </div>
        </div>
        <div className="flex min-h-0 flex-col gap-4">
          <div className="h-3 w-24 shrink-0 rounded bg-[var(--color-surface-subtle)]" />
          <div className="h-7 w-3/4 shrink-0 rounded bg-[var(--color-surface-subtle)]" />
          <div className="min-h-0 flex-1 rounded bg-[var(--color-surface-subtle)]" />
          <div className="h-40 w-full shrink-0 rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)]" />
        </div>
      </div>
    </div>
  )
}
