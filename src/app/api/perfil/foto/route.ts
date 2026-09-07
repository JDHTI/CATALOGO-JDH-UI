import { headers } from "next/headers"
import { unstable_rethrow } from "next/navigation"

import { FOTO_PERFIL_PROVIDER, FOTO_PERFIL_SIZE } from "@/lib/auth/foto-perfil"
import { auth } from "@/lib/auth/server"
import { hasSessionCookie } from "@/lib/auth/session-cookie"

/**
 * Foto de perfil del usuario CON SESIÓN, tomada de Microsoft Graph.
 *
 * Es el destino de `user.image` para el personal JDH (ver
 * `src/lib/auth/foto-perfil.ts`, que explica por qué la foto no se guarda como
 * data URL en la fila del usuario). La ruta no recibe ningún identificador:
 * sirve siempre la foto de QUIEN PIDE, resuelta desde su cookie de sesión, así
 * que no hay forma de enumerar fotos ajenas cambiando un parámetro.
 *
 * El access token de Graph sale de `auth.api.getAccessToken`, que lo refresca
 * solo si hace falta —el App Registration concede `offline_access`, así que
 * hay refresh token— y nunca sale de este proceso: al navegador solo llegan
 * los bytes del JPEG.
 *
 * Cualquier tropiezo (sin sesión de Entra, sin foto en el directorio, Graph
 * caído) responde 404 en vez de un error: `InitialsAvatar` ya dibuja las
 * iniciales cuando la imagen no carga, y ese respaldo es la respuesta correcta
 * para las tres situaciones.
 */

/** Un día en el navegador; una semana sirviendo la copia vieja mientras revalida. */
const CACHE_CONTROL = "private, max-age=86400, stale-while-revalidate=604800"

function sinFoto(): Response {
  return new Response(null, {
    status: 404,
    // También se cachea el "no hay foto": sin esto, cada navegación de un
    // usuario sin foto en el directorio vuelve a preguntarle a Graph.
    headers: { "Cache-Control": "private, max-age=3600" },
  })
}

export async function GET(request: Request): Promise<Response> {
  const headerList = await headers()
  if (!hasSessionCookie(headerList.get("cookie"))) {
    return new Response(null, { status: 401 })
  }

  let accessToken: string | undefined
  try {
    const session = await auth.api.getSession({ headers: headerList })
    if (!session) return new Response(null, { status: 401 })

    const token = await auth.api.getAccessToken({
      headers: headerList,
      body: { providerId: FOTO_PERFIL_PROVIDER },
    })
    accessToken = token?.accessToken
  } catch (error) {
    unstable_rethrow(error)
    // Una cuenta de cliente (email + contraseña) no tiene cuenta de Microsoft
    // vinculada y `getAccessToken` lanza. Es el camino esperado, no un fallo.
    return sinFoto()
  }

  if (!accessToken) return sinFoto()

  let respuesta: Response
  try {
    respuesta = await fetch(
      `https://graph.microsoft.com/v1.0/me/photos/${FOTO_PERFIL_SIZE}x${FOTO_PERFIL_SIZE}/$value`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        // Es una respuesta por usuario: nunca debe entrar al caché compartido
        // de `fetch` del servidor.
        cache: "no-store",
      }
    )
  } catch (error) {
    console.error("[perfil] No se pudo consultar la foto en Graph:", error)
    return sinFoto()
  }

  // 404 cuando el usuario no tiene foto cargada en el directorio; 403 cuando
  // la política del tenant no la expone. Ambos son "no hay foto".
  if (!respuesta.ok) return sinFoto()

  const etag = respuesta.headers.get("etag")
  if (etag && request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": CACHE_CONTROL },
    })
  }

  const cuerpo = await respuesta.arrayBuffer()
  const cabeceras = new Headers({
    "Content-Type": respuesta.headers.get("content-type") ?? "image/jpeg",
    "Cache-Control": CACHE_CONTROL,
    // La foto de una persona no debería salir del origen en un referrer.
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  })
  if (etag) cabeceras.set("ETag", etag)

  return new Response(cuerpo, { status: 200, headers: cabeceras })
}
