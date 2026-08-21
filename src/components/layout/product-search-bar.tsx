"use client"

import * as React from "react"
import type { Route } from "next"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"

import { CategoryDropdown } from "./category-dropdown"

/**
 * Buscador doble del header (logo → ESTO → contacto): `CategoryDropdown`
 * (custom, ver ese archivo) fundido con el campo de texto dentro de un único
 * contenedor con borde, más un botón de envío — el patrón de las grandes
 * tiendas online.
 *
 * Fondo `--color-paper` (blanco fijo, no reactivo al tema) a propósito: sobre
 * el chrome negro del header, un buscador blanco resalta como el elemento de
 * acción principal de la franja — por eso su texto usa los tokens
 * `on-paper`, no los `on-ink` del resto del header.
 *
 * Navega a `/productos?q=…&categoria=…` — son los mismos parámetros que
 * interpreta `filtrosCatalogoSchema` en el módulo de catálogo.
 */
export function ProductSearchBar({ className }: { className?: string }) {
  const router = useRouter()
  const [categoria, setCategoria] = React.useState("todas")
  const [q, setQ] = React.useState("")

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    if (categoria !== "todas") params.set("categoria", categoria)
    const query = params.toString()
    router.push((query ? `/productos?${query}` : "/productos") as Route)
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
      <CategoryDropdown
        value={categoria}
        onChange={setCategoria}
        className="hidden shrink-0 border-r border-[var(--color-paper-border)] sm:block"
      />

      <input
        type="search"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Buscar en catálogo JDH…"
        aria-label="Buscar productos"
        className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[var(--color-on-paper)] outline-none placeholder:text-[var(--color-on-paper-muted)] [&::-webkit-search-cancel-button]:appearance-none"
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
