import { FadeIn } from "@/components/motion/fade-in"

import { BackToCatalog } from "./back-to-catalog"
import { ShowcasePhotos } from "./showcase-photos"

/**
 * Panel visual de acceso: las fotos de la operación de JDH aparecen bajo un
 * velo de tinta y la salida al catálogo ocupa la esquina superior izquierda.
 * Solo el carrusel es cliente; el resto del panel sigue siendo de servidor.
 */
export function AuthShowcase() {
  return (
    <section className="relative isolate flex h-24 shrink-0 flex-col justify-start overflow-hidden bg-[var(--color-ink)] p-6 text-[var(--color-on-ink)] sm:h-28 lg:h-auto lg:p-12">
      <ShowcasePhotos />

      <FadeIn delay={0.05}>
        <BackToCatalog />
      </FadeIn>
    </section>
  )
}
