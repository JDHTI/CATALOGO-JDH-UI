"use client"

import { useState, type CSSProperties } from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

import type { Producto } from "../types"
import { ProductoImagen } from "./producto-imagen"

/**
 * Galería de la ficha de producto: recuadro grande + tira de miniaturas.
 *
 * El API devuelve hasta 4 imágenes por producto (`imagenes`, primaria
 * primero). El recuadro grande pide `fullUrl` a través de `ProductoImagen`,
 * que es también quien pinta el placeholder cuando el producto no tiene
 * fotos — el caso del 99,9% del catálogo hoy, así que no se duplica aquí.
 *
 * La tira solo aparece con MÁS de una imagen utilizable: con una sola no hay
 * nada que elegir y una fila de una miniatura debajo de la foto parece un
 * error de maquetación.
 *
 * Accesibilidad: las miniaturas son botones con `aria-pressed`, no un
 * `tablist`. Un tablist obliga a navegación por flechas con roving tabindex;
 * un grupo de botones se recorre con Tab, que es lo que un usuario espera de
 * cuatro controles seguidos. La `<img>` de cada botón va con `alt=""` porque
 * el botón ya lleva su propia etiqueta: sin eso, un lector de pantalla
 * anuncia el nombre del producto cuatro veces.
 *
 * El componente guarda cuál imagen está activa, así que el caller debe
 * montarlo con `key={producto.id}` — al navegar entre productos React
 * reutilizaría la instancia y la selección quedaría apuntando a la anterior.
 */
export function ProductoGaleria({ producto }: { producto: Producto }) {
  const [activaUrl, setActivaUrl] = useState<string | null>(null)
  const [rotas, setRotas] = useState<ReadonlySet<string>>(() => new Set())

  /**
   * Una fila de `imagenes` es una promesa de Postgres, no una garantía de que
   * el objeto exista en el bucket: hoy hay galerías cuyas secundarias
   * responden 404 en R2 (auditado 2026-09-08 — 59 de 87 secundarias, todas
   * las primarias sanas). Sin esto la tira pinta recuadros vacíos y clicables
   * que cambian la foto grande por nada. Descartarlas degrada la ficha justo
   * a lo que era antes de la galería, que es el peor caso aceptable.
   *
   * Se filtra por `thumbUrl` porque las tres variantes de una imagen se
   * suben juntas: si falta la miniatura, falta la `full` del recuadro grande.
   */
  const disponibles = producto.imagenes.filter(
    (imagen) => !rotas.has(imagen.thumbUrl)
  )
  const seleccionada =
    disponibles.find((imagen) => imagen.thumbUrl === activaUrl) ??
    disponibles[0] ??
    null

  return (
    <div
      className="lg:[container-type:size] lg:h-full lg:min-h-0"
      style={
        {
          "--gallery-controls-height":
            disponibles.length > 1 ? "5.5rem" : "0px",
        } as CSSProperties
      }
    >
      {/* El grupo completo se alinea arriba. Se reserva solo el alto de las
          miniaturas, de modo que queden a 8px del marco, no al pie de la columna. */}
      <div className="flex w-full flex-col gap-2 lg:w-[min(100cqw,calc(100cqh-var(--gallery-controls-height)))]">
        <ProductoImagen
          producto={producto}
          imagen={seleccionada}
          variant="detalle"
          sizes="(min-width: 1024px) 45vw, 100vw"
          priority
          className="aspect-square w-full rounded-[var(--jdh-radius-md)] border border-[var(--color-border)]"
        />

        {disponibles.length > 1 ? (
          <div
            role="group"
            aria-label={`Imágenes de ${producto.nombre}`}
            className="flex shrink-0 gap-2 overflow-x-auto"
          >
            {disponibles.map((imagen, indice) => {
              const esActiva = imagen === seleccionada

              return (
                <button
                  key={imagen.thumbUrl}
                  type="button"
                  onClick={() => setActivaUrl(imagen.thumbUrl)}
                  aria-pressed={esActiva}
                  className={cn(
                    // Borde + opacidad: dos canales para el estado activo, no
                    // solo el tono (DESIGN.md — nunca color por sí solo).
                    "relative size-20 shrink-0 overflow-hidden rounded-[var(--jdh-radius-sm)] border bg-[var(--color-surface-subtle)] transition-[opacity,border-color] duration-150",
                    esActiva
                      ? "border-[var(--color-text)] opacity-100"
                      : "border-[var(--color-border)] opacity-60 hover:border-[var(--color-border-strong)] hover:opacity-100"
                  )}
                >
                  <Image
                    src={imagen.thumbUrl}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                    onError={() =>
                      setRotas((previas) =>
                        new Set(previas).add(imagen.thumbUrl)
                      )
                    }
                  />
                  <span className="sr-only">
                    Ver imagen {indice + 1} de {disponibles.length}
                  </span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
