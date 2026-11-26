"use client"

import Link from "next/link"

import { JdhButton } from "@/components/common/jdh-button"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { useDestacados } from "@/modules/catalogo/hooks/use-productos"
import {
  ProductoCard,
  ProductoCardFantasma,
  ProductoCardSkeleton,
} from "@/modules/catalogo/components/producto-card"

import { SECTION_EMPTY_COPY, SectionNota } from "./section-empty"

/** Cuántas referencias trae la muestra: 4 columnas × 3 filas en escritorio. */
const MUESTRA = 12

/** Una sola grilla para los tres estados (real, cargando y fantasma), para que
 *  la sección no cambie de alto al llegar los datos. */
const GRILLA = "grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4"

/**
 * Muestra del portafolio en GRILLA 4×3 (3 columnas en tablet, 2 en móvil), con
 * productos REALES del API: `GET /products/destacados?limit=12`. Usa la misma
 * card que el listado (`ProductoCard`) en su variante `compacta`, que deja
 * entrar doce referencias sin que la sección pese más que el carrusel de
 * tres que reemplaza.
 *
 * Antes pedía la primera página de `GET /products`, que alfabéticamente son
 * productos sin foto: una vitrina de ocho placeholders. El endpoint propio
 * existe porque el criterio necesita ver todo el conjunto — reparte por marca
 * y rota con semilla del día, así que la home no queda clavada en las mismas
 * doce referencias de un solo proveedor.
 *
 * Sin datos la sección NO desaparece: conserva su encabezado y muestra un
 * `SectionEmpty`. Ocultarla dejaba la homepage sin cuerpo cuando el catálogo
 * está vacío, que es justo el estado en el que hoy vive el backend.
 */
export function FeaturedProducts() {
  const { data, isPending, isError } = useDestacados(MUESTRA)
  const productos = data?.data ?? []
  const vacio = !isPending && productos.length === 0

  return (
    <section aria-labelledby="destacados-title" className="flex flex-col gap-8">
      <ScrollReveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h2
              id="destacados-title"
              className="text-2xl font-bold tracking-tight text-balance sm:text-3xl"
            >
              Una muestra del catálogo
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Consulta el portafolio completo por proveedor, marca o código de
              producto.
            </p>
          </div>
          <JdhButton
            asChild
            variant="ghost"
            className="shrink-0 self-start sm:self-auto"
          >
            <Link href="/productos">Ver todo el catálogo</Link>
          </JdhButton>
        </div>
      </ScrollReveal>

      <ScrollReveal y={24}>
        {isError || vacio ? (
          // Fila fantasma con la silueta real de las cards (incluido el
          // marco de la imagen), para que la sección tenga cuerpo antes de
          // que existan productos.
          <div className="flex flex-col gap-4">
            <div className={GRILLA} aria-hidden="true">
              {Array.from({ length: 4 }, (_, i) => (
                <ProductoCardFantasma key={i} densidad="compacta" />
              ))}
            </div>
            <SectionNota
              mensaje={
                isError
                  ? SECTION_EMPTY_COPY.error
                  : SECTION_EMPTY_COPY.sinDatos("productos")
              }
            />
          </div>
        ) : (
          <ul className={GRILLA} aria-busy={isPending || undefined}>
            {isPending
              ? Array.from({ length: MUESTRA }, (_, i) => (
                  <li key={i}>
                    <ProductoCardSkeleton densidad="compacta" />
                  </li>
                ))
              : productos.map((producto) => (
                  <li key={producto.id}>
                    <ProductoCard producto={producto} densidad="compacta" />
                  </li>
                ))}
          </ul>
        )}
      </ScrollReveal>
    </section>
  )
}
