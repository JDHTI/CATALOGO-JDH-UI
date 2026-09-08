import Link from "next/link"
import { ArrowLeft, PackageX, RotateCcw } from "lucide-react"

import { EmptyState } from "@/components/common/empty-state"
import { JdhButton } from "@/components/common/jdh-button"
import { Breadcrumbs } from "@/components/navigation/breadcrumbs"

export function ProductoDetalleEstado({
  noEncontrado = false,
  onRetry,
}: {
  noEncontrado?: boolean
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Productos", href: "/productos" },
          { label: "Detalle" },
        ]}
      />
      <div role={noEncontrado ? "status" : "alert"}>
        <EmptyState
          icon={PackageX}
          title={
            noEncontrado
              ? "Producto no encontrado"
              : "No pudimos cargar el producto"
          }
          description={
            noEncontrado
              ? "El producto que buscas no existe o ya no está publicado en el catálogo."
              : "Hubo un problema consultando el catálogo. Inténtalo de nuevo."
          }
        >
          <div className="flex flex-wrap justify-center gap-2">
            {onRetry && !noEncontrado ? (
              <JdhButton variant="secondary" size="sm" onClick={onRetry}>
                <RotateCcw aria-hidden="true" />
                Reintentar
              </JdhButton>
            ) : null}
            <JdhButton asChild variant="ghost" size="sm">
              <Link href="/productos">
                <ArrowLeft aria-hidden="true" />
                Volver a productos
              </Link>
            </JdhButton>
          </div>
        </EmptyState>
      </div>
    </div>
  )
}
