import Image from "next/image"

import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Slot de LOGO de una entidad comercial (marca o proveedor).
 *
 * Es el punto único donde se resuelve la imagen, y solo tiene dos estados:
 *
 *   1. `logoUrl` — el logo servido desde el bucket. TODOS los logos, de
 *      marca y de proveedor, llegan por aquí: son un dato editorial que se
 *      sube aparte del sync de productos.
 *   2. Monograma con las iniciales del nombre — nunca un hueco vacío.
 *
 * Deliberadamente NO hay respaldo con logos guardados en el repo. Lo hubo, y
 * la medición contra el catálogo real mostró por qué era mala idea: de 639
 * marcas solo casaban 13 por nombre, y la de mayor volumen (CORONA, 1.198
 * productos de menaje) casaba con un asset que era la corona dorada de la
 * cerveza — el logo equivocado en el 13% del catálogo. Emparejar logos por
 * parecido de nombre acierta poco y falla caro.
 *
 * El ESPACIO está siempre reservado (mismo cuadro en ambos casos), así que la
 * grilla no salta cuando los logos empiecen a existir.
 *
 * Sobre formatos, verificado contra el bucket: un `logoUrl` que termina en
 * `.svg` lo sirve Next SIN optimizar (marca `unoptimized` solo, por la
 * extensión) y el navegador lo pide directo al bucket; los raster (png, jpg,
 * webp) sí pasan por `/_next/image`. Los dos casos funcionan, así que NO hace
 * falta `dangerouslyAllowSVG` — activarlo solo añadiría superficie de riesgo
 * sin ganar nada.
 */
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
      {logoUrl ? (
        <Image
          src={logoUrl}
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

/** Iniciales (máx. 2) para el monograma. */
export function iniciales(nombre: string): string {
  const palabras = nombre
    .split(/\s+/)
    .filter((p) => /\p{L}|\d/u.test(p))
    // "S.A." y compañía no describen a nadie: fuera del monograma.
    .filter((p) => !/^(s\.?a\.?s?\.?|ltda\.?|inc\.?|cia\.?|e\.?u\.?)$/i.test(p))
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
