"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  Check,
  ClipboardList,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react"

import { EmptyState } from "@/components/common/empty-state"
import { JdhButton } from "@/components/common/jdh-button"
import { PageHeader } from "@/components/common/page-header"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useBusquedaProductos,
} from "@/modules/catalogo/hooks/use-productos"
import { ProductoImagen } from "@/modules/catalogo/components/producto-imagen"
import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useCurrentUser } from "@/hooks/use-current-user"

import {
  useCrearLista,
  useEliminarItem,
  useEliminarLista,
  useEstablecerCantidad,
  useListaItems,
  useListas,
  useRenombrarLista,
} from "../hooks/use-listas"
import { ListasApiError } from "../api/client"
import type { ListaPedidoItem } from "../types"

const MAX_LISTAS = 10
const SEARCH_LIMIT = 8
const ITEMS_LIMIT = 10

/** Editor de borradores privados, con listas a la izquierda y el borrador activo a la derecha. */
export function ListasView() {
  const { user } = useCurrentUser()
  return <ListasSession key={user?.id ?? "anonymous"} />
}

function ListasSession() {
  // La caché privada se descarta al cambiar de cuenta o salir de la página.
  const [client] = React.useState(() => new QueryClient())
  const searchParams = useSearchParams()
  return (
    <QueryClientProvider client={client}>
      <ListasEditor key={searchParams.get("lista") ?? "default"} />
    </QueryClientProvider>
  )
}

function ListasEditor() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const listaIdFromUrl = searchParams.get("lista")
  const listas = useListas()
  const crear = useCrearLista()
  const renombrar = useRenombrarLista()
  const eliminar = useEliminarLista()
  const setQuantity = useEstablecerCantidad()
  const removeItem = useEliminarItem()

  const data = listas.data
  const active =
    data?.data.find((lista) => lista.id === listaIdFromUrl) ?? data?.data[0]
  const activeId = active?.id
  const [itemPage, setItemPage] = React.useState(1)
  const items = useListaItems(activeId)
  const totalPages = Math.max(1, Math.ceil((items.data?.data.length ?? 0) / ITEMS_LIMIT))
  const visiblePage = Math.min(itemPage, totalPages)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [newName, setNewName] = React.useState("")
  const [renameOpen, setRenameOpen] = React.useState(false)
  const [renameValue, setRenameValue] = React.useState("")
  const [deleteArmed, setDeleteArmed] = React.useState(false)
  const [quantityDrafts, setQuantityDrafts] = React.useState<Record<string, string>>({})

  const selectList = React.useCallback(
    (id: string) => {
      setItemPage(1)
      router.replace(`/listas?lista=${encodeURIComponent(id)}`, { scroll: false })
    },
    [router]
  )
  const clearSelection = React.useCallback(
    () => router.replace("/listas", { scroll: false }),
    [router]
  )

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = newName.trim()
    if (!name || crear.isPending) return
    try {
      const lista = await crear.mutateAsync(name)
      setNewName("")
      setDialogOpen(false)
      selectList(lista.id)
    } catch {
      // El mensaje queda visible en el diálogo.
    }
  }

  async function submitRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!active || renombrar.isPending) return
    const name = renameValue.trim()
    if (!name || name === active.name) {
      setRenameOpen(false)
      return
    }
    try {
      await renombrar.mutateAsync({ id: active.id, name })
      setRenameOpen(false)
    } catch {
      // El mensaje queda visible debajo del editor.
    }
  }

  async function submitDelete() {
    if (!active || eliminar.isPending) return
    try {
      await eliminar.mutateAsync(active.id)
      setDeleteArmed(false)
      clearSelection()
    } catch {
      // El mensaje queda visible debajo del editor.
    }
  }

  function saveQuantity(item: ListaPedidoItem) {
    if (!activeId || setQuantity.isPending) return
    const quantity = Number(quantityDrafts[item.productId] ?? item.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 2147483647) {
      setQuantityDrafts((previous) => ({ ...previous, [item.productId]: String(item.quantity) }))
      return
    }
    if (quantity === item.quantity) return
    setQuantity.mutate({ listaId: activeId, productoId: item.productId, quantity }, {
      onSettled: () => setQuantityDrafts((previous) => {
        const next = { ...previous }
        delete next[item.productId]
        return next
      }),
    })
  }

  return (
    <div className="space-y-8">
      <Link href="/productos" className="inline-flex text-sm text-muted-foreground hover:text-foreground hover:underline">
        Volver al catálogo
      </Link>
      <PageHeader
        title="Mis listas"
        description="Guarda borradores de pedido para retomarlos cuando estés listo."
      >
        <JdhButton
          size="sm"
          onClick={() => setDialogOpen(true)}
          disabled={data?.meta.total != null && data.meta.total >= MAX_LISTAS}
        >
          <Plus aria-hidden="true" />
          Nueva lista
        </JdhButton>
      </PageHeader>

      {listas.isError ? (
        <EmptyState
          icon={ClipboardList}
          title="No pudimos cargar tus listas"
          description="Verifica tu conexión e inténtalo de nuevo. Tus borradores no se han modificado."
        >
          <JdhButton variant="secondary" size="sm" onClick={() => listas.refetch()}>
            <RotateCcw aria-hidden="true" />
            Reintentar
          </JdhButton>
        </EmptyState>
      ) : listas.isPending ? (
        <EditorSkeleton />
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Crea tu primera lista"
          description="Una lista es un borrador privado donde puedes reunir productos y cantidades antes de preparar tu pedido."
        >
          <JdhButton size="sm" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden="true" />
            Crear lista
          </JdhButton>
        </EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(15rem,0.78fr)_minmax(0,2fr)]">
          <aside className="self-start rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="flex items-center justify-between px-2 pb-3">
              <div>
                <p className="text-sm font-semibold">Borradores</p>
                <p className="text-xs text-muted-foreground">
                  {data?.meta.total ?? data?.data.length} de {data?.meta.maxLists ?? MAX_LISTAS}
                </p>
              </div>
              <ClipboardList className="size-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <nav aria-label="Tus listas" className="space-y-1">
              {data?.data.map((lista) => (
                <button
                  key={lista.id}
                  type="button"
                  onClick={() => selectList(lista.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-[background-color,color,transform] duration-150 hover:translate-x-0.5 hover:bg-[var(--color-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    lista.id === activeId &&
                      "bg-[var(--color-ink)] text-[var(--color-on-ink)] hover:bg-[var(--color-ink)]"
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{lista.name}</span>
                    <span
                      className={cn(
                        "block text-xs",
                        lista.id === activeId
                          ? "text-[var(--color-on-ink-muted)]"
                          : "text-muted-foreground"
                      )}
                    >
                      {lista.itemCount} {lista.itemCount === 1 ? "producto" : "productos"}
                    </span>
                  </span>
                  {lista.id === activeId ? (
                    <Check className="size-4 shrink-0" aria-hidden="true" />
                  ) : null}
                </button>
              ))}
            </nav>
          </aside>

          {active ? (
            <section className="min-w-0 space-y-5" aria-labelledby="lista-activa">
              <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] pb-4">
                <div className="min-w-0 flex-1">
                  {renameOpen ? (
                    <form onSubmit={submitRename} className="flex max-w-xl items-center gap-2">
                      <Input
                        autoFocus
                        value={renameValue}
                        maxLength={100}
                        onChange={(event) => setRenameValue(event.target.value)}
                        aria-label="Nombre de la lista"
                      />
                      <JdhButton
                        type="submit"
                        size="icon-sm"
                        loading={renombrar.isPending}
                        aria-label="Guardar nombre"
                      >
                        <Check aria-hidden="true" />
                      </JdhButton>
                      <JdhButton
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setRenameOpen(false)}
                        aria-label="Cancelar"
                      >
                        <X aria-hidden="true" />
                      </JdhButton>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 id="lista-activa" className="truncate text-xl font-semibold tracking-tight">
                        {active.name}
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setRenameValue(active.name)
                          setRenameOpen(true)
                        }}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Renombrar ${active.name}`}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {items.data?.meta.total ?? active.itemCount} productos guardados en este borrador.
                  </p>
                </div>
                {deleteArmed ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">¿Eliminar esta lista?</span>
                    <JdhButton
                      variant="destructive"
                      size="sm"
                      loading={eliminar.isPending}
                      onClick={() => void submitDelete()}
                    >
                      Confirmar
                    </JdhButton>
                    <JdhButton variant="ghost" size="sm" onClick={() => setDeleteArmed(false)}>
                      Cancelar
                    </JdhButton>
                  </div>
                ) : (
                  <JdhButton variant="ghost" size="sm" onClick={() => setDeleteArmed(true)}>
                    <Trash2 aria-hidden="true" />
                    Eliminar
                  </JdhButton>
                )}
              </header>

              <ProductPicker
                items={items.data?.data ?? []}
                onAdded={(productoId) =>
                  setQuantity.mutateAsync({ listaId: active.id, productoId, quantity: 1 })
                }
                adding={setQuantity.isPending || items.isPending || items.isError}
              />

              <ListItems
                items={items.data?.data.slice((visiblePage - 1) * ITEMS_LIMIT, visiblePage * ITEMS_LIMIT) ?? []}
                pending={items.isPending}
                error={items.isError}
                quantityDrafts={quantityDrafts}
                onQuantityChange={(productId, value) =>
                  setQuantityDrafts((previous) => ({ ...previous, [productId]: value }))
                }
                onQuantityCommit={saveQuantity}
                onRemove={(productId) =>
                  removeItem.mutate({ listaId: active.id, productoId: productId })
                }
                removing={removeItem.isPending}
                saving={setQuantity.isPending}
                onRetry={() => items.refetch()}
                page={visiblePage}
                totalPages={totalPages}
                onPageChange={setItemPage}
              />

              {renderError(renombrar.error ?? eliminar.error ?? setQuantity.error ?? removeItem.error)}
            </section>
          ) : null}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={submitCreate}>
            <DialogHeader>
              <DialogTitle>Nueva lista de pedido</DialogTitle>
              <DialogDescription>
                Dale un nombre fácil de reconocer. Puedes crear hasta {MAX_LISTAS} listas.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <label htmlFor="nombre-nueva-lista" className="mb-1.5 block text-sm font-medium">
                Nombre
              </label>
              <Input
                id="nombre-nueva-lista"
                autoFocus
                value={newName}
                maxLength={100}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Ej. Pedido de cafetería"
              />
              {crear.error ? <p className="mt-2 text-sm text-destructive">{mensajeError(crear.error)}</p> : null}
            </div>
            <DialogFooter>
              <JdhButton type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancelar
              </JdhButton>
              <JdhButton type="submit" loading={crear.isPending} disabled={!newName.trim()}>
                Crear lista
              </JdhButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProductPicker({
  items,
  onAdded,
  adding,
}: {
  items: ListaPedidoItem[]
  onAdded: (productId: string) => Promise<unknown>
  adding: boolean
}) {
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 220)
    return () => clearTimeout(timer)
  }, [search])
  const productos = useBusquedaProductos(debouncedSearch, { pagina: page, limite: SEARCH_LIMIT, habilitada: Boolean(search.trim()) })

  async function addProduct(productId: string) {
    try {
      await onAdded(productId)
      setSearch("")
      setDebouncedSearch("")
      setPage(1)
      inputRef.current?.focus()
    } catch {
      // Conservar la búsqueda para reintentar; el editor muestra el error.
    }
  }
  const included = React.useMemo(
    () => new Set(items.map((item) => item.productId)),
    [items]
  )

  return (
    <div className="rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Search className="size-4 text-muted-foreground" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-semibold">Agregar productos</h3>
          <p className="text-xs text-muted-foreground">
            Escribe el nombre o el SKU exacto del producto.
          </p>
        </div>
      </div>
      <div>
        <label className="relative block">
          <span className="sr-only">Buscar productos</span>
          <Input
            ref={inputRef}
            value={search}
            maxLength={200}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Nombre o SKU exacto"
            className="h-10 pr-9"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </label>
      </div>

      {!search.trim() ? (
        <p className="mt-5 rounded-lg bg-[var(--color-surface-subtle)] px-4 py-5 text-center text-sm text-muted-foreground">
          Escribe un nombre o SKU para buscar.
        </p>
      ) : productos.isError ? (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-lg bg-[var(--color-surface-subtle)] px-4 py-4 text-sm">
          <span>No pudimos consultar productos.</span>
          <JdhButton variant="ghost" size="sm" onClick={() => productos.refetch()}>
            <RotateCcw aria-hidden="true" />
            Reintentar
          </JdhButton>
        </div>
      ) : productos.isPending ? (
        <div className="mt-5 flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground" aria-live="polite">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Buscando productos…
        </div>
      ) : productos.data?.data.length === 0 ? (
        <p className="mt-5 rounded-lg bg-[var(--color-surface-subtle)] px-4 py-5 text-center text-sm text-muted-foreground">
          No encontramos productos con esos criterios.
        </p>
      ) : (
        <>
          <div className="mt-5 divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
            {productos.data?.data.map((producto) => {
              const estaIncluido = included.has(producto.id)
              return (
                <div key={producto.id} className="flex items-center gap-3 p-3">
                  <ProductoImagen
                    producto={producto}
                    variant="miniatura"
                    sizes="48px"
                    className="size-12 shrink-0 rounded-md border border-[var(--color-border)]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{producto.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      SKU {producto.sku} · {formatNombreComercial(producto.proveedor.nombre)}
                    </p>
                  </div>
                  <JdhButton
                    variant={estaIncluido ? "ghost" : "secondary"}
                    size="sm"
                    disabled={estaIncluido || adding || productos.isPlaceholderData || search !== debouncedSearch}
                    onClick={() => void addProduct(producto.id)}
                  >
                    {estaIncluido ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
                    <span className="hidden sm:inline">{estaIncluido ? "En la lista" : "Agregar"}</span>
                  </JdhButton>
                </div>
              )
            })}
          </div>
          {productos.data && productos.data.meta.totalPages > 1 ? (
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Página {productos.data.meta.page} de {productos.data.meta.totalPages}
              </span>
              <div className="flex gap-1">
                <JdhButton variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                  Anterior
                </JdhButton>
                <JdhButton variant="ghost" size="sm" disabled={page >= productos.data.meta.totalPages} onClick={() => setPage((value) => value + 1)}>
                  Siguiente
                </JdhButton>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

function ListItems({
  items,
  pending,
  error,
  quantityDrafts,
  onQuantityChange,
  onQuantityCommit,
  onRemove,
  removing,
  saving,
  onRetry,
  page,
  totalPages,
  onPageChange,
}: {
  items: ListaPedidoItem[]
  pending: boolean
  error: boolean
  quantityDrafts: Record<string, string>
  onQuantityChange: (productId: string, value: string) => void
  onQuantityCommit: (item: ListaPedidoItem) => void
  onRemove: (productId: string) => void
  removing: boolean
  saving: boolean
  onRetry: () => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (pending) {
    return <div className="h-40 animate-pulse rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)]" aria-label="Cargando productos" />
  }
  if (error) {
    return (
      <div className="rounded-[var(--jdh-radius-md)] border border-dashed border-[var(--color-border)] px-6 py-10 text-center">
        <p className="text-sm font-medium">No pudimos cargar los productos de esta lista.</p>
        <JdhButton variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          <RotateCcw aria-hidden="true" />
          Reintentar
        </JdhButton>
      </div>
    )
  }
  if (items.length === 0) {
    return (
      <div className="rounded-[var(--jdh-radius-md)] border border-dashed border-[var(--color-border)] px-6 py-12 text-center">
        <ClipboardList className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium">Esta lista está vacía</p>
        <p className="mt-1 text-sm text-muted-foreground">Busca un producto arriba para agregarlo al borrador.</p>
      </div>
    )
  }
  return (
    <div>
      <div className="overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="hidden grid-cols-[minmax(0,1fr)_7rem_7rem] gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:grid">
          <span>Producto</span>
          <span>Cantidad</span>
          <span className="text-right">Acciones</span>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {items.map((item) => (
            <div key={item.productId} className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_7rem_7rem] sm:items-center sm:gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <ProductoImagen
                  producto={item.product}
                  variant="miniatura"
                  sizes="52px"
                  className="size-13 shrink-0 rounded-md border border-[var(--color-border)]"
                />
                <div className="min-w-0">
                  <Link href={`/productos/${encodeURIComponent(item.product.id)}`} className="block truncate text-sm font-medium hover:underline">
                    {item.product.nombre}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">SKU {item.product.sku} · {formatNombreComercial(item.product.proveedor.nombre)}</p>
                  {!item.productActive ? <p className="mt-1 text-xs font-medium text-destructive">Producto no disponible</p> : null}
                </div>
              </div>
              <label className="flex items-center gap-2 sm:block">
                <span className="text-xs text-muted-foreground sm:sr-only">Cantidad</span>
                <Input
                  type="number"
                  disabled={saving || removing}
                  min={1}
                  max={2147483647}
                  step={1}
                  inputMode="numeric"
                  value={quantityDrafts[item.productId] ?? item.quantity}
                  onChange={(event) => onQuantityChange(item.productId, event.target.value)}
                  onBlur={() => onQuantityCommit(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      onQuantityCommit(item)
                    }
                  }}
                  aria-label={`Cantidad de ${item.product.nombre}`}
                  className="h-9 w-24"
                />
              </label>
              <div className="flex justify-end">
                <JdhButton variant="ghost" size="sm" disabled={removing} onClick={() => onRemove(item.productId)}>
                  <Trash2 aria-hidden="true" />
                  <span>Quitar</span>
                </JdhButton>
              </div>
            </div>
          ))}
        </div>
      </div>
      {totalPages > 1 ? (
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-1">
            <JdhButton variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</JdhButton>
            <JdhButton variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Siguiente</JdhButton>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function EditorSkeleton() {
  return <div className="grid h-96 animate-pulse gap-6 rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)] lg:grid-cols-[15rem_1fr]" aria-label="Cargando listas" />
}

function mensajeError(error: unknown) {
  if (error instanceof ListasApiError && error.code === "ORDER_LIST_LIMIT_REACHED") {
    return "Ya tienes diez listas. Elimina una para crear otra."
  }
  return error instanceof Error ? error.message : "No pudimos guardar el cambio."
}

function renderError(error: unknown) {
  return error ? <p className="text-sm text-destructive">{mensajeError(error)}</p> : null
}
