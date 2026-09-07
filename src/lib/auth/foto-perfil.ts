/**
 * Foto de perfil del personal JDH, tomada de Microsoft Graph.
 *
 * Better Auth sabe traerla solo (`disableProfilePhoto: false`), pero la
 * descarga y la guarda como **data URL en base64** dentro de `user.image`. Ese
 * camino está descartado a propósito: este proyecto tiene `cookieCache`
 * activo, y el caché de sesión serializa la fila CRUDA del usuario —
 * `setCookieCache` usa `parseUserOutput(options, session.user)`, no lo que
 * devuelve el plugin `customSession`, así que no hay forma de filtrar el campo
 * después. Una foto de 120×120 en base64 ronda los 10 KB: la cookie de sesión
 * se parte en varios trozos (`MAX_COOKIE_SIZE` = 4050 B) y esos trozos viajan
 * en CADA petición que atraviesa el matcher de `proxy.ts`.
 *
 * En su lugar `user.image` guarda ESTA ruta —una constante de 18 caracteres,
 * idéntica para todos— y el route handler resuelve los bytes por usuario
 * contra Graph, con caché de navegador. Ver `src/app/api/perfil/foto/route.ts`.
 *
 * Módulo isomórfico (sin `server-only`): la ruta la escribe el servidor al
 * mapear el perfil de Entra, y la leen componentes de cliente.
 */

/** Ruta que sirve la foto del usuario con sesión. Es el valor de `user.image`. */
export const FOTO_PERFIL_PATH = "/api/perfil/foto"

/**
 * Tamaño solicitado a Graph. Solo acepta un conjunto cerrado de valores
 * (48, 64, 96, 120, 240, 360, 432, 504, 648) y devuelve 404 con cualquier
 * otro. 120 cubre en retina el avatar más grande que dibuja la UI hoy
 * (`InitialsAvatar` `xl`, 96 px CSS) sin pedir un original de varios cientos
 * de KB.
 */
export const FOTO_PERFIL_SIZE = 120

/** Proveedor social del que sale la foto. El único con Graph detrás. */
export const FOTO_PERFIL_PROVIDER = "microsoft"
