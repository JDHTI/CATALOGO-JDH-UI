import Link from "next/link"

import { AuthShowcase } from "@/components/auth/auth-showcase"
import { Logo } from "@/components/common/logo"

/**
 * Layout de las rutas de ingreso. El panel fotográfico ocupa 60% a la
 * izquierda y la columna de credenciales 40% a la derecha. Sin chrome de app.
 *
 * Por debajo de `lg` la grilla colapsa a flujo de columna: el panel queda como
 * banda corta arriba (fija su propia altura) y el formulario toma el resto del
 * viewport.
 *
 * El lockup vive en la columna de credenciales en todos los anchos. En el
 * panel fotográfico, su posición anterior la ocupa la salida al catálogo.
 *
 * **Desde `lg`, el panel fotográfico NO se desplaza.** La grilla se fija a la
 * altura exacta del viewport (`lg:h-svh` + `lg:overflow-hidden`) y quien
 * scrollea es solo la columna de credenciales. Antes la página entera crecía
 * con el formulario más alto —el de crear cuenta, que suma cuatro campos, el
 * medidor de fuerza y los proveedores externos— y arrastraba la fotografía
 * hacia arriba con él.
 *
 * Por debajo de `lg` sigue siendo flujo normal de documento: el panel es una
 * banda de 96px y anclarla ahí solo le robaría alto útil al formulario, justo
 * donde menos sobra.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col lg:grid lg:h-svh lg:min-h-0 lg:grid-cols-[3fr_2fr] lg:overflow-hidden">
      <AuthShowcase />

      {/* `lg:min-h-0` es lo que permite que esta columna scrollee: sin él, el
          `min-height: auto` que traen por defecto los items de una grilla la
          estira hasta su contenido y el desbordamiento se lo come la página.
          `data-lenis-prevent` deja el scroll nativo dentro del contenedor —
          Lenis solo suaviza el scroll del documento (ver `LenisProvider`). */}
      <div
        data-lenis-prevent
        className="flex flex-1 flex-col bg-background px-6 py-6 lg:min-h-0 lg:overflow-y-auto"
      >
        <div className="mx-auto flex w-full max-w-sm shrink-0">
          <Link
            href="/"
            aria-label="Ir al catálogo de Juan D. Hoyos Distribuciones"
            className="inline-flex rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            <Logo variant="lockup" tone="auto" height={40} priority />
          </Link>
        </div>

        {/* El formulario se centra en el espacio que queda bajo el logo, no en
            la columna entera: así el conmutador ingresar/registrarse no se
            mueve verticalmente al cambiar de pestaña.
            Se centra con `m-auto` y NO con `items-center`: dentro de un
            contenedor con scroll, el centrado por alineación desborda por
            ARRIBA cuando el contenido no cabe y ese trozo queda inalcanzable
            (no hay scroll negativo). Los márgenes automáticos se resuelven a 0
            cuando no sobra espacio, así que el formulario alto simplemente
            empieza arriba y se desplaza. */}
        <div className="flex flex-1 py-8">
          <div className="m-auto w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
