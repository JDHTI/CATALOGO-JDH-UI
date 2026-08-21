import type { Metadata } from "next"

import { InicioView } from "@/modules/inicio"

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "Catálogo JDH: alimentos, bebidas y productos de limpieza con precios de lista pública y entrega en siete ciudades de Colombia.",
}

/** Portada del catálogo — renderiza la vista del módulo `inicio`. */
export default function HomePage() {
  return <InicioView />
}
