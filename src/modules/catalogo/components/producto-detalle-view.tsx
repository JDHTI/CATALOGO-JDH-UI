import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import { JdhButton } from "@/components/common/jdh-button"
import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"
import { FavoritoBoton } from "@/modules/favoritos/components/favorito-boton"

import type { Producto } from "../types"
import { ProductoGaleria } from "./producto-galeria"
import { ProductoDescripcion } from "./producto-descripcion"

/**
 * Detalle de un producto real del API. El catálogo es referencia visual para
 * vendedores y clientes: identifica el producto (foto, códigos, marca,
 * fabricante, proveedor) — SIN precio ni compra. Cuando el backend defina
 * precios, el slot va debajo del encabezado (ver comentario en el JSX).
 *
 * La ficha tiene DOS comportamientos según el ancho, y la diferencia es
 * deliberada:
 *
 * - De `lg` hacia arriba se dimensiona al VIEWPORT y NO scrollea: la galería
 *   completa, incluida la tira de miniaturas, se ve sin mover la página. El
 *   alto lo fija `CatalogoPage compacta`; aquí solo se reparte con flex y
 *   grid, y lo que absorbe la diferencia es el recuadro de la imagen. Por eso
 *   cada contenedor intermedio lleva `lg:min-h-0`: sin él, un hijo flex se
 *   niega a encoger por debajo de su contenido y reaparece el scroll.
 * - Por debajo de `lg` la página scrollea con normalidad y la foto sube al
 *   desplazar. Encajarlo todo en una pantalla de teléfono dejaba el texto en
 *   una franja inservible: la foto ocupa el ancho completo y la descripción
 *   se lee bajando, que es como se lee una ficha en el móvil.
 *
 * En `lg` la columna de texto puede desplazarse por dentro si no cabe: el
 * largo de la descripción editorial no lo controlamos, es texto redactado por
 * producto. En la práctica no aparece barra porque a esos anchos entra.
 *
 * Cuando se añada el carrusel de destacados al pie habrá que revisar esto: o
 * deja de ser compacta, o el carrusel entra en el reparto.
 */
export function ProductoDetalleView({ producto }: { producto: Producto }) {
  return (
    <div className="flex flex-col gap-4 lg:h-full lg:min-h-0">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Productos", href: "/productos" },
          { label: producto.nombre },
        ]}
      />

      {/* Móvil/tablet: una columna en flujo normal, la página scrollea y la
          foto sube al desplazar.

          `lg`: dos columnas en una sola fila, con la galería MÁS ESTRECHA que
          el texto (10/14). El cuadrado se alinea a la izquierda contra el
          mismo margen del header, así que estrechar su columna acerca el
          bloque descriptivo a la foto y ensancha la ficha técnica.

          El hueco entre foto y texto no era el `gap`, era la columna: el
          cuadrado se limita por el ALTO disponible, así que en anchos medios
          sobraba columna vacía a su derecha (a 1280 el cuadrado medía 412 en
          una columna de 546). Estrecharla se come ese vacío antes que la
          foto.

          `minmax(0,…)` y no `11fr`/`13fr` a secas porque un track `fr` tiene
          `min-height:auto`, se niega a bajar del tamaño de su contenido y ahí
          reaparece el scroll. */}
      <div className="grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,10fr)_minmax(0,14fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-8">
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

            Solo desde `lg`: en móvil la página scrollea y esta columna va en
            flujo normal, sin zona desplazable propia.

            `data-lenis-prevent` NO es decorativo: Lenis se queda con el evento
            de rueda de toda la página y sin esto la columna no se movía ni un
            píxel teniendo contenido de sobra (medido: la rueda dejaba
            `scrollTop` en 0 y solo un `scrollBy` programático la desplazaba).
            Es la convención que documenta `LenisProvider`. */}
        <div
          data-lenis-prevent
          className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto"
        >
          <header className="flex shrink-0 items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              {producto.marca ? (
                <p className="text-sm font-medium tracking-wide text-muted-foreground">
                  {formatNombreComercial(producto.marca)}
                </p>
              ) : null}
              <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                {producto.nombre}
              </h1>
            </div>
            {/* Junto al título y no sobre la foto: aquí la card no es un
                enlace, así que el corazón puede ir en el flujo, y al lado del
                nombre queda claro QUÉ se está guardando. */}
            <FavoritoBoton
              productoId={producto.id}
              nombreProducto={producto.nombre}
              className="mt-0.5 shrink-0"
            />
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
          className="flex flex-col gap-1 border-b border-[var(--color-border)] px-5 py-3.5 last:border-b-0 nth-last-2:border-b-0"
        >
          <dt className="text-xs text-muted-foreground">{termino}</dt>
          <dd
            className={cn(
              "truncate text-base font-medium",
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
 * Esqueleto del detalle mientras responde el API. Copia la silueta de la
 * ficha real en los dos modos —cuadrado a ancho completo en móvil, repartido
 * por alto en `lg`— para que la página no dé un salto al llegar los datos.
 */
export function DetalleSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando producto"
      className="flex animate-pulse flex-col gap-4 lg:h-full lg:min-h-0"
    >
      <span className="sr-only">Cargando producto…</span>
      <div className="h-4 w-64 shrink-0 rounded bg-[var(--color-surface-subtle)]" />
      <div className="grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,10fr)_minmax(0,14fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-8">
        <div className="flex flex-col gap-3 lg:min-h-0">
          {/* Mismo criterio que la galería real: cuadrado a ancho completo en
              móvil, y en `lg` el que cabe en el alto disponible. */}
          <div className="aspect-square w-full rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)] lg:aspect-auto lg:min-h-0 lg:flex-1" />
          <div className="flex shrink-0 gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="size-16 rounded-[var(--jdh-radius-sm)] bg-[var(--color-surface-subtle)]"
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:min-h-0">
          <div className="h-3 w-24 shrink-0 rounded bg-[var(--color-surface-subtle)]" />
          <div className="h-8 w-3/4 shrink-0 rounded bg-[var(--color-surface-subtle)]" />
          <div className="h-20 shrink-0 rounded bg-[var(--color-surface-subtle)] lg:min-h-0 lg:flex-1" />
          <div className="h-48 w-full shrink-0 rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)]" />
        </div>
      </div>
    </div>
  )
}
