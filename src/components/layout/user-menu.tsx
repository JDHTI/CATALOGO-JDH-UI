"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronDown, ClipboardList, LogOut, UserRound } from "lucide-react"

import { InitialsAvatar } from "@/components/common/initials-avatar"
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

/**
 * Menú de perfil de la segunda barra (chrome negro), solo para visitantes
 * CON sesión — el estado anónimo ("Mi cuenta") lo dibuja `AuthActions`, que
 * es quien decide cuál de los dos renderizar. Sin props: lee la sesión
 * directamente (`useCurrentUser`).
 */
export function UserMenu() {
  const { user } = useCurrentUser()
  const router = useRouter()

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-lg px-1.5 text-left transition-colors outline-none hover:bg-[var(--overlay-on-dark-08)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus-on-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-ink)]"
        >
          <InitialsAvatar name={user.name} size="sm" tone="muted" />
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
      <DropdownMenuContent align="end" className="w-[250px]">
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
        <DropdownMenuItem asChild>
          <Link href="/listas">
            <ClipboardList />
            Mis listas
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            void authClient.signOut({
              fetchOptions: {
                // Al catálogo público, no a `/ingreso`: cerrar sesión no debe
                // dejar al usuario en una pantalla de login sin salida.
                onSuccess: () => router.push("/productos"),
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
