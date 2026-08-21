import {
  categoriasDestacadas,
  productosDestacados,
  proveedores,
} from "../mock/inicio.mock"
import { CategoriesSection } from "./categories-section"
import { CtaSection } from "./cta-section"
import { FeaturedProducts } from "./featured-products"
import { HeroSection } from "./hero-section"
import { SuppliersSection } from "./suppliers-section"
import { ValueProps } from "./value-props"

/**
 * Vista del homepage (Server Component): el primer slide es full-bleed
 * (imagen de fondo a viewport); las secciones posteriores viven en el
 * contenedor `--container-wide` con el ritmo vertical de DESIGN.md §2.5.
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

      <div className="mx-auto flex w-full max-w-[var(--container-wide)] flex-col gap-[var(--space-16)] px-6 py-[var(--space-16)] pb-24 lg:gap-[var(--space-32)] lg:py-[var(--space-32)] md:pb-[var(--space-32)]">
        <ValueProps />
        <CategoriesSection categorias={categoriasDestacadas} />
        <FeaturedProducts productos={productosDestacados} />
        <SuppliersSection proveedores={proveedores} />
        <CtaSection />
      </div>
    </div>
  )
}
