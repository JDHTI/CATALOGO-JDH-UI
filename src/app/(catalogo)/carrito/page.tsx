import type { Metadata } from "next"

import { CatalogoPage } from "@/components/layout/catalogo-page"
import { requireEmpleado } from "@/lib/auth"
import { CarritoView } from "@/modules/carrito"

export const metadata: Metadata = {
  title: "Mi carrito",
  robots: { index: false, follow: false },
}

/** Carrito de EMPLEADOS JDH: cualquier otra sesión recibe 404. */
export default async function CarritoPage() {
  await requireEmpleado()
  return (
    <CatalogoPage>
      <CarritoView />
    </CatalogoPage>
  )
}
