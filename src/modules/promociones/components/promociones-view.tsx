import Link from "next/link"
import { Tag } from "lucide-react"

import { EmptyState } from "@/components/common/empty-state"
import { JdhButton } from "@/components/common/jdh-button"
import { Breadcrumbs } from "@/components/navigation/breadcrumbs"

/**
 * Página de promociones.
 *
 * Hoy no hay promociones activas, y el API aún no publica cuáles lo están:
 * la página existe para que el acceso del header lleve a un lugar propio y
 * diga eso con claridad, en vez de abrir el catálogo completo como si todo
 * estuviera en promoción. Cuando el API publique las promociones, la grilla
 * entra aquí en lugar del estado vacío (con `ProductoCard`, igual que el
 * catálogo y favoritos).
 */
export function PromocionesView() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[{ label: "Inicio", href: "/" }, { label: "Promociones" }]}
      />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          Promociones
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Productos con precio o condición especial por tiempo limitado.
        </p>
      </header>

      <EmptyState
        icon={Tag}
        title="En este momento no tenemos promociones activas"
        description="Vuelve pronto: aquí publicaremos las próximas. Mientras tanto, puedes explorar el catálogo completo."
      >
        <JdhButton asChild variant="secondary" className="mt-2">
          <Link href="/productos">Explorar el catálogo</Link>
        </JdhButton>
      </EmptyState>
    </div>
  )
}
