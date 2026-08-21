import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium tracking-[0.08em] text-muted-foreground uppercase">
        Error 404
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-balance">
        Página no encontrada
      </h1>
      <p className="max-w-md text-muted-foreground">
        La página que buscas no existe o fue movida.
      </p>
      <Button asChild className="mt-2">
        <Link href="/productos">Ver catálogo</Link>
      </Button>
    </div>
  )
}
