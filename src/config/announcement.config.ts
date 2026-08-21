/**
 * Barra de anuncio global. `enabled: false` la oculta. Cambiar `id` la vuelve a
 * mostrar a quienes descartaron un anuncio anterior (el descarte se guarda
 * contra ese id).
 */
export interface AnnouncementConfig {
  /** Súbelo tras editar el mensaje para re-mostrarlo. */
  id: string
  enabled: boolean
  message: string
  href?: `/${string}`
  linkLabel?: string
  variant: "info" | "warning" | "critical"
  dismissible: boolean
}

export const announcementConfig: AnnouncementConfig = {
  id: "2026-08-lanzamiento",
  enabled: false,
  message:
    "Los precios de tu lista se muestran al ingresar con tu cuenta de cliente.",
  href: "/ingreso",
  linkLabel: "Ingresar",
  variant: "info",
  dismissible: true,
}
