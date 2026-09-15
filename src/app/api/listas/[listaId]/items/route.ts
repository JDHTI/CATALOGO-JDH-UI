import type { NextRequest } from "next/server"

import { haciaElApi } from "@/app/api/listas/_backend"

type Contexto = { params: Promise<{ listaId: string }> }

export async function GET(request: NextRequest, { params }: Contexto) {
  const { listaId } = await params
  const query = new URLSearchParams()
  for (const key of ["page", "limit"]) {
    const value = request.nextUrl.searchParams.get(key)
    if (value) query.set(key, value)
  }
  const suffix = query.toString() ? `?${query}` : ""
  return haciaElApi(
    `/order-lists/${encodeURIComponent(listaId)}/items${suffix}`
  )
}
