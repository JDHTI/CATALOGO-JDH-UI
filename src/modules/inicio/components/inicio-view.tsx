import {
  categoriasDestacadas,
  marcasDestacadas,
  productosDestacados,
  proveedores,
} from "../mock/inicio.mock"
import { BrandsSection } from "./brands-section"
import { CategoriesSection } from "./categories-section"
import { CtaSection } from "./cta-section"
import { FeaturedProducts } from "./featured-products"
import { HeroSection } from "./hero-section"
import { ProviderMarquee } from "./provider-marquee"
import { ValueProps } from "./value-props"

/**
 * Vista del homepage (Server Component): el primer slide es full-bleed
 * (imagen de fondo a viewport); le sigue la sección de cobertura/precios de
 * lista FULL-BLEED NEGRA (`ValueProps`) pegada al hero — el espacio entre
 * ambos es el propio negro de la página.
 *
 * Orden: hero → cobertura negra → categorías (icono + descripción) →
 * productos destacados (carrusel) → cinta INFINITA de proveedores (franja
 * negra full-width — ProviderMarquee) → marcas (banner grande de logos) →
 * CTA final.
 *
 * Los datos salen del mock propio del módulo y viajan serializables hacia las
 * secciones cliente. No lee sesión ni PriceContext: el homepage es
 * compartido por anónimos y clientes, y solo muestra precios de lista
 * pública de ejemplo.
 */
export function InicioView() {
  return (
    <div>
      <HeroSection />
      <ValueProps />

      <div className="mx-auto flex w-full max-w-[var(--container-wide)] flex-col gap-[var(--space-16)] px-6 py-[var(--space-16)] lg:gap-[var(--space-32)] lg:py-[var(--space-32)]">
        <CategoriesSection categorias={categoriasDestacadas} />
        <FeaturedProducts productos={productosDestacados} />
      </div>

      <ProviderMarquee proveedores={proveedores} />

      <div className="mx-auto flex w-full max-w-[var(--container-wide)] flex-col gap-[var(--space-16)] px-6 py-[var(--space-16)] lg:gap-[var(--space-32)] lg:py-[var(--space-32)]">
        <BrandsSection marcas={marcasDestacadas} />
        <CtaSection />
      </div>
    </div>
  )
}
