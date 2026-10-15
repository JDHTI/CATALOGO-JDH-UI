import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Healthcheck del contenedor y del despliegue: solo confirma que el servidor
 * Next responde. No consulta Postgres ni el API a propósito — una caída de
 * esas dependencias no debe reiniciar la UI (el catálogo ya degrada solo).
 */
export function GET() {
  return NextResponse.json({ status: "ok" })
}
