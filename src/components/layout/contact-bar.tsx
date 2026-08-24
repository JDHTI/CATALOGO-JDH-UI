import { Mail, Phone } from "lucide-react"

import { InstagramIcon } from "@/components/icons/instagram-icon"
import { WhatsappIcon } from "@/components/icons/whatsapp-icon"
import { contactConfig } from "@/config/contact.config"

/**
 * Primera franja del chrome — barra de contacto con fondo en GRADIENTE
 * simétrico NEGRO → BLANCO → NEGRO (del negro del tema `--color-ink` al
 * blanco `--color-on-ink` en el centro y de vuelta al negro). Ambos clústeres
 * (contacto a la izquierda, redes + tema a la derecha) quedan sobre el negro
 * de los extremos, así que TODO el texto es blanco (`--color-on-ink`) — un
 * único estándar en la franja.
 *
 * El despliegue/colapso al hacer scroll lo maneja `CatalogoChrome` (liga la
 * altura de esta franja al scroll, de forma continua y suavizada por Lenis):
 * esta franja solo se ve en el límite superior de la página y nunca se
 * desplaza con ella.
 *
 * En móvil (<lg) se reduce a lo esencial — teléfono y WhatsApp — para no
 * apretar la fila ni forzar scroll horizontal; email e Instagram siguen
 * accesibles desde el footer.
 *
 * El selector de tema vive en `AppHeader` (segunda barra), no aquí: esta
 * franja colapsa al hacer scroll y se llevaría el control de tema con ella.
 */
export function ContactBar() {
  return (
    <div className="contact-bar-gradient">
      <div className="mx-auto flex h-9 max-w-[var(--container-wide)] items-center justify-between gap-4 px-4 text-sm select-none sm:px-6">
        {/* Izquierda: contacto directo — blanco sobre el negro del extremo */}
        <div className="flex min-w-0 items-center gap-3 text-[var(--color-on-ink)]">
          <a
            href={contactConfig.phoneHref}
            // `preventDefault` en mousedown: el enlace no retiene el foco tras
            // el clic (evita el anillo de foco blanco persistente al volver a
            // la pestaña). La navegación sigue ocurriendo en el click y el
            // foco por teclado (Tab) funciona igual.
            onMouseDown={(event) => event.preventDefault()}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--jdh-radius-sm)] px-2 transition-colors duration-[var(--duration-fast)] hover:bg-[var(--overlay-on-dark-08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-on-ink)]"
          >
            <Phone className="size-4" aria-hidden />
            <span className="whitespace-nowrap">{contactConfig.phone}</span>
          </a>
          <span
            aria-hidden
            className="hidden h-4 w-px bg-[var(--color-ink-border)] lg:block"
          />
          <a
            href={contactConfig.emailHref}
            onMouseDown={(event) => event.preventDefault()}
            className="hidden h-9 items-center gap-1.5 rounded-[var(--jdh-radius-sm)] px-2 transition-colors duration-[var(--duration-fast)] hover:bg-[var(--overlay-on-dark-08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-on-ink)] lg:flex"
          >
            <Mail className="size-4" aria-hidden />
            <span className="whitespace-nowrap">{contactConfig.email}</span>
          </a>
        </div>

        {/* Derecha: redes + tema — blanco sobre el negro del extremo */}
        <div className="flex shrink-0 items-center gap-1 text-[var(--color-on-ink)]">
          <a
            href={contactConfig.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Escríbenos por WhatsApp"
            onMouseDown={(event) => event.preventDefault()}
            className="flex h-9 items-center gap-1.5 rounded-[var(--jdh-radius-sm)] px-2 transition-colors duration-[var(--duration-fast)] hover:bg-[var(--overlay-on-dark-08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-on-ink)]"
          >
            <WhatsappIcon className="size-4" />
            <span className="whitespace-nowrap">WhatsApp</span>
          </a>
          <span
            aria-hidden
            className="hidden h-4 w-px bg-[var(--color-ink-border)] lg:block"
          />
          <a
            href={contactConfig.instagramUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="JDH en Instagram"
            onMouseDown={(event) => event.preventDefault()}
            className="hidden h-9 items-center rounded-[var(--jdh-radius-sm)] px-2 transition-colors duration-[var(--duration-fast)] hover:bg-[var(--overlay-on-dark-08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-on-ink)] lg:flex"
          >
            <InstagramIcon className="size-[18px]" />
          </a>
        </div>
      </div>
    </div>
  )
}
