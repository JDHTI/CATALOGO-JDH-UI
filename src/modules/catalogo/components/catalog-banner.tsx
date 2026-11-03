"use client"

import { useState } from "react"
import Image from "next/image"

import { urlImagenSitio } from "@/lib/site-assets"

import type { Categoria } from "../types"

/** Banner por defecto: fuera de una categoría, o si la categoría no tiene pieza. */
const SLUG_GENERAL = "general"

const TEXTO_GENERAL = {
  titulo: "Todos nuestros productos",
  descripcion: "Todo el portafolio de JDH en un solo lugar.",
}

/**
 * Qué encontrará el cliente en cada categoría, por `slug`. Una categoría nueva
 * sin entrada aquí usa el texto genérico de `descripcionDe`, no queda vacía.
 */
const DESCRIPCIONES: Record<string, string> = {
  alimentos: "Despensa, abarrotes y básicos para tu negocio.",
  proteinas: "Carnes, pollo, pescado y derivados.",
  "aseo-y-limpieza": "Productos de limpieza para hogar e institución.",
  "cuidado-personal": "Higiene y cuidado diario.",
  menaje: "Utensilios y artículos para cocina y mesa.",
  "empaques-y-desechables": "Empaques y desechables para tus despachos.",
  "licores-y-tabaco": "Licores y tabaco para tu punto de venta.",
  "papeleria-y-oficina": "Papelería y suministros de oficina.",
  industrial: "Insumos y elementos de uso industrial.",
  mascotas: "Alimento y accesorios para mascotas.",
  farmaceuticos: "Productos farmacéuticos y de salud.",
}

function descripcionDe(slug: string | null | undefined, nombre: string) {
  return (slug && DESCRIPCIONES[slug]) || `Explora la categoría ${nombre}.`
}

/**
 * Banner del listado, por convención de bucket (`site/banners/{slug}.webp`).
 * El `slug` de la categoría activa ES el nombre del archivo; no hay mapeo
 * aparte ni endpoint. Se muestra el de una categoría solo cuando el filtro de
 * categoría tiene exactamente una elegida; con ninguna o varias, `general`.
 *
 * Si la pieza no existe (`servicios`, `otros`, 404) cae a `general`, y si
 * tampoco hay `general` o falta `NEXT_PUBLIC_ASSETS_CDN_URL`, no se dibuja.
 *
 * `unoptimized`: el objeto vive con `max-age=300` y se reemplaza sin cambiar
 * de nombre; el optimizador de Next lo recordaría mucho más tiempo.
 */
export function CatalogBanner({
  categoriaIds,
  categorias,
}: {
  categoriaIds: string[]
  categorias: Categoria[] | undefined
}) {
  const categoria =
    categoriaIds.length === 1
      ? categorias?.find((c) => c.id === categoriaIds[0])
      : undefined

  const slugDeseado = categoria?.slug ?? SLUG_GENERAL
  // Las ranuras fallidas se recuerdan por slug: cambiar de categoría vuelve a
  // intentar la nueva sin reiniciar el estado en un efecto.
  const [fallidos, setFallidos] = useState<ReadonlySet<string>>(new Set())

  const slug = fallidos.has(slugDeseado) ? SLUG_GENERAL : slugDeseado
  const src = fallidos.has(slug) ? null : urlImagenSitio("banners", slug)
  if (!src) return null

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-[var(--jdh-radius-md)] bg-[var(--color-ink)] sm:h-56">
      <Image
        key={slug}
        src={src}
        alt=""
        fill
        unoptimized
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="object-cover"
        onError={() => setFallidos((prev) => new Set(prev).add(slug))}
      />
      {/* El arte deja libre ~30% a la izquierda: el texto vive ahí. El
          degradado oscuro asegura el contraste sea cual sea la pieza. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[var(--color-ink)] via-[var(--color-ink)/60%] to-transparent"
      />
      <div className="absolute inset-y-0 left-0 flex w-[38%] flex-col justify-center gap-1.5 pl-4 sm:w-[32%] sm:gap-2 sm:pl-8">
        <p className="font-mono text-[10px] tracking-[0.08em] text-[var(--color-on-ink-muted)] uppercase sm:text-xs">
          {categoria ? "Categoría" : "Catálogo"}
        </p>
        <h2 className="text-base leading-tight font-bold tracking-tight text-balance text-[var(--color-on-ink)] sm:text-2xl">
          {categoria ? categoria.nombre : TEXTO_GENERAL.titulo}
        </h2>
        <p className="line-clamp-3 text-xs text-[var(--color-on-ink-muted)] sm:text-sm">
          {categoria
            ? descripcionDe(categoria.slug, categoria.nombre)
            : TEXTO_GENERAL.descripcion}
        </p>
      </div>
    </div>
  )
}
