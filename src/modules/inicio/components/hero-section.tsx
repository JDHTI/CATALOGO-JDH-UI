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
 * imagen — no centrados en pantalla —, en tokens ink (negro de marca, no se
 * invierte con el tema). Sin velo oscuro: taparía el blanco de la foto y
 * haría ilegible el texto negro.
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
