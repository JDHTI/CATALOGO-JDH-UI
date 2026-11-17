import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import { JdhButton } from "@/components/common/jdh-button"
import { cn } from "@/lib/utils"
import { formatNombreComercial } from "@/lib/format"

import type { Producto } from "../types"
import { PrecioEmpleado } from "./precio-empleado"
import { ProductoGaleria } from "./producto-galeria"
import { ProductoDescripcion } from "./producto-descripcion"
import { ProductoAcciones } from "./producto-acciones"

/**
 * Detalle de un producto real del API. El catálogo es referencia visual para
 * vendedores y clientes: identifica el producto (foto, códigos, marca,
 * fabricante, proveedor). El único precio es el de empleados, debajo del
 * encabezado y solo cuando el dato lo trae (ver `PrecioEmpleado`).
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
 * "Más de la marca" (`MismaMarcaSection`) NO entra en este reparto: la ruta la
 * pinta en un contenedor aparte, debajo, así que la ficha sigue ocupando la
 * primera pantalla completa y la página scrollea hasta la sección.
 */
export function ProductoDetalleView({ producto }: { producto: Producto }) {
  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <Breadcrumbs
        prominent
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
      <div className="grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-8">
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
          className="flex min-w-0 flex-col gap-4 lg:min-h-0 lg:overflow-y-auto"
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
          </header>

          {/* Precio de EMPLEADOS: la ruta pide el producto según el
              PriceContext, y solo para un empleado trae `precioEmpleado`.
              Para el resto no pinta nada. */}
          <PrecioEmpleado producto={producto} variante="ficha" />

          <ProductoDescripcion texto={producto.descripcionLarga} />

          <FichaTecnica producto={producto} />
          <ProductoAcciones producto={producto} />

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

/** Conserva los datos descriptivos; SKU sustituye el antiguo rotulo Codigo. */
function FichaTecnica({ producto }: { producto: Producto }) {
  const ampliada = producto.imagenes.length <= 1
  const filas = [
    ["SKU", producto.sku],
    ["Marca", formatNombreComercial(producto.marca)],
    ["Fabricante", formatNombreComercial(producto.fabricante)],
    ["Proveedor", formatNombreComercial(producto.proveedor.nombre)],
    ["Categoría", producto.categoria?.nombre],
    ["Subcategoría", producto.subcategoria?.nombre],
  ].filter(([, valor]) => valor)
  return (
    <dl className="grid shrink-0 grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-border)]">
      {filas.map(([termino, valor], index) => (
        <div
          key={termino}
          className={cn(
            "min-w-0 bg-background px-4 py-2",
            ampliada && "py-4",
            index === filas.length - 1 && filas.length % 2 !== 0 && "col-span-2"
          )}
        >
          <dt
            className={cn(
              "text-xs text-muted-foreground",
              ampliada && "text-sm"
            )}
          >
            {termino}
          </dt>
          <dd
            className={cn(
              "mt-1 text-sm font-medium break-words",
              ampliada && "text-base",
              termino === "SKU" && "tabular-nums"
            )}
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
      className="flex animate-pulse flex-col gap-3 lg:h-full lg:min-h-0"
    >
      <span className="sr-only">Cargando producto…</span>
      <div className="h-4 w-64 shrink-0 rounded bg-[var(--color-surface-subtle)]" />
      <div className="grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-8">
        <div className="flex flex-col gap-3 lg:min-h-0">
          {/* Mismo criterio que la galería real: cuadrado a ancho completo en
              móvil, y en `lg` el que cabe en el alto disponible. */}
          <div className="aspect-square w-full rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)] lg:aspect-auto lg:min-h-0 lg:flex-1" />
          <div className="flex shrink-0 gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="size-20 rounded-[var(--jdh-radius-sm)] bg-[var(--color-surface-subtle)]"
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:min-h-0">
          <div className="h-3 w-24 shrink-0 rounded bg-[var(--color-surface-subtle)]" />
          <div className="h-8 w-3/4 shrink-0 rounded bg-[var(--color-surface-subtle)]" />
          <div className="h-20 shrink-0 rounded bg-[var(--color-surface-subtle)] lg:min-h-0 lg:flex-1" />
          <div className="h-12 w-full shrink-0 rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)]" />
        </div>
      </div>
    </div>
  )
}
