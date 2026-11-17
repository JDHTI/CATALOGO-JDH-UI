import { AgregarAlCarritoFicha } from "@/modules/carrito/components/agregar-al-carrito"
import { FavoritoBoton } from "@/modules/favoritos/components/favorito-boton"

import type { Producto } from "../types"

/**
 * Acciones de la ficha. El carrito es solo de personal JDH: el bloque de
 * cantidad + «Agregar al carrito» aparece únicamente cuando el producto trae
 * precio de empleado (ver `sePuedeComprar`). Para el resto queda el favorito.
 */
export function ProductoAcciones({ producto }: { producto: Producto }) {
  return (
    <div className="flex shrink-0 flex-wrap items-end gap-2">
      <AgregarAlCarritoFicha producto={producto} />
      <FavoritoBoton
        productoId={producto.id}
        nombreProducto={producto.nombre}
        className="shrink-0"
      />
    </div>
  )
}
