import { BrandsSection } from "./brands-section"
import { CtaSection } from "./cta-section"
import { FeaturedProducts } from "./featured-products"
import { HeroSection } from "./hero-section"
import { ProveedoresSection } from "./proveedores-section"
import { ProviderMarquee } from "./provider-marquee"
import { ValueProps } from "./value-props"

/**
 * Vista del homepage (Server Component): el primer slide es full-bleed
 * (imagen de fondo a viewport); le sigue la sección de cobertura FULL-BLEED
 * NEGRA (`ValueProps`) pegada al hero — el espacio entre ambos es el propio
 * negro de la página.
 *
 * Orden: hero → cobertura negra → proveedores (grilla) → muestra del catálogo
 * (carrusel) → cinta INFINITA de proveedores (franja negra full-width) →
 * marcas (grilla de logos) → CTA final.
 *
 * Esta vista ya NO pasa datos: las secciones que dependen del catálogo
 * (`ProveedoresSection`, `FeaturedProducts`, `ProviderMarquee`,
 * `BrandsSection`) los piden ellas mismas al API desde el cliente y se
 * OCULTAN si no hay datos. Antes recibían cuatro colecciones mockeadas —
 * productos con precio inventado incluidos.
 *
 * Que el fetch sea en cliente mantiene `/` como ruta estática: la homepage
 * se prerenderiza sin depender de que el API esté arriba en build, y las
 * secciones aparecen al hidratar. El contenido institucional (hero,
 * cobertura, CTA) es texto propio y siempre está presente.
 */
export function InicioView() {
  return (
    <div>
      <HeroSection />
      <ValueProps />

      <div className="mx-auto flex w-full max-w-[var(--container-wide)] flex-col gap-[var(--space-16)] px-6 py-[var(--space-16)] pb-24 md:pb-[var(--space-32)] lg:gap-[var(--space-32)] lg:py-[var(--space-32)]">
        <ProveedoresSection />
        <FeaturedProducts />
      </div>

      <ProviderMarquee />

      <div className="mx-auto flex w-full max-w-[var(--container-wide)] flex-col gap-[var(--space-16)] px-6 py-[var(--space-16)] pb-24 md:pb-[var(--space-32)] lg:gap-[var(--space-32)] lg:py-[var(--space-32)]">
        <BrandsSection />
        <CtaSection />
      </div>
    </div>
  )
}
