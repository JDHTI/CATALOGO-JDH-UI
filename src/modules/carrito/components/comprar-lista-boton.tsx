"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart } from "lucide-react"
import { toast } from "sonner"

import { JdhButton } from "@/components/common/jdh-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  useCarrito,
  useComprarLista,
  useEsEmpleado,
} from "../hooks/use-carrito"
import type { MotivoOmitido, ResultadoCompraLista } from "../types"
import { mensajeErrorCarrito } from "./agregar-al-carrito"

const MOTIVOS: Record<MotivoOmitido, string> = {
  sin_precio: "sin precio de empleado",
  inactivo: "ya no está disponible",
  limite: "el carrito llegó a su límite de productos",
}

/** «3 productos no se agregaron: sin precio de empleado». */
export function resumenOmitidos(omitidos: ResultadoCompraLista["omitidos"]) {
  const porMotivo = new Map<MotivoOmitido, number>()
  for (const o of omitidos) {
    porMotivo.set(o.motivo, (porMotivo.get(o.motivo) ?? 0) + 1)
  }
  return [...porMotivo].map(
    ([motivo, n]) =>
      `${n} ${n === 1 ? "producto no se agregó" : "productos no se agregaron"}: ${MOTIVOS[motivo]}`
  )
}

/**
 * «Comprar esta lista»: lleva una lista de pedido completa al carrito. Solo
 * para empleados. Si el carrito ya tiene productos, pregunta si sumar o
 * reemplazar; lo que el API no pudo agregar se informa por motivo.
 */
export function ComprarListaBoton({
  listaId,
  deshabilitado,
}: {
  listaId: string
  deshabilitado?: boolean
}) {
  const router = useRouter()
  const empleado = useEsEmpleado()
  const carrito = useCarrito()
  const comprar = useComprarLista()
  const [preguntando, setPreguntando] = React.useState(false)

  if (!empleado) return null

  const ejecutar = (modo: "sumar" | "reemplazar") =>
    comprar.mutate(
      { listaId, modo },
      {
        onSuccess: (resultado) => {
          setPreguntando(false)
          const avisos = resumenOmitidos(resultado.omitidos)
          const titulo =
            resultado.agregados === 0
              ? "Ningún producto de la lista se agregó"
              : `${resultado.agregados} ${resultado.agregados === 1 ? "producto agregado" : "productos agregados"} al carrito`
          const opciones = {
            description: avisos.join(". ") || undefined,
            action: {
              label: "Ver carrito",
              onClick: () => router.push("/carrito"),
            },
          }
          if (resultado.agregados === 0) toast.error(titulo, opciones)
          else if (avisos.length > 0) toast.warning(titulo, opciones)
          else toast.success(titulo, opciones)
        },
        onError: (error) => toast.error(mensajeErrorCarrito(error)),
      }
    )

  const tieneProductos = (carrito.data?.resumen.lineas ?? 0) > 0

  return (
    <>
      <JdhButton
        size="sm"
        loading={comprar.isPending && !preguntando}
        disabled={deshabilitado || carrito.isPending}
        onClick={() =>
          tieneProductos ? setPreguntando(true) : ejecutar("sumar")
        }
      >
        {comprar.isPending && !preguntando ? null : (
          <ShoppingCart aria-hidden="true" />
        )}
        Comprar esta lista
      </JdhButton>

      <Dialog open={preguntando} onOpenChange={setPreguntando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tu carrito ya tiene productos</DialogTitle>
            <DialogDescription>
              Puedes sumar los productos de esta lista a lo que ya tienes, o
              reemplazar el carrito por la lista.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <JdhButton
              variant="secondary"
              disabled={comprar.isPending}
              onClick={() => ejecutar("reemplazar")}
            >
              Reemplazar el carrito
            </JdhButton>
            <JdhButton
              loading={comprar.isPending}
              onClick={() => ejecutar("sumar")}
            >
              Sumar a lo que hay
            </JdhButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
