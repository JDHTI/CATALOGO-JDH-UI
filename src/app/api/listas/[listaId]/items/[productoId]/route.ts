import type { NextRequest } from "next/server"

import { haciaElApi } from "@/app/api/listas/_backend"

type Contexto = {
  params: Promise<{ listaId: string; productoId: string }>
}

function ruta(listaId: string, productoId: string) {
  return `/order-lists/${encodeURIComponent(listaId)}/items/${encodeURIComponent(productoId)}` as const
}

export async function PUT(request: NextRequest, { params }: Contexto) {
  const { listaId, productoId } = await params
  return haciaElApi(ruta(listaId, productoId), {
    method: "PUT",
    body: await request.text(),
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    },
  })
}

export async function DELETE(_request: NextRequest, { params }: Contexto) {
  const { listaId, productoId } = await params
  return haciaElApi(ruta(listaId, productoId), { method: "DELETE" })
}
