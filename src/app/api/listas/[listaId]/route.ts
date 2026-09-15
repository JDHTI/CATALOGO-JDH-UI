import type { NextRequest } from "next/server"

import { haciaElApi } from "@/app/api/listas/_backend"

type Contexto = { params: Promise<{ listaId: string }> }

export async function GET(_request: NextRequest, { params }: Contexto) {
  const { listaId } = await params
  return haciaElApi(`/order-lists/${encodeURIComponent(listaId)}`)
}

export async function PATCH(request: NextRequest, { params }: Contexto) {
  const { listaId } = await params
  return haciaElApi(`/order-lists/${encodeURIComponent(listaId)}`, {
    method: "PATCH",
    body: await request.text(),
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    },
  })
}

export async function DELETE(_request: NextRequest, { params }: Contexto) {
  const { listaId } = await params
  return haciaElApi(`/order-lists/${encodeURIComponent(listaId)}`, {
    method: "DELETE",
  })
}
