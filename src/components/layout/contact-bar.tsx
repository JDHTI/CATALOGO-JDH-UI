import { Mail, Phone } from "lucide-react"

import { InstagramIcon } from "@/components/icons/instagram-icon"
import { WhatsappIcon } from "@/components/icons/whatsapp-icon"
import { contactConfig } from "@/config/contact.config"

/**
 * Primera franja del chrome — barra de contacto con fondo **BLANCO SÓLIDO**.
 *
 * Antes era un gradiente simétrico NEGRO → BLANCO → NEGRO, con los dos
 * clústeres (contacto a la izquierda, redes a la derecha) sobre el negro de
 * los extremos y por tanto TODO el texto en blanco. Al aplanar el fondo a
 * blanco hubo que invertir el primer plano completo —texto, hover, foco y
 * divisores— o la franja quedaba en blanco sobre blanco: de ahí que aquí ya
 * no aparezca ningún token `on-ink` / `on-dark`.
 *
 * `--color-on-ink` (blanco) y `--color-ink` (negro de marca) son FIJOS: no se
 * invierten con el tema. Eso mantiene la franja blanca también en modo
 * oscuro, coherente con el resto del chrome, que `globals.css` declara negro
 * en ambos temas.
 *
 * El selector de tema vive en la SEGUNDA barra (`AppHeader`), junto a
 * "Mi cuenta".
 *
 * El despliegue/colapso al hacer scroll lo maneja `CatalogoChrome` (liga la
 * altura de esta franja al scroll, de forma continua y suavizada por Lenis):
 * esta franja solo se ve en el límite superior de la página y nunca se
 * desplaza con ella.
 *
 * En móvil (<lg) se reduce a lo esencial — teléfono y WhatsApp — para no
 * apretar la fila ni forzar scroll horizontal; email e Instagram siguen
 * accesibles desde el footer.
 */
export function ContactBar() {
  return (
    <div className="bg-[var(--color-on-ink)]">
      <div className="mx-auto flex h-9 max-w-[var(--container-wide)] items-center justify-between gap-4 px-4 text-sm select-none sm:px-6">
        {/* Izquierda: contacto directo — tinta sobre el blanco de la franja */}
        <div className="flex min-w-0 items-center gap-3 text-[var(--color-ink)]">
          <a
            href={contactConfig.phoneHref}
            // `preventDefault` en mousedown: el enlace no retiene el foco tras
            // el clic (evita que el anillo de foco quede persistente al volver
            // a la pestaña). La navegación sigue ocurriendo en el click y el
            // foco por teclado (Tab) funciona igual.
            onMouseDown={(event) => event.preventDefault()}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--jdh-radius-sm)] px-2 transition-colors duration-[var(--duration-fast)] hover:bg-[var(--overlay-on-light-08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-on-paper)]"
          >
            <Phone className="size-4" aria-hidden />
            <span className="whitespace-nowrap">{contactConfig.phone}</span>
          </a>
          <span
            aria-hidden
            className="hidden h-4 w-px bg-[var(--overlay-on-light-08)] lg:block"
          />
          <a
            href={contactConfig.emailHref}
            onMouseDown={(event) => event.preventDefault()}
            className="hidden h-9 items-center gap-1.5 rounded-[var(--jdh-radius-sm)] px-2 transition-colors duration-[var(--duration-fast)] hover:bg-[var(--overlay-on-light-08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-on-paper)] lg:flex"
          >
            <Mail className="size-4" aria-hidden />
            <span className="whitespace-nowrap">{contactConfig.email}</span>
          </a>
        </div>

        {/* Derecha: redes — tinta sobre el blanco de la franja */}
        <div className="flex shrink-0 items-center gap-1 text-[var(--color-ink)]">
          <a
            href={contactConfig.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Escríbenos por WhatsApp"
            onMouseDown={(event) => event.preventDefault()}
            className="flex h-9 items-center gap-1.5 rounded-[var(--jdh-radius-sm)] px-2 transition-colors duration-[var(--duration-fast)] hover:bg-[var(--overlay-on-light-08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-on-paper)]"
          >
            <WhatsappIcon className="size-4" />
            <span className="whitespace-nowrap">WhatsApp</span>
          </a>
          <span
            aria-hidden
            className="hidden h-4 w-px bg-[var(--overlay-on-light-08)] lg:block"
          />
          <a
            href={contactConfig.instagramUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="JDH en Instagram"
            onMouseDown={(event) => event.preventDefault()}
            className="hidden h-9 items-center rounded-[var(--jdh-radius-sm)] px-2 transition-colors duration-[var(--duration-fast)] hover:bg-[var(--overlay-on-light-08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-on-paper)] lg:flex"
          >
            <InstagramIcon className="size-[18px]" />
          </a>
        </div>
      </div>
    </div>
  )
}
