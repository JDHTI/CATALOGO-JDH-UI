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

/**
 * Destino por defecto al ingresar: la portada del catálogo.
 *
 * Vale para las dos audiencias con sesión, incluido el personal JDH, que antes
 * caía directo en `/admin`. El catálogo es el producto; la administración es
 * una herramienta a la que se entra a propósito, y ahora se llega por el menú
 * de perfil (`UserMenu`). Además es donde vive la bienvenida.
 */
export const DESTINO_TRAS_INGRESO = "/"

/** Search param que dispara la cortina de bienvenida. Ver `WelcomeCurtain`. */
export const BIENVENIDA_PARAM = "bienvenida"

/**
 * Marca un destino para que, al aterrizar, se anime la cortina de bienvenida.
 *
 * El aviso viaja en la URL y no en `sessionStorage` porque el ingreso con
 * Entra sale del navegador y vuelve por una redirección de Microsoft: lo que
 * el formulario hubiera guardado antes de irse no distingue "acabo de entrar"
 * de "volví a esta pestaña". La URL sí sobrevive al viaje completo, y es lo
 * único que Better Auth propaga a través de `callbackURL`.
 *
 * `WelcomeCurtain` retira el parámetro con `router.replace` en cuanto la
 * animación arranca, así que no queda en el historial ni se re-dispara al
 * recargar.
 */
export function conBienvenida(destino: string): string {
  const [ruta, hash] = destino.split("#")
  const separador = ruta.includes("?") ? "&" : "?"
  return `${ruta}${separador}${BIENVENIDA_PARAM}=1${hash ? `#${hash}` : ""}`
}
