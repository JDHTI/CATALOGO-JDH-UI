import { UserRound } from "lucide-react"

import { PERMISSIONS } from "@/config/permissions"
import { defineModule } from "@/lib/modules"

/**
 * Área privada del cliente: sus datos, su lista de precios asignada y sus
 * preferencias de visualización (IVA incluido, etc.). `cuenta:read` no lo
 * tiene `anonimo`, así que el módulo desaparece del nav sin sesión — no hace
 * falta ningún `if` en los componentes de navegación.
 */
export const cuentaModule = defineModule({
  id: "cuenta",
  title: "Mi cuenta",
  description: "Tus datos, tu lista de precios y tus preferencias.",
  href: "/cuenta",
  icon: UserRound,
  permissions: [PERMISSIONS.cuenta.read],
  nav: {
    section: "secondary",
    order: 90,
  },
})
