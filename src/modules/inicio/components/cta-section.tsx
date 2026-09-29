import Link from "next/link"

import { CtaBanner } from "@/components/common/cta-banner"
import { JdhButton } from "@/components/common/jdh-button"
import { ScrollReveal } from "@/components/motion/scroll-reveal"

/**
 * CTA final del homepage: banner negro (`CtaBanner` común) invitando a crear
 * cuenta para ver precios negociados. Botón primary-on-ink (un solo primario
 * en el bloque, DESIGN.md §4.3).
 *
 * En tema oscuro el banner es BLANCO (`bg-primary` se invierte), y el
 * primary-on-ink —también blanco— desaparecía: el botón se invierte a tinta.
 */
export function CtaSection() {
  return (
    <section aria-labelledby="cta-title">
      <ScrollReveal>
        <CtaBanner
          eyebrow="Clientes JDH"
          title="¿Compras seguido? Crea tu cuenta."
          description="Las cuentas de cliente ven sus precios negociados, arman listas de compra y hacen seguimiento a sus pedidos."
        >
          <JdhButton
            asChild
            variant="primary-on-ink"
            size="lg"
            className="dark:bg-[var(--color-ink)] dark:text-[var(--color-on-ink)] dark:hover:bg-[var(--color-ink-hover)] dark:focus-visible:ring-ring"
          >
            <Link href="/ingreso" id="cta-title">
              Crear cuenta o ingresar
            </Link>
          </JdhButton>
        </CtaBanner>
      </ScrollReveal>
    </section>
  )
}
