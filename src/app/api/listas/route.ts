import type { NextRequest } from "next/server"

import { haciaElApi } from "@/app/api/listas/_backend"

/** Private proxy: the browser never receives the short-lived backend JWT. */
export async function GET() {
  return haciaElApi("/order-lists")
}

export async function POST(request: NextRequest) {
  return haciaElApi("/order-lists", {
    method: "POST",
    body: await request.text(),
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    },
  })
}
