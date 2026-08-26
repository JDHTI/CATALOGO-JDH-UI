"use client"

import * as React from "react"
import type { Route } from "next"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Buscador del header (logo → ESTO → contacto): campo de texto y botón de
 * envío en un único contenedor con borde.
 *
 * Fondo `--color-paper` (blanco fijo, no reactivo al tema) a propósito: sobre
 * el chrome negro del header, un buscador blanco resalta como el elemento de
 * acción principal de la franja — por eso su texto usa los tokens
 * `on-paper`, no los `on-ink` del resto del header.
 *
 * Antes tenía un segmento de categoría fundido a la izquierda. Se retiró: la
 * clasificación real del catálogo es por proveedor y marca (cientos de
 * proveedores), que no caben en un dropdown de header — esos dos ejes viven
 * en el panel de filtros del listado, que tiene búsqueda propia. Aquí solo
 * viaja el término: `/productos?q=…`, el mismo parámetro que interpreta
 * `CatalogoView`.
 */
export function ProductSearchBar({ className }: { className?: string }) {
  const router = useRouter()
  const [q, setQ] = React.useState("")

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const termino = q.trim()
    router.push(
      (termino
        ? `/productos?q=${encodeURIComponent(termino)}`
        : "/productos") as Route
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      aria-label="Buscar productos"
      className={cn(
        "flex h-11 w-full items-stretch rounded-lg border border-transparent bg-[var(--color-paper)] transition-colors focus-within:border-[var(--color-ink)]",
        className
      )}
    >
      <input
        type="search"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Buscar por nombre, código o marca…"
        aria-label="Buscar productos"
        className="min-w-0 flex-1 bg-transparent px-4 text-sm text-[var(--color-on-paper)] outline-none placeholder:text-[var(--color-on-paper-muted)] [&::-webkit-search-cancel-button]:appearance-none"
      />

      <button
        type="submit"
        aria-label="Buscar"
        className="flex shrink-0 items-center justify-center px-4 text-[var(--color-on-paper)] transition-colors hover:bg-[var(--color-paper-hover)]"
      >
        <Search className="size-4" />
      </button>
    </form>
  )
}
