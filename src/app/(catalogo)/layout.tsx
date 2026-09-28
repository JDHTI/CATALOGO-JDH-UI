import { WelcomeCurtain } from "@/components/auth/welcome-curtain"
import { ThemeToggle } from "@/components/common/theme-switcher"
import { WhatsappFlotante } from "@/components/common/whatsapp-flotante"
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
    <div className="flex min-h-svh flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* Cortina de llegada tras ingresar. Ya no necesita `Suspense`: lo
          llevaba porque leía `useSearchParams`, y ahora lee `window.location`
          y solo usa `usePathname`, que es seguro en rutas estáticas y no
          obliga a renderizado dinámico. Ver `welcome-curtain.tsx`. */}
      <WelcomeCurtain />

      <CatalogoChrome />

      <main className="w-full flex-1">{children}</main>

      {/* Footer oculto en /productos y /listas (ver SiteFooter). */}
      <SiteFooter />
      <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-4 z-[var(--z-sticky)] md:hidden">
        <ThemeToggle className="size-11 rounded-full border border-border bg-background text-foreground shadow-lg" />
      </div>
      <WhatsappFlotante />
      <MobileBottomNav />
    </div>
  )
}
