"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  UserRound,
} from "lucide-react"

import { InitialsAvatar } from "@/components/common/initials-avatar"
import { PERMISSIONS } from "@/config/permissions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCurrentUser } from "@/hooks/use-current-user"
import { authClient } from "@/lib/auth/client"
import { cn } from "@/lib/utils"

/**
 * El desplegable se queda BLANCO en los dos temas, como la nav principal y el
 * footer: cuelga del chrome negro, que tampoco cambia con el tema, y un panel
 * oscuro colgando de una barra oscura pierde el borde entre ambos.
 *
 * En vez de sobreescribir clase por clase (fondo, texto, hover, separador,
 * anillo, y encima los descendientes que `ui/dropdown-menu` tiñe con
 * `**:text-accent-foreground`), se REDEFINEN LOS TOKENS en el propio panel.
 * `@theme inline` hace que `bg-popover` compile a `var(--popover)`, así que
 * cambiar esa variable aquí la hereda todo lo que hay dentro y cada utilidad
 * resuelve sola al valor papel. Sin peleas de especificidad y sin tocar
 * `components/ui/`, que es salida del CLI de shadcn.
 *
 * `--color-text` entra en la lista porque de él salen `text-foreground` (el
 * nombre en la cabecera) y el `ring-foreground/10` del panel, que sobre blanco
 * tenía que dejar de ser blanco.
 */
const MENU_PAPEL = [
  "[--popover:var(--color-paper)]",
  "[--popover-foreground:var(--color-on-paper)]",
  "[--accent:var(--color-paper-hover)]",
  "[--accent-foreground:var(--color-on-paper)]",
  "[--border:var(--color-paper-border)]",
  "[--muted-foreground:var(--color-on-paper-muted)]",
  "[--color-text:var(--color-on-paper)]",
  "[--destructive:var(--color-destructive-on-paper)]",
].join(" ")

/**
 * Menú de perfil de la segunda barra (chrome negro), solo para visitantes
 * CON sesión — el estado anónimo ("Mi cuenta") lo dibuja `AuthActions`, que
 * es quien decide cuál de los dos renderizar. Sin props: lee la sesión
 * directamente (`useCurrentUser`).
 */
export function UserMenu() {
  const { user, permissions } = useCurrentUser()
  const router = useRouter()

  if (!user) return null

  // Administración salió del destino automático tras ingresar (ahora todo el
  // mundo aterriza en el catálogo, ver `redirect-to.ts`), así que el personal
  // JDH necesita una puerta explícita. Solo se dibuja con el permiso: para
  // quien no lo tiene, `/admin` responde 404 y anunciarla sería filtrar que
  // existe.
  const puedeAdministrar = permissions.includes(PERMISSIONS.admin.access)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 max-w-40 items-center gap-2 rounded-lg px-1.5 text-left transition-colors outline-none hover:bg-[var(--overlay-on-dark-08)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus-on-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-ink)]"
        >
          <InitialsAvatar
            name={user.name}
            src={user.image ?? undefined}
            size="sm"
            tone="on-ink"
          />
          <span className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate text-sm font-medium text-[var(--color-on-ink)]">
              {user.name}
            </span>
            {user.clienteId ? (
              <span className="truncate text-xs text-[var(--color-on-ink-muted)]">
                Cliente {user.clienteId}
              </span>
            ) : null}
          </span>
          <ChevronDown className="size-4 text-[var(--color-on-ink-muted)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn("w-[250px]", MENU_PAPEL)}>
        <DropdownMenuLabel>
          <span className="block text-sm font-medium text-foreground">
            {user.name}
          </span>
          <span className="block text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/cuenta">
            <UserRound />
            Mi cuenta
          </Link>
        </DropdownMenuItem>
        {puedeAdministrar ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <LayoutDashboard />
                Administración
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            void authClient.signOut({
              fetchOptions: {
                // Revalida el árbol con la cookie ya eliminada sin cambiar la
                // URL: en rutas públicas el usuario permanece exactamente
                // donde estaba. Las rutas protegidas aplican su guard normal.
                onSuccess: () => router.refresh(),
              },
            })
          }}
        >
          <LogOut />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
