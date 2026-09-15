import "server-only"

import { NextResponse } from "next/server"
import { haciaElApi as proxy } from "@/app/api/favoritos/_backend"

export async function haciaElApi(path: `/${string}`, init?: RequestInit) {
  const response = process.env.BACKEND_API_URL
    ? await proxy(path, init)
    : NextResponse.json({ message: "Las listas no están configuradas en este entorno" }, { status: 501 })
  response.headers.set("Cache-Control", "private, no-store")
  return response
}
