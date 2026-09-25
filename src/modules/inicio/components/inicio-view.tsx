import type { BannerSitio, PiezaHero } from "../types"

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
 * la primera pieza del hero es el LCP y no puede descubrirse después de
 * hidratar. Están cacheadas con `revalidate`, así que la ruta sigue estática
 * — ver `../server/queries.ts`. Sin ellas el hero queda como banda negra con
 * su copy y los banners no se dibujan.
 *
 * El texto institucional (copy del hero, cobertura, CTA) es propio y siempre
 * está presente — el del hero volvió al DOM y ya no viene horneado en la foto.
 *
 * En MÓVIL las tres secciones que en desktop son grilla colapsan a scroll
 * horizontal en vez de apilarse: cobertura y proveedores como pista de una
 * fila, marcas como vitrina de tres filas. Apiladas, las tres sumaban más de
 * veinte pantallas entre el hero y el CTA. Cada componente declara su propia
 * pista (`no-scrollbar` + `overflow-x-auto`); no hay wrapper compartido, y el
 * marcado NO se duplica por breakpoint — es el mismo contenedor cambiando de
 * `flex`/`grid-flow-col` a grilla en `sm`.
 *
 * Las tres comparten UNA sola altura de tarjeta en móvil,
 * `--jdh-card-movil` (`globals.css`) — la vitrina de marcas son tres filas de
 * esa altura. El ancho no: lo manda el contenido de cada sección. Con alturas
 * propias las tres se leían como carruseles ajenos entre sí.
 *
 * Y dos reglas que las tres pistas comparten, que NO son cosmética:
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
}: {
  hero: PiezaHero[]
  banners: BannerSitio[]
}) {
  return (
    <div>
      <HeroSection imagenes={hero} />
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
