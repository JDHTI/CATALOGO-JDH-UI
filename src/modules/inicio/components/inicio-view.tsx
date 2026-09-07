import type { BannerSitio, ImagenSitio } from "../types"

import { BrandsSection } from "./brands-section"
import { CtaSection } from "./cta-section"
import { FeaturedProducts } from "./featured-products"
import { HeroSection } from "./hero-section"
import { PromoBanner } from "./promo-banner"
import { ProveedoresSection } from "./proveedores-section"
import { ProviderMarquee } from "./provider-marquee"
import { ValueProps } from "./value-props"

/**
 * Vista del homepage (Server Component): el primer slide es full-bleed
 * (imagen de fondo a viewport); le sigue la sección de cobertura full-bleed
 * (`ValueProps`) pegada al hero, negra en tema claro y blanca en oscuro.
 *
 * Orden: hero → cobertura negra → proveedores (grilla) → muestra del catálogo
 * (carrusel) → banners publicitarios → cinta INFINITA de proveedores
 * (negra en claro, blanca en oscuro) → marcas (grilla de logos) → CTA final.
 *
 * Las secciones que dependen del CATÁLOGO (`ProveedoresSection`,
 * `FeaturedProducts`, `ProviderMarquee`, `BrandsSection`) piden sus datos
 * ellas mismas al API desde el cliente y se OCULTAN si no hay: así `/` sigue
 * prerenderizada sin depender de que el API esté arriba en build, y las
 * secciones aparecen al hidratar.
 *
 * Las IMÁGENES del sitio (hero y banners, de `site/*` en el bucket) son la
 * excepción: las resuelve la RUTA en el servidor y llegan como props, porque
 * el hero es el LCP y no puede descubrirse después de hidratar. Están
 * cacheadas con `revalidate`, así que la ruta sigue estática — ver
 * `../server/queries.ts`. Sin ellas el hero cae a la foto del repo y los
 * banners no se dibujan.
 *
 * El texto institucional (copy del hero, cobertura, CTA) es propio y siempre
 * está presente.
 */
export function InicioView({
  hero,
  banners,
}: {
  hero: ImagenSitio | null
  banners: BannerSitio[]
}) {
  return (
    <div>
      <HeroSection imagen={hero} />
      <ValueProps />

      <div className="mx-auto flex w-full max-w-[var(--container-wide)] flex-col gap-[var(--space-16)] px-6 py-[var(--space-16)] pb-24 md:pb-[var(--space-32)] lg:gap-[var(--space-32)] lg:py-[var(--space-32)]">
        <ProveedoresSection />
        <FeaturedProducts />
        <PromoBanner banners={banners} />
      </div>

      <ProviderMarquee />

      <div className="mx-auto flex w-full max-w-[var(--container-wide)] flex-col gap-[var(--space-16)] px-6 py-[var(--space-16)] pb-24 md:pb-[var(--space-32)] lg:gap-[var(--space-32)] lg:py-[var(--space-32)]">
        <BrandsSection />
        <CtaSection />
      </div>
    </div>
  )
}
