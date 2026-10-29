import { ShoppingCart } from "lucide-react"

import { JdhButton } from "@/components/common/jdh-button"
import { FavoritoBoton } from "@/modules/favoritos/components/favorito-boton"
import type { Producto } from "../types"

export function ProductoAcciones({ producto }: { producto: Producto }) {
  return (
    <div className="shrink-0 space-y-2">
      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Cantidad
          <input
            type="number"
            min={1}
            step={1}
            defaultValue={1}
            disabled
            aria-describedby="carrito-disponibilidad"
            className="h-10 w-20 rounded-lg border border-[var(--color-border)] bg-background px-3 text-foreground disabled:opacity-50"
          />
        </label>
        <div className="flex min-w-0 items-center gap-2">
          <JdhButton
            className="min-w-0 px-3"
            disabled
            aria-describedby="carrito-disponibilidad"
          >
            <ShoppingCart aria-hidden="true" />
            Agregar al carrito
          </JdhButton>
          <FavoritoBoton
            productoId={producto.id}
            nombreProducto={producto.nombre}
            className="shrink-0"
          />
        </div>
      </div>
      <p id="carrito-disponibilidad" className="text-xs text-muted-foreground">
        El carrito estará disponible próximamente.
      </p>
    </div>
  )
}
