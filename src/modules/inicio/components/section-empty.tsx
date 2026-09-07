import { cn } from "@/lib/utils"

/**
 * Nota discreta al pie de una sección de la homepage.
 *
 * Historia de este archivo, porque explica el diseño actual: primero las
 * secciones sin datos se OCULTABAN (la homepage se quedaba sin cuerpo y
 * parecía rota); luego mostraban una caja punteada con un aviso (la página
 * se leía como una lista de errores, sin nada que ver). Ahora cada sección
 * dibuja su GRILLA FANTASMA — las mismas cajas que tendrá con datos, con el
 * espacio del logo ya reservado — y esta nota explica en una línea por qué
 * están vacías. Así la página tiene forma desde el primer día y, cuando el
 * catálogo se llene, no cambia de layout: solo se rellenan los huecos.
 */
export function SectionNota({
  mensaje,
  onInk = false,
  className,
}: {
  mensaje: string
  onInk?: boolean
  className?: string
}) {
  return (
    <p
      className={cn(
        "text-center text-xs",
        onInk ? "text-[var(--color-on-ink-muted)]" : "text-muted-foreground",
        className
      )}
    >
      {mensaje}
    </p>
  )
}

/** Copy compartido: mismo mensaje para el mismo caso en toda la homepage. */
export const SECTION_EMPTY_COPY = {
  /** El API respondió, pero todavía no hay registros publicados. */
  sinDatos: (queNoHay: string) =>
    `Los ${queNoHay} aparecerán aquí en cuanto el portafolio esté cargado.`,
  /** El API no respondió: no se promete nada que no se sepa. */
  error: "No pudimos cargar esta sección en este momento.",
} as const
