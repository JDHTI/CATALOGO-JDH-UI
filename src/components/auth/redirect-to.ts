/**
 * Solo se honran rutas relativas — un `redirectTo` absoluto o externo es un
 * vector de open redirect. `//host` también se descarta: el navegador lo
 * resuelve como protocolo-relativo, es decir, externo.
 */
export function safeRedirectTo(value: string | null, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//"))
    return fallback
  return value
}
