import Image from "next/image"

import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Slot de LOGO de una entidad comercial (marca o proveedor).
 *
 * Es el punto único donde se resuelve la imagen, con tres niveles de
 * respaldo en orden:
 *
 *   1. `logoUrl` — el logo que el backend servirá desde el bucket. Aún no
 *      viaja en el contrato; en cuanto empiece a llegar, aparece solo aquí y
 *      en todas las superficies que usan este componente, sin tocar nada más.
 *   2. Asset local por slug (`public/photos/marcas/…`), para las marcas del
 *      sector cuyo logo ya tenemos en el repo.
 *   3. Monograma con las iniciales del nombre — nunca un hueco vacío.
 *
 * El ESPACIO está siempre reservado (mismo cuadro en los tres casos), así
 * que la grilla no salta cuando los logos empiecen a existir: es lo que
 * permite bindear la imagen después sin rehacer el layout.
 */

/**
 * Logos que ya viven en `public/photos/marcas/`. Es un catálogo de ASSETS,
 * no de datos: si el nombre real normaliza a uno de estos slugs se usa,
 * y si no, se cae al monograma.
 */
const LOGOS_LOCALES = new Set([
  "aguila-roja",
  "alpina",
  "arcor",
  "bimbo",
  "campbells",
  "coca-cola",
  "colgate",
  "corona",
  "crem-helado",
  "danone",
  "delmonte",
  "doritos",
  "heinz",
  "lactalis",
  "lays",
  "lipton",
  "maggi",
  "nestle",
  "noel",
  "nutella",
  "oetker",
  "oreo",
  "pepsi",
  "pietran",
  "pringles",
  "quaker",
  "rica",
  "tosh",
  "yoplait",
  "zenu",
])

/**
 * Normaliza un nombre comercial a slug de archivo: minúsculas, sin acentos,
 * sin forma jurídica y con guiones. "ALPINA S.A." → "alpina".
 */
export function slugComercial(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\b(s\.?a\.?s?|ltda|inc|sa)\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Asset local para ese nombre, si existe. */
export function logoLocal(nombre: string): string | null {
  const slug = slugComercial(nombre)
  return LOGOS_LOCALES.has(slug) ? `/photos/marcas/${slug}.png` : null
}

/** Iniciales (máx. 2) para el monograma. */
export function iniciales(nombre: string): string {
  const palabras = nombre
    .split(/\s+/)
    .filter((p) => /\p{L}|\d/u.test(p))
    // "S.A." y compañía no describen a nadie: fuera del monograma.
    .filter((p) => !/^(s\.?a\.?s?\.?|ltda\.?|inc\.?|cia\.?)$/i.test(p))
  const fuente = palabras.length > 0 ? palabras : [nombre.trim() || "?"]

  // Una marca ya corta ES su propio monograma: "3M" se muestra entero, no
  // reducido a "3".
  if (fuente.length === 1 && fuente[0]!.length <= 3) {
    return fuente[0]!.toUpperCase()
  }

  return fuente
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("")
}

export function LogoComercial({
  nombre,
  logoUrl,
  className,
  sizes = "96px",
  /** Sobre fondo oscuro (franja negra del homepage). */
  onInk = false,
}: {
  nombre: string
  logoUrl?: string | null
  className?: string
  sizes?: string
  onInk?: boolean
}) {
  const fuente = logoUrl ?? logoLocal(nombre)
  const etiqueta = formatNombreComercial(nombre)

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--jdh-radius-md)]",
        onInk
          ? "bg-[var(--overlay-on-dark-08)] text-[var(--color-on-ink)]"
          : "bg-[var(--color-surface-subtle)] text-muted-foreground",
        className
      )}
    >
      {fuente ? (
        <Image
          src={fuente}
          alt={etiqueta}
          fill
          sizes={sizes}
          // `contain` y no `cover`: un logo recortado deja de ser el logo.
          className="object-contain p-2"
        />
      ) : (
        <span
          aria-hidden="true"
          className="text-sm font-bold tracking-tight tabular-nums"
        >
          {iniciales(nombre)}
        </span>
      )}
    </div>
  )
}

/**
 * Slot de logo VACÍO, con la misma caja que `LogoComercial`. Lo usan las
 * grillas fantasma que dan cuerpo a la homepage mientras el catálogo no
 * tiene datos: reservan exactamente el espacio que ocupará el logo real.
 */
export function LogoComercialVacio({
  className,
  onInk = false,
}: {
  className?: string
  onInk?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "shrink-0 rounded-[var(--jdh-radius-md)]",
        onInk
          ? "bg-[var(--overlay-on-dark-08)]"
          : "bg-[var(--color-surface-subtle)]",
        className
      )}
    />
  )
}
