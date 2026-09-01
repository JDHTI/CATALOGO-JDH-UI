import { Mail, Phone } from "lucide-react"

import { InstagramIcon } from "@/components/icons/instagram-icon"
import { WhatsappIcon } from "@/components/icons/whatsapp-icon"
import { contactConfig } from "@/config/contact.config"

/**
 * Primera franja del chrome — barra de contacto en **NEGRO SÓLIDO**, con la
 * misma receta de chrome que `AppHeader` y `MainNav`:
 * `bg-[--color-ink]` + `text-[--color-on-ink]` + un hairline
 * `--color-ink-border`. Aquí va como `border-b`, igual que el `border-b` del
 * header y el `border-t` del menú, así que las tres franjas quedan separadas
 * por la misma línea.
 *
 * Hubo dos versiones anteriores: un gradiente simétrico NEGRO → BLANCO →
 * NEGRO y, brevemente, un blanco plano. Ambas se descartaron. Del episodio
 * blanco queda una lección: el fondo y el primer plano de esta franja se
 * mueven JUNTOS — los dos clústeres (contacto a la izquierda, redes a la
 * derecha) heredan `--color-on-ink`, así que cambiar solo el fondo la deja en
 * blanco sobre blanco o en negro sobre negro.
 *
 * `--color-ink` / `--color-on-ink` son FIJOS: no se invierten con el tema, de
 * modo que el chrome es negro en claro y en oscuro (así lo declara
 * `globals.css`).
 *
 * OJO con el alto: el hairline suma 1px sobre la fila de `h-9`, y
 * `CatalogoChrome` anima esta franja con `overflow-hidden` contra una altura
 * fija (`BAR_HEIGHT`). Ese constante ya cuenta los 37px; si alguna vez se
 * quita el borde o cambia la altura de la fila, hay que ajustarlo o el último
 * pixel se recorta.
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
    <div className="border-b border-[var(--color-ink-border)] bg-[var(--color-ink)] text-[var(--color-on-ink)]">
      <div className="mx-auto flex h-9 max-w-[var(--container-wide)] items-center justify-between gap-4 px-4 text-sm select-none sm:px-6">
        {/* Izquierda: contacto directo — tinta sobre el blanco de la franja */}
        <div className="flex min-w-0 items-center gap-3 text-[var(--color-on-ink)]">
          <a
            href={contactConfig.phoneHref}
            // `preventDefault` en mousedown: el enlace no retiene el foco tras
            // el clic (evita que el anillo de foco quede persistente al volver
            // a la pestaña). La navegación sigue ocurriendo en el click y el
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

        {/* Derecha: redes — tinta sobre el blanco de la franja */}
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
