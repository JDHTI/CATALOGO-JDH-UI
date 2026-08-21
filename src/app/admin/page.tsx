import { PageHeader } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { LayoutDashboard } from "lucide-react"

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de administración"
        description="Gestión del catálogo, las listas de precios y las cuentas de cliente."
      />
      <EmptyState
        icon={LayoutDashboard}
        title="Panel en construcción"
        description="La estructura del panel está lista. Las vistas de productos, precios y clientes llegan en una próxima iteración."
      />
    </div>
  )
}
