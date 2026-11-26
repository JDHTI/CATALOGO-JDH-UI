import type { BannerSitio, LogoMarca, PiezaHero } from "../types"

import { BrandsSection } from "./brands-section"
import { CategoriasSection } from "./categorias-section"
import { CtaSection } from "./cta-section"
import { FeaturedProducts } from "./featured-products"
import { HeroSection } from "./hero-section"
import { NewsletterSection } from "./newsletter-section"
import { PromoBanner } from "./promo-banner"
import { ValueProps } from "./value-props"

/**
 * Vista del homepage (Server Component).
 *
 * Orden: hero a MEDIA altura (full-bleed) → categorías (grilla) → muestra del
 * catálogo (grilla 4×3) → banners publicitarios → cobertura full-bleed
 * (`ValueProps`, negra en claro y blanca en oscuro) → marcas (tablero
 * rotativo de logos) → CTA de crear cuenta → formulario de contacto tipo
 * newsletter (`NewsletterSection`, guarda en `POST /contact-leads`).
 *
 * El hero dejó de ocupar toda la primera vista para que las categorías asomen
 * sin hacer scroll. La cinta infinita de proveedores se retiró: repetía lo
 * que ya dice el tablero de marcas, y los proveedores siguen en los filtros
 * de `/productos`. La cobertura ocupa ahora ese hueco entre los dos bloques
 * de contenido.
 *
 * Las secciones que dependen del CATÁLOGO (`CategoriasSection`,
 * `FeaturedProducts`) piden sus datos ellas mismas al API desde el cliente:
 * así `/` no depende de que el API esté arriba en build, y las secciones
 * aparecen al hidratar.
 *
 * Lo que sale del BUCKET (hero y banners de `site/*`, y el manifiesto de
 * logos `brands/manifest.json`) es la excepción: lo resuelve la RUTA en el
 * servidor y llega como props. El hero porque su primera pieza es el LCP y no
 * puede descubrirse después de hidratar; el manifiesto porque el bucket no
 * da CORS y el navegador no puede leerlo. Todo va con `revalidate`, así que la
 * ruta sigue estática — ver `../server/queries.ts`. Sin ellas el hero queda
 * como banda negra con su copy, los banners no se dibujan y el tablero de
 * marcas queda en fantasma.
 *
 * El texto institucional (copy del hero, cobertura, CTA) es propio y siempre
 * está presente — el del hero volvió al DOM y ya no viene horneado en la foto.
 *
 * En MÓVIL cobertura y categorías colapsan a scroll horizontal (pista de una
 * fila) en vez de apilarse. Las marcas no lo necesitan: el tablero ya es de
 * cuatro filas fijas y en móvil solo muestra menos columnas. Cada pista
 * declara su propio `no-scrollbar` + `overflow-x-auto`; no hay wrapper
 * compartido, y el marcado NO se duplica por breakpoint — es el mismo
 * contenedor cambiando de `flex` a grilla en `sm`.
 *
 * Las pistas comparten UNA sola altura de tarjeta en móvil,
 * `--jdh-card-movil` (`globals.css`). El ancho no: lo manda el contenido de
 * cada sección.
 *
 * Y dos reglas que las pistas comparten, que NO son cosmética:
 *
 * 1. `overflow-y-hidden` junto al `overflow-x-auto`. Con el eje Y en
 *    `visible`, la cascada de CSS Overflow (§3.2) lo sube a `auto` y la pista
 *    se vuelve TAMBIÉN contenedor de scroll vertical: el arrastre del dedo
 *    sobre ella se consumía ahí antes de encadenar a la página, y el scroll
 *    de la portada daba un brinco cada vez que el gesto cruzaba una sección.
 * 2. NADA de `scroll-snap` y NADA de `data-lenis-prevent`. El snap obligatorio
 *    reevalúa su punto de anclaje mientras `Stagger` anima los `transform` de
 *    las tarjetas al entrar en vista, y corregía el `scrollLeft` en cada
 *    fotograma — tironeo horizontal durante la entrada. Y `data-lenis-prevent`
 *    apagaba el suavizado de Lenis en el tramo vertical que ocupa la sección,
 *    de modo que la página alternaba entre scroll suave y nativo. El scroll
 *    libre con inercia nativa es lo que se siente fluido; Lenis va en vertical
 *    y nunca lee `deltaX`, así que no le disputa el eje horizontal a la pista.
 */
export function InicioView({
  hero,
  banners,
  marcas,
}: {
  hero: PiezaHero[]
  banners: BannerSitio[]
  marcas: LogoMarca[] | null
}) {
  return (
    <div>
      <HeroSection imagenes={hero} />

      {/* Arriba, menos aire que entre secciones (`pt` propio): con el hero a
          media altura, el hueco de 8rem lo despegaba de las categorías y la
          primera vista se leía como dos bloques sueltos. */}
      <div className="mx-auto flex w-full max-w-[var(--container-wide)] flex-col gap-[var(--space-16)] px-6 pt-[var(--space-8)] pb-24 md:pb-[var(--space-32)] lg:gap-[var(--space-32)] lg:pt-[var(--space-12)] lg:pb-[var(--space-32)]">
        <CategoriasSection />
        <FeaturedProducts />
        <PromoBanner banners={banners} />
      </div>

      <ValueProps />

      <div className="mx-auto flex w-full max-w-[var(--container-wide)] flex-col gap-[var(--space-16)] px-6 py-[var(--space-16)] pb-24 md:pb-[var(--space-32)] lg:gap-[var(--space-32)] lg:py-[var(--space-32)]">
        <BrandsSection marcas={marcas} />
        <CtaSection />
        <NewsletterSection />
      </div>
    </div>
  )
}
