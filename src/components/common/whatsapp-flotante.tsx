import { contactConfig } from "@/config/contact.config"

/**
 * Botón flotante de WhatsApp, abajo a la derecha en todo el catálogo. El
 * enlace sale de `contactConfig.whatsappUrl`: cambiar el número o el mensaje
 * es editar ese único valor.
 *
 * En móvil se levanta por encima de `MobileBottomNav` (misma altura que el
 * `ThemeToggle` flotante, que va a la izquierda); desde `md` baja a la
 * esquina. Va en `--z-sticky` como el resto de flotantes: queda bajo modales
 * y toasts.
 *
 * Usa el logo SÓLIDO de WhatsApp y no el `WhatsappIcon` de trazo del chrome:
 * a este tamaño y en blanco sobre verde, el glifo de trazo se leía como una
 * carita, no como el botón que el usuario espera. El verde de marca es una
 * excepción al monocromo, declarada en `globals.css` junto al token.
 */
export function WhatsappFlotante() {
  return (
    <a
      href={contactConfig.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp (abre en una pestaña nueva)"
      className="fixed right-4 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-[var(--z-sticky)] flex size-14 items-center justify-center rounded-full bg-[var(--color-whatsapp)] text-white shadow-[var(--shadow-lg)] transition-[background-color,transform] duration-[var(--duration-fast)] hover:scale-105 hover:bg-[var(--color-whatsapp-hover)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none md:right-6 md:bottom-6"
    >
      {/* Logo de WhatsApp (Simple Icons, CC0). */}
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-7"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    </a>
  )
}
