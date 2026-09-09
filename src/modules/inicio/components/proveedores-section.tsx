"use client"

import Link from "next/link"
import type { Route } from "next"

import { JdhButton } from "@/components/common/jdh-button"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { Stagger, StaggerItem } from "@/components/motion/stagger"
import { formatNombreComercial, formatNumero } from "@/lib/format"
import {
  LogoComercial,
  LogoComercialVacio,
} from "@/modules/catalogo/components/logo-comercial"
import { useProveedores } from "@/modules/catalogo/hooks/use-productos"

import { SECTION_EMPTY_COPY, SectionNota } from "./section-empty"

/** Proveedores que caben en la grilla sin empujar la página. */
const MAX_VISIBLES = 10

/**
 * Contenedor: PISTA deslizable en móvil, grilla desde `sm`. En una sola
 * columna las 10 tarjetas medían varias pantallas y hundían el resto del
 * homepage; en pista ocupan una. La pista SANGRA hasta el borde del viewport
 * (`-mx-6 px-6`, contra el `px-6` del wrapper de `InicioView`) para que la
 * tarjeta siguiente asome cortada por el borde: es la única señal de que hay
 * más, porque la barra de scroll va oculta (`no-scrollbar`).
 *
 * El scroll es LIBRE, sin `scroll-snap`, y `overflow-y-hidden` es obligatorio
 * — las dos cosas por la misma razón que en `value-props.tsx`.
 */
const CLASES_PISTA =
  "no-scrollbar -mx-6 flex gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-6 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-5"
/**
 * Ancho de tarjeta en la pista: dos visibles y la tercera asomando. La ALTURA
 * es `--jdh-card-movil`, compartida con las otras dos pistas del homepage para
 * que las tres secciones lleven el mismo ritmo al bajar. Va en el ITEM y no en
 * `CLASES_CAJA` porque la caja conserva `h-full` para llenar a su padre — y en
 * el mismo elemento las dos alturas competirían.
 */
const CLASES_ITEM =
  "h-[var(--jdh-card-movil)] w-[46%] shrink-0 sm:h-full sm:w-auto"
const CLASES_CAJA =
  "flex h-full flex-col gap-3 rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"

/**
 * Grilla de acceso por PROVEEDOR — el eje de clasificación principal del
 * catálogo. Sustituye a la grilla de 10 categorías inventadas que enlazaba a
 * `/productos?categoria=…`: las categorías existen en el esquema del backend
 * pero no tienen datos, así que la única clasificación real es proveedor y
 * marca.
 *
 * Cada tarjeta reserva el espacio del LOGO del proveedor (`LogoComercial`).
 * Hoy casi todos caen al monograma porque el backend todavía no envía
 * `logoUrl`; cuando lo haga, la imagen entra sola en ese hueco y la grilla
 * no cambia de forma.
 *
 * Se muestran los de mayor catálogo (el API los devuelve alfabéticos, que en
 * cientos de proveedores no prioriza nada) con su conteo de referencias.
 * Sin datos se dibuja la MISMA grilla en fantasma — ver `section-empty.tsx`.
 */
export function ProveedoresSection() {
  const { data, isPending, isError } = useProveedores()

  const destacados = (data ?? [])
    .slice()
    .sort((a, b) => (b.totalProductos ?? 0) - (a.totalProductos ?? 0))
    .slice(0, MAX_VISIBLES)

  const hayMas = (data?.length ?? 0) > destacados.length
  const sinContenido = !isPending && destacados.length === 0

  return (
    <section
      aria-labelledby="proveedores-grid-title"
      className="flex flex-col gap-8"
    >
      <ScrollReveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
              Explora por proveedor
            </p>
            <h2
              id="proveedores-grid-title"
              className="text-2xl font-bold tracking-tight text-balance sm:text-3xl"
            >
              Encuentra lo que tu operación necesita
            </h2>
          </div>
          {hayMas ? (
            <JdhButton
              asChild
              variant="ghost"
              className="shrink-0 self-start sm:self-auto"
            >
              <Link href="/productos">Ver todos los proveedores</Link>
            </JdhButton>
          ) : null}
        </div>
      </ScrollReveal>

      {isPending || sinContenido || isError ? (
        <div className="flex flex-col gap-4">
          <div className={CLASES_PISTA} aria-hidden="true">
            {/* Mismo anidamiento que la rama con datos (item > caja): la
                altura fija vive en el item y `h-full` en la caja, así que no
                pueden compartir elemento. */}
            {Array.from({ length: MAX_VISIBLES }, (_, i) => (
              <div key={i} className={CLASES_ITEM}>
                <div className={CLASES_CAJA}>
                  <LogoComercialVacio className="size-12" />
                  <span className="flex flex-col gap-2">
                    <span className="h-3.5 w-3/4 rounded bg-[var(--color-surface-subtle)]" />
                    <span className="h-3 w-1/2 rounded bg-[var(--color-surface-subtle)]" />
                  </span>
                </div>
              </div>
            ))}
          </div>
          {!isPending ? (
            <SectionNota
              mensaje={
                isError
                  ? SECTION_EMPTY_COPY.error
                  : SECTION_EMPTY_COPY.sinDatos("proveedores")
              }
            />
          ) : null}
        </div>
      ) : (
        <Stagger staggerDelay={0.05} className={CLASES_PISTA}>
          {destacados.map((proveedor) => (
            <StaggerItem key={proveedor.id} className={CLASES_ITEM}>
              <Link
                href={`/productos?proveedor=${proveedor.id}` as Route}
                className={`group transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${CLASES_CAJA}`}
              >
                <LogoComercial
                  nombre={proveedor.nombre}
                  logoUrl={proveedor.logoUrl}
                  sizes="48px"
                  className="size-12 transition-transform duration-[var(--duration-fast)] group-hover:scale-110"
                />
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {formatNombreComercial(proveedor.nombre)}
                  </span>
                  {proveedor.totalProductos != null ? (
                    <span className="text-xs text-muted-foreground">
                      {formatNumero(proveedor.totalProductos)}{" "}
                      {proveedor.totalProductos === 1
                        ? "referencia"
                        : "referencias"}
                    </span>
                  ) : null}
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  )
}
