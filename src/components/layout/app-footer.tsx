import { Phone } from "lucide-react"

import { Logo } from "@/components/common/logo"
import { InstagramIcon } from "@/components/icons/instagram-icon"
import { contactConfig } from "@/config/contact.config"
import { footerConfig } from "@/config/footer.config"
import { siteConfig } from "@/config/site"

/**
 * Site footer (DESIGN.md §4.2) — brand + link columns + sedes, and a legal bar.
 * The footer is always the inverse of the page background: black ink chrome in
 * light, fixed white "paper" chrome with black text/logo in dark (otherwise it
 * would blend into the dark background). Server Component: its config carries
 * no icons, so nothing crosses the RSC boundary; the inversion is pure `dark:`
 * CSS. Institutional/support links are plain `<a>` until their pages exist.
 */
/**
 * Títulos de columna en Centrale Sans Medium, versalitas con tracking amplio
 * (DESIGN.md §4.2: `--fs-sm`, `--fw-medium`, `--ls-wide`). Antes iban en la
 * fuente mono del sistema, que no es de la marca y se leía como código.
 */
const TITULO_COLUMNA =
  "mb-4 text-sm font-medium tracking-[var(--ls-wide)] text-[var(--color-on-ink-muted)] uppercase dark:text-[var(--color-on-paper-muted)]"

/** Enlaces de contacto con ícono: el ícono es decorativo, el texto lo nombra. */
const ENLACE_CONTACTO =
  "flex w-fit items-center gap-2 underline-offset-4 hover:underline"

export function AppFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[var(--color-ink)] text-[var(--color-on-ink)] dark:border-t dark:border-[var(--color-paper-border)] dark:bg-[var(--color-paper)] dark:text-[var(--color-on-paper)]">
      <div className="mx-auto grid w-full max-w-[var(--container-wide)] gap-12 px-6 pt-16 pb-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo variant="text" tone="auto-inverse" height={28} />
          <p className="max-w-[40ch] text-sm text-[var(--color-on-ink-muted)] dark:text-[var(--color-on-paper-muted)]">
            {siteConfig.description}
          </p>
          <address
            id="contacto"
            className="scroll-mt-[calc(var(--catalogo-chrome-height)+1rem)] space-y-3 text-sm not-italic"
          >
            <p>
              <span className="block font-medium">Dirección principal</span>
              <span className="block">{contactConfig.address}</span>
              <span className="block">{contactConfig.location}</span>
            </p>
            <a href={contactConfig.phoneHref} className={ENLACE_CONTACTO}>
              <Phone className="size-4 shrink-0" aria-hidden="true" />
              <span>
                <span className="sr-only">Teléfono: </span>
                {contactConfig.phone}
              </span>
            </a>
            <a
              href={contactConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={ENLACE_CONTACTO}
            >
              <InstagramIcon className="size-4 shrink-0" />
              <span>Instagram</span>
            </a>
          </address>
        </div>

        {footerConfig.columns.map((column) => (
          <div key={column.title}>
            <p className={TITULO_COLUMNA}>{column.title}</p>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-[var(--color-on-ink)] transition-colors hover:text-[var(--color-on-ink-muted)] dark:text-[var(--color-on-paper)] dark:hover:text-[var(--color-on-paper-muted)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {footerConfig.showSedes ? (
          <div>
            <p className={TITULO_COLUMNA}>Sedes</p>
            <p className="text-sm text-[var(--color-on-ink-muted)] dark:text-[var(--color-on-paper-muted)]">
              {siteConfig.sedes.join(" · ")}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mx-auto flex w-full max-w-[var(--container-wide)] flex-col gap-2 border-t border-[var(--color-ink-border)] px-6 py-6 text-xs text-[var(--color-on-ink-muted)] sm:flex-row sm:items-center sm:justify-between dark:border-[var(--color-paper-border)] dark:text-[var(--color-on-paper-muted)]">
        <p>
          © {year} {siteConfig.companyLegal}. Todos los derechos reservados.
        </p>
        <p className="font-mono">
          {siteConfig.shortName} {siteConfig.version}
        </p>
      </div>
    </footer>
  )
}
