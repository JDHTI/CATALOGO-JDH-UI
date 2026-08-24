"use client"

import Image from "next/image"
import Link from "next/link"

import { JdhButton } from "@/components/common/jdh-button"
import { Stagger, StaggerItem } from "@/components/motion/stagger"
import { WordReveal } from "@/components/motion/word-reveal"

/**
 * Primer slide del homepage: la fotografía editorial llena el viewport
 * restante bajo el chrome (`100svh - --catalogo-chrome-height`) en
 * cualquier dispositivo. El copy y los CTAs van anclados al lado izquierdo
 * (el lado iluminado de la foto) y CENTRADOS VERTICALMENTE respecto a la
 * imagen, SIGUIENDO EL TEMA:
 * - Claro: texto y botones en tokens ink (negro de marca) sobre la foto
 *   clara, sin velo.
 * - Oscuro: el copy pasa a blanco (--color-text) y un velo oscuro sutil
 *   (`--color-hero-veil`) baja la luminosidad de la foto para legibilidad
 *   AA; los botones INVIERTEN (primario blanco con texto negro) usando las
 *   superficies inversas (--color-invert).
 *
 * Único `h1` de la página. Animación de entrada con los primitivos motion
 * (passthrough bajo `prefers-reduced-motion`).
 */
export function HeroSection() {
  return (
    <section
      aria-label="Todo tu mercado, en un solo lugar."
      className="relative isolate min-h-[calc(100svh-var(--catalogo-chrome-height))] w-full overflow-hidden"
    >
      <Image
        src="/photos/hero-alimentos.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Velo solo en oscuro: la foto es high-key y el texto pasa a blanco. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 hidden bg-[var(--color-hero-veil)] dark:block"
      />

      <div className="relative mx-auto flex min-h-[calc(100svh-var(--catalogo-chrome-height))] w-full max-w-[var(--container-wide)] flex-col justify-center px-6">
        <Stagger
          staggerDelay={0.08}
          className="flex max-w-[40ch] flex-col items-start gap-6 text-foreground"
        >
          <StaggerItem y={8}>
            <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase dark:text-[var(--color-on-ink-muted)]">
              Distribución institucional · Food service · Retail
            </p>
          </StaggerItem>
          <StaggerItem y={12}>
            <WordReveal
              as="h1"
              text="Todo tu mercado, en un solo lugar."
              className="text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl dark:text-white"
            />
          </StaggerItem>
          <StaggerItem y={12}>
            <p className="max-w-[60ch] text-lg text-muted-foreground dark:text-[var(--color-on-ink-muted)]">
              Compra directo del catálogo JDH: alimentos, bebidas y productos de
              limpieza con precios de lista pública y entrega en siete ciudades
              de Colombia.
            </p>
          </StaggerItem>
          <StaggerItem
            y={12}
            className="flex flex-wrap items-center justify-start gap-3"
          >
            {/* Botones que INVIERTEN con el tema (--color-invert): en claro
                negro/blanco como hoy; en oscuro blanco/negro. Hover con gris
                sólido propio del hero (--color-hero-primary-hover-bg), no el
                overlay translúcido compartido — ver el token en globals.css. */}
            <JdhButton
              asChild
              size="lg"
              className="bg-[var(--color-invert)] text-[var(--color-on-invert)] hover:bg-[var(--color-hero-primary-hover-bg)]"
            >
              <Link href="/productos">Explorar catálogo</Link>
            </JdhButton>
            {/* `secondary` estándar usa borde gris (--color-border-strong),
                poco visible contra la foto: blanco sólido + borde negro
                propios del hero (--color-hero-secondary-*, invierte en
                oscuro). */}
            <JdhButton
              asChild
              size="lg"
              variant="secondary"
              className="border-[var(--color-hero-secondary-border)] bg-[var(--color-hero-secondary-bg)] text-[var(--color-hero-secondary-fg)] hover:border-[var(--color-hero-secondary-border)] hover:bg-[var(--color-hero-secondary-hover-bg)]"
            >
              <Link href="/ingreso">Crear cuenta</Link>
            </JdhButton>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  )
}
