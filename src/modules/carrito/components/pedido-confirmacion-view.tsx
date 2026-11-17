"use client"

import Link from "next/link"
import { CircleCheck, Mail, MailWarning, RotateCcw } from "lucide-react"

import { EmptyState } from "@/components/common/empty-state"
import { JdhButton } from "@/components/common/jdh-button"
import { formatCentavos } from "@/lib/format"

import { CarritoApiError } from "../api/client"
import { usePedido } from "../hooks/use-carrito"
import type { EstadoCorreo } from "../types"
import { TotalesPedido } from "./totales-pedido"

const fechaHora = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Bogota",
})

/**
 * Mensaje del correo. Si NO salió (`error`, `deshabilitado`, `pendiente`), el
 * pedido igual quedó registrado: se dice así y NO se pide repetirlo — un
 * segundo envío sería un pedido duplicado.
 */
function textoCorreo(correo: EstadoCorreo, email: string): string {
  return correo === "enviado"
    ? `Enviamos el consolidado a ${email}.`
    : "Tu pedido quedó registrado. El correo con el consolidado se reenviará; no necesitas repetir el pedido."
}

/** Confirmación con el número de pedido, fecha, totales y estado del correo. */
export function PedidoConfirmacionView({ id }: { id: string }) {
  const pedido = usePedido(id)

  if (pedido.isError) {
    const noExiste =
      pedido.error instanceof CarritoApiError && pedido.error.statusCode === 404
    return (
      <EmptyState
        title={
          noExiste ? "Pedido no encontrado" : "No pudimos cargar el pedido"
        }
        description={
          noExiste
            ? "Revisa el enlace o vuelve al catálogo."
            : "Verifica tu conexión e inténtalo de nuevo."
        }
      >
        {noExiste ? (
          <JdhButton asChild size="sm">
            <Link href="/productos">Volver al catálogo</Link>
          </JdhButton>
        ) : (
          <JdhButton
            variant="secondary"
            size="sm"
            onClick={() => pedido.refetch()}
          >
            <RotateCcw aria-hidden="true" />
            Reintentar
          </JdhButton>
        )}
      </EmptyState>
    )
  }

  if (pedido.isPending) {
    return (
      <div
        role="status"
        aria-label="Cargando pedido"
        className="mx-auto h-96 w-full max-w-2xl animate-pulse rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)]"
      />
    )
  }

  const p = pedido.data
  const CorreoIcono = p.correo === "enviado" ? Mail : MailWarning
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <CircleCheck className="size-10" strokeWidth={1.5} aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Pedido registrado</p>
        <h1 className="text-3xl font-bold tracking-tight tabular-nums">
          {p.numero}
        </h1>
        <p className="text-sm text-muted-foreground">
          {fechaHora.format(new Date(p.fecha))} · {p.solicitante.nombre}
        </p>
      </header>

      <p
        role="status"
        className="flex items-start gap-2 rounded-lg border border-[var(--color-border-strong)] p-4 text-sm"
      >
        <CorreoIcono className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {textoCorreo(p.correo, p.solicitante.email)}
      </p>

      <section
        aria-labelledby="detalle-pedido"
        className="rounded-[var(--jdh-radius-md)] border border-[var(--color-border)]"
      >
        <h2
          id="detalle-pedido"
          className="border-b border-[var(--color-border)] px-4 py-3 text-base font-semibold"
        >
          Productos ({p.lineas.length})
        </h2>
        <ul className="divide-y divide-[var(--color-border)]">
          {p.lineas.map((linea) => (
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
              <p className="shrink-0 tabular-nums">
                {formatCentavos(linea.totalLinea)}
              </p>
            </li>
          ))}
        </ul>
        <div className="border-t border-[var(--color-border)] p-4">
          <TotalesPedido
            subtotal={p.subtotal}
            impuestos={p.impuestos}
            total={p.total}
          />
          {p.ivaPorConfirmar ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Algunos productos tienen el IVA por confirmar; su impuesto no está
              incluido en el total.
            </p>
          ) : null}
        </div>
      </section>

      {p.nota ? (
        <section aria-labelledby="nota-pedido" className="text-sm">
          <h2 id="nota-pedido" className="font-semibold">
            Nota
          </h2>
          <p className="mt-1 whitespace-pre-line text-muted-foreground">
            {p.nota}
          </p>
        </section>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        La entrega se coordina en la oficina.
      </p>
      <JdhButton asChild variant="secondary" className="self-center">
        <Link href="/productos">Seguir comprando</Link>
      </JdhButton>
    </div>
  )
}
