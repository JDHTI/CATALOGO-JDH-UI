"use client"

import Image from "next/image"
import Link from "next/link"

import { JdhButton } from "@/components/common/jdh-button"
import { Stagger, StaggerItem } from "@/components/motion/stagger"
import { WordReveal } from "@/components/motion/word-reveal"

import type { ImagenSitio } from "../types"

/**
 * Primer slide del homepage: la fotografía editorial llena el viewport
 * restante bajo el chrome (`100svh - --catalogo-chrome-height`) en
 * cualquier dispositivo. El copy y los CTAs van anclados al lado izquierdo
 * (el lado iluminado de la foto) y CENTRADOS VERTICALMENTE respecto a la
 * imagen — no centrados en pantalla —, en tokens ink (negro de marca, no se
 * invierte con el tema). Sin velo oscuro: taparía el blanco de la foto y
 * haría ilegible el texto negro.
 *
 * Único `h1` de la página. Animación de entrada con los primitivos motion
 * (passthrough bajo `prefers-reduced-motion`).
 *
 * La FOTO la decide `site/hero/` en el bucket: la resuelve la ruta en el
 * servidor (ver `../server/queries.ts`) y llega ya como prop, así que viaja en
 * el HTML y sigue siendo el LCP. El `alt` es vacío a propósito: la foto es
 * decorativa, el mensaje está en el `h1` y en el `aria-label` de la sección —
 * describirla otra vez solo alarga el recorrido de un lector de pantalla.
 *
 * **Sin respaldo local.** Si no hay pieza subida, la sección se dibuja sin
 * imagen: el copy es negro de marca sobre el fondo claro de la página, así que
 * sigue legible y con el mismo alto. Hubo un respaldo a
 * `public/photos/hero-alimentos.png`, pero ese archivo se está retirando del
 * repo junto con el resto de los assets que ahora viven en el bucket —
 * apuntarle sería dejar el hero roto justo en el caso que el respaldo
 * pretendía cubrir.
 */
export function HeroSection({ imagen }: { imagen?: ImagenSitio | null }) {
  return (
    <section
      aria-label="Todo tu mercado, en un solo lugar."
      className="relative isolate min-h-[calc(100svh-var(--catalogo-chrome-height))] w-full overflow-hidden bg-[var(--color-surface)]"
    >
      {imagen ? (
        <Image
          src={imagen.url}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      ) : null}

      <div className="relative mx-auto flex min-h-[calc(100svh-var(--catalogo-chrome-height))] w-full max-w-[var(--container-wide)] flex-col justify-center px-6">
        <Stagger
          staggerDelay={0.08}
          className="flex max-w-[40ch] flex-col items-start gap-6 text-[var(--color-ink)]"
        >
          <StaggerItem y={8}>
            <p className="font-mono text-xs tracking-[0.08em] text-[var(--color-ink-hover)] uppercase">
              Distribución institucional · Food service · Retail
            </p>
          </StaggerItem>
          <StaggerItem y={12}>
            <WordReveal
              as="h1"
              text="Todo tu mercado, en un solo lugar."
              className="text-4xl font-bold tracking-tight text-balance text-[var(--color-ink)] sm:text-5xl lg:text-6xl"
            />
          </StaggerItem>
          <StaggerItem y={12}>
            <p className="max-w-[60ch] text-lg text-[var(--color-ink-hover)]">
              Compra directo del catálogo JDH: alimentos, bebidas y productos de
              limpieza con precios de lista pública y entrega en siete ciudades
              de Colombia.
            </p>
          </StaggerItem>
          <StaggerItem
            y={12}
            className="flex flex-wrap items-center justify-start gap-3"
          >
            <JdhButton asChild size="lg" variant="primary">
              <Link href="/productos">Explorar catálogo</Link>
            </JdhButton>
            <JdhButton asChild size="lg" variant="secondary">
              <Link href="/ingreso">Crear cuenta</Link>
            </JdhButton>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  )
}
