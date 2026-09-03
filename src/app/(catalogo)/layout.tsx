import { Suspense } from "react"

import { WelcomeCurtain } from "@/components/auth/welcome-curtain"
import { CatalogoChrome } from "@/components/layout/catalogo-chrome"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { SiteFooter } from "@/components/layout/site-footer"

/**
 * Shell del catálogo (DESIGN.md): chrome sticky (`CatalogoChrome` — barra de
 * contacto con aviso encima, header principal con logo + buscador + cuenta, y
 * barra de menú con mega menú, categorías destacadas y Promociones) +
 * contenido en `<main>` + footer negro. En móvil se suma `MobileBottomNav`,
 * fija en la parte inferior.
 *
 * `<main>` es full-bleed a propósito: el homepage pinta un primer slide a
 * viewport (imagen de fondo). Las páginas internas se acotan con
 * `CatalogoPage` (mismo `--container-wide` + gutter de antes).
 *
 * La barra de contacto se OCULTA al scrollear hacia abajo y reaparece al
 * subir (ver `CatalogoChrome`): nunca se desplaza con la página, colapsa en
 * su lugar y el header queda pegada al tope.
 *
 * DOS de los tres frentes viven aquí: catálogo PÚBLICO y catálogo de CLIENTES.
 * Es el mismo layout, las mismas rutas y los mismos componentes a propósito —
 * lo único que cambia entre ambos es de dónde sale el precio, y eso se resuelve
 * en la capa de datos vía `src/lib/precios`, no con un layout aparte ni con un
 * route group por audiencia. Duplicar el árbol de rutas para variar el precio
 * habría duplicado también todo el mantenimiento del catálogo.
 *
 * El tercer frente (administración) tiene su propio shell en `src/app/admin/`.
 */
export default function CatalogoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Cortina de llegada tras ingresar. En `Suspense` porque lee
          `useSearchParams`: sin el límite, ese hook desde el layout arrastraría
          a renderizado en cliente TODAS las rutas del grupo, incluidas las que
          hoy sí se generan estáticas. Con `fallback={null}` no dibuja nada
          hasta hidratar, que es justo lo que corresponde a una animación. */}
      <Suspense fallback={null}>
        <WelcomeCurtain />
      </Suspense>

      <CatalogoChrome />

      <main className="w-full flex-1">{children}</main>

      {/* Footer oculto en /productos (ver SiteFooter). */}
      <SiteFooter />
      <MobileBottomNav />
    </div>
  )
}
