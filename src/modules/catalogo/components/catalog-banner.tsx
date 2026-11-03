"use client"

import { useState } from "react"
import Image from "next/image"

import { urlImagenSitio } from "@/lib/site-assets"

import type { Categoria } from "../types"

/** Banner por defecto: fuera de una categoría, o si la categoría no tiene pieza. */
const SLUG_GENERAL = "general"

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
    </div>
  )
}
