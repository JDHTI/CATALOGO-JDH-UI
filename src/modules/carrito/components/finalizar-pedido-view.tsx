"use client"

import * as React from "react"
import Link from "next/link"
import type { Route } from "next"
import { useRouter } from "next/navigation"
import { ArrowLeft, RotateCcw, Send, ShoppingCart } from "lucide-react"

import { EmptyState } from "@/components/common/empty-state"
import { JdhButton } from "@/components/common/jdh-button"
import { PageHeader } from "@/components/common/page-header"
import { formatCentavos, formatFechaCorta } from "@/lib/format"
import { getQueryClient } from "@/lib/query-client"

import { CarritoApiError } from "../api/client"
import {
  carritoKeys,
  useEnviarPedido,
  useResumenFinalizar,
} from "../hooks/use-carrito"
import { NOTA_MAXIMA } from "../limites"
import type { ResumenFinalizar } from "../types"
import { TotalesPedido } from "./totales-pedido"

/** Qué hacer con un error del envío (`docs/carrito-pedidos.md`). */
type Aviso =
  | { tipo: "precios" }
  | { tipo: "volver-al-carrito"; mensaje: string }
  | { tipo: "sesion" }
  | { tipo: "error"; mensaje: string }

/**
 * 409 «Los precios cambiaron». Por el `code` estable del API; el `resumen`
 * adjunto y el texto quedan como respaldo para un API anterior al `code`
 * (cuyo filtro de excepciones además descartaba el resumen).
 */
function esCambioDePrecios(error: CarritoApiError): boolean {
  if (error.statusCode !== 409) return false
  if (error.code) return error.code === "PRECIOS_CAMBIARON"
  return error.resumen !== undefined || /precios cambiaron/i.test(error.message)
}

/** Texto propio para los 409 que devuelven al carrito; el del API si no. */
function mensajeVolverAlCarrito(error: CarritoApiError): string {
  switch (error.code) {
    case "NO_DISPONIBLES":
      return "Hay productos que ya no están disponibles. Quítalos del carrito para continuar."
    case "CARRITO_VACIO":
      return "Tu carrito está vacío; puede que el pedido ya se haya enviado."
    default:
      return error.message
  }
}

function avisoDe(error: unknown): Aviso {
  if (error instanceof CarritoApiError) {
    if (esCambioDePrecios(error)) return { tipo: "precios" }
    if (error.statusCode === 409) {
      return {
        tipo: "volver-al-carrito",
        mensaje: mensajeVolverAlCarrito(error),
      }
    }
    if (error.statusCode === 422 || error.statusCode === 401) {
      return { tipo: "sesion" }
    }
  }
  return {
    tipo: "error",
    mensaje:
      "No pudimos enviar el pedido. Revisa tu conexión e inténtalo de nuevo.",
  }
}

/**
 * Finalizar pedido. Aquí SÍ aparecen subtotal, impuestos y total, pero sin
 * decir qué productos van al 19, al 5 o al 0 %: el API entrega un solo valor
 * de impuestos. El solicitante es el de Entra, de solo lectura.
 *
 * El total mostrado viaja como `totalEsperado`: si la lista cambió desde que
 * se cargó la pantalla, el API responde 409 con el resumen nuevo, que se pinta
 * para que el empleado confirme otra vez el total correcto.
 */
export function FinalizarPedidoView() {
  const router = useRouter()
  const resumen = useResumenFinalizar()
  const enviar = useEnviarPedido()
  const [nota, setNota] = React.useState("")
  const [aviso, setAviso] = React.useState<Aviso | null>(null)
  const [redirigiendo, setRedirigiendo] = React.useState(false)

  if (redirigiendo) {
    return (
      <p
        role="status"
        className="py-16 text-center text-sm text-muted-foreground"
      >
        Pedido enviado. Abriendo la confirmación…
      </p>
    )
  }

  const data = resumen.data

  const enviarPedido = (actual: ResumenFinalizar) => {
    setAviso(null)
    enviar.mutate(
      { totalEsperado: actual.total, nota },
      {
        onSuccess: (pedido) => {
          setRedirigiendo(true)
          router.push(`/pedidos/${encodeURIComponent(pedido.id)}` as Route)
        },
        onError: async (error) => {
          if (error instanceof CarritoApiError && esCambioDePrecios(error)) {
            // Se reemplaza lo mostrado por el resumen vigente: el siguiente
            // clic enviará ESE total como `totalEsperado`. Si el 409 no lo
            // trae, se pide de nuevo antes de avisar.
            if (error.resumen) {
              getQueryClient().setQueryData(
                carritoKeys.finalizar,
                error.resumen
              )
            } else {
              await resumen.refetch()
            }
          }
          setAviso(avisoDe(error))
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/carrito"
        className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver al carrito
      </Link>
      <PageHeader
        title="Finalizar pedido"
        description="Revisa tu pedido antes de enviarlo. La entrega se coordina en la oficina."
      />

      {resumen.isError ? (
        <ErrorResumen error={resumen.error} onRetry={() => resumen.refetch()} />
      ) : resumen.isPending ? (
        <div
          role="status"
          aria-label="Cargando pedido"
          className="h-80 animate-pulse rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)]"
        />
      ) : data!.lineas.length === 0 || data!.noDisponibles.length > 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={
            data!.lineas.length === 0
              ? "No hay productos para enviar"
              : "Hay productos que ya no están disponibles"
          }
          description={
            data!.lineas.length === 0
              ? "Tu carrito está vacío."
              : "Quítalos del carrito para poder enviar el pedido."
          }
        >
          <JdhButton asChild size="sm">
            <Link href="/carrito">Volver al carrito</Link>
          </JdhButton>
        </EmptyState>
      ) : (
        <form
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
          onSubmit={(event) => {
            event.preventDefault()
            if (!enviar.isPending) enviarPedido(data!)
          }}
        >
          <div className="flex flex-col gap-6">
            <section
              aria-labelledby="solicitante"
              className="rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] p-5"
            >
              <h2 id="solicitante" className="text-base font-semibold">
                Solicitante
              </h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Nombre</dt>
                  <dd className="font-medium">{data!.solicitante.nombre}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">Correo</dt>
                  <dd className="font-medium break-words">
                    {data!.solicitante.email}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                Datos de tu cuenta JDH. El consolidado del pedido llega a este
                correo.
              </p>
            </section>

            <section aria-labelledby="lineas-pedido">
              <h2 id="lineas-pedido" className="mb-3 text-base font-semibold">
                Productos ({data!.lineas.length})
              </h2>
              <ul className="divide-y divide-[var(--color-border)] rounded-[var(--jdh-radius-md)] border border-[var(--color-border)]">
                {data!.lineas.map((linea) => (
                  <li
                    key={linea.productoId}
                    className="flex items-start justify-between gap-4 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{linea.nombre}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        SKU {linea.sku} · {linea.cantidad} ×{" "}
                        {formatCentavos(linea.precioUnitario)}
                      </p>
                    </div>
                    <p className="shrink-0 font-medium tabular-nums">
                      {formatCentavos(linea.totalLinea)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="nota-pedido" className="text-sm font-medium">
                Nota para quien despacha{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </label>
              <textarea
                id="nota-pedido"
                value={nota}
                maxLength={NOTA_MAXIMA}
                rows={3}
                onChange={(event) => setNota(event.target.value)}
                aria-describedby="nota-contador"
                className="rounded-lg border border-[var(--color-border-strong)] bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
              <p
                id="nota-contador"
                className="self-end text-xs text-muted-foreground tabular-nums"
              >
                {nota.length}/{NOTA_MAXIMA}
              </p>
            </div>
          </div>

          <aside className="flex flex-col gap-4 rounded-[var(--jdh-radius-md)] border border-[var(--color-border-strong)] p-5 lg:sticky lg:top-[calc(var(--catalogo-chrome-height)+1rem)]">
            <h2 className="text-base font-semibold">Total del pedido</h2>
            <TotalesPedido
              subtotal={data!.subtotal}
              impuestos={data!.impuestos}
              total={data!.total}
            />
            {data!.ivaPorConfirmar ? (
              <p className="text-xs text-muted-foreground">
                Algunos productos tienen el IVA por confirmar; su impuesto no
                está incluido en el total.
              </p>
            ) : null}
            {data!.fechaFoto ? (
              <p className="text-xs text-muted-foreground">
                Precios de empleados JDH · costos del{" "}
                {formatFechaCorta(data!.fechaFoto)}
              </p>
            ) : null}

            {aviso ? <AvisoEnvio aviso={aviso} /> : null}

            <JdhButton type="submit" loading={enviar.isPending}>
              {enviar.isPending ? null : <Send aria-hidden="true" />}
              {aviso?.tipo === "precios"
                ? "Confirmar y enviar"
                : "Enviar pedido"}
            </JdhButton>
            <p className="text-xs text-muted-foreground">
              Sin pago en línea: el pedido se registra y la entrega se gestiona
              en la oficina.
            </p>
          </aside>
        </form>
      )}
    </div>
  )
}

function AvisoEnvio({ aviso }: { aviso: Aviso }) {
  return (
    <div
      role="alert"
      className="rounded-lg border-2 border-foreground p-3 text-sm"
    >
      {aviso.tipo === "precios" ? (
        <p>
          <strong>Los precios cambiaron.</strong> Revisa el total actualizado y
          confirma de nuevo.
        </p>
      ) : aviso.tipo === "volver-al-carrito" ? (
        <p>
          {aviso.mensaje}{" "}
          <Link href="/carrito" className="font-medium underline">
            Volver al carrito
          </Link>
        </p>
      ) : aviso.tipo === "sesion" ? (
        <p>
          Tu sesión no trae tu nombre y correo.{" "}
          <Link href="/ingreso" className="font-medium underline">
            Vuelve a iniciar sesión
          </Link>{" "}
          para enviar el pedido.
        </p>
      ) : (
        <p>{aviso.mensaje}</p>
      )}
    </div>
  )
}

function ErrorResumen({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  const sesion =
    error instanceof CarritoApiError &&
    (error.statusCode === 401 || error.statusCode === 422)
  return (
    <EmptyState
      icon={ShoppingCart}
      title={
        sesion ? "Vuelve a iniciar sesión" : "No pudimos preparar tu pedido"
      }
      description={
        sesion
          ? "Tu sesión no trae tu nombre y correo, que son necesarios para el pedido."
          : "Verifica tu conexión e inténtalo de nuevo. Tu carrito no se ha modificado."
      }
    >
      {sesion ? (
        <JdhButton asChild size="sm">
          <Link href="/ingreso">Iniciar sesión</Link>
        </JdhButton>
      ) : (
        <JdhButton variant="secondary" size="sm" onClick={onRetry}>
          <RotateCcw aria-hidden="true" />
          Reintentar
        </JdhButton>
      )}
    </EmptyState>
  )
}
