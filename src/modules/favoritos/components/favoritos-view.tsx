"use client"

import { useState } from "react"
import Link from "next/link"
import { Heart, PackageSearch, RotateCcw } from "lucide-react"

import { EmptyState } from "@/components/common/empty-state"
import { JdhButton } from "@/components/common/jdh-button"
import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import { Pagination } from "@/components/navigation/pagination"
import { formatNumero } from "@/lib/format"
import { ProductoCard, ProductoCardSkeleton } from "@/modules/catalogo"

import { FavoritosNoDisponiblesError } from "../api/client"
import { useFavoritosPagina } from "../hooks/use-favoritos"

/**
 * 12 favoritos por página, repartidos en 4 filas de 3.
 *
 * El grid se queda en 3 columnas también en pantallas grandes, a diferencia
 * del catálogo, que sube a 4: con 4 columnas los mismos 12 productos caen en
 * 3 filas. Aquí manda la forma pedida —12 por página en 4 filas—, y como la
 * lista es corta y curada por el usuario, no hay nada que ganar apretando una
 * columna más.
 */
const PAGE_SIZE = 12
const GRID = "grid grid-cols-2 gap-4 md:grid-cols-3"

/**
 * Página completa de favoritos.
 *
 * Reusa `ProductoCard` del catálogo a propósito: es la misma entidad y el
 * mismo gesto (ver detalle, quitar de favoritos), así que una card propia
 * solo crearía dos siluetas que se desincronizan. El corazón que trae la card
 * sirve aquí para QUITAR, y al hacerlo la lista se invalida y el producto
 * desaparece.
 *
 * La paginación es estado local y no de URL, al revés que el catálogo: aquí
 * no hay filtros que compartir por enlace ni resultados que alguien vaya a
 * mandar por chat; es una lista privada del usuario.
 */
export function FavoritosView() {
  const [pagina, setPagina] = useState(1)
  const { data, isPending, isError, error, refetch, isPlaceholderData } =
    useFavoritosPagina(pagina, PAGE_SIZE)

  const meta = data?.meta
  const productos = data?.data ?? []

  const cabecera = (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[{ label: "Inicio", href: "/" }, { label: "Favoritos" }]}
      />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          Favoritos
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {meta && meta.total > 0
            ? `${formatNumero(meta.total)} ${meta.total === 1 ? "producto guardado" : "productos guardados"}.`
            : "Los productos que guardes desde el catálogo aparecen aquí."}
        </p>
      </header>
    </div>
  )

  if (isError) {
    // El endpoint aún no publicado no es una avería que el usuario pueda
    // resolver: se le dice que la sección todavía no está, sin "Reintentar".
    const noDisponible = error instanceof FavoritosNoDisponiblesError

    return (
      <div className="flex flex-col gap-6">
        {cabecera}
        <EmptyState
          icon={noDisponible ? Heart : PackageSearch}
          title={
            noDisponible
              ? "Favoritos todavía no está disponible"
              : "No pudimos cargar tus favoritos"
          }
          description={
            noDisponible
              ? "Estamos habilitando esta sección. Mientras tanto puedes seguir explorando el catálogo."
              : "Hubo un problema consultando tus productos guardados. Verifica tu conexión e inténtalo de nuevo."
          }
        >
          <div className="flex flex-wrap justify-center gap-2">
            {!noDisponible ? (
              <JdhButton
                variant="secondary"
                size="sm"
                onClick={() => refetch()}
              >
                <RotateCcw aria-hidden="true" />
                Reintentar
              </JdhButton>
            ) : null}
            <JdhButton asChild variant="ghost" size="sm">
              <Link href="/productos">Explorar catálogo</Link>
            </JdhButton>
          </div>
        </EmptyState>
      </div>
    )
  }

  if (!isPending && productos.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {cabecera}
        <EmptyState
          icon={Heart}
          title="Todavía no tienes favoritos"
          description="Marca el corazón en cualquier producto del catálogo para guardarlo y encontrarlo aquí."
        >
          <JdhButton asChild variant="secondary" size="sm">
            <Link href="/productos">Explorar catálogo</Link>
          </JdhButton>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {cabecera}

      <div
        // `isPlaceholderData`: al cambiar de página se mantiene la anterior
        // atenuada en vez de parpadear a esqueleto, igual que el catálogo.
        className={
          isPlaceholderData ? "opacity-60 transition-opacity" : undefined
        }
      >
        <div className={GRID}>
          {isPending
            ? Array.from({ length: PAGE_SIZE }, (_, i) => (
                <ProductoCardSkeleton key={i} />
              ))
            : productos.map((producto) => (
                <ProductoCard key={producto.id} producto={producto} />
              ))}
        </div>
      </div>

      {meta && meta.totalPages > 1 ? (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          onPageChange={setPagina}
        />
      ) : null}
    </div>
  )
}
