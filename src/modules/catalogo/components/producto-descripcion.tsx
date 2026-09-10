/**
 * El contrato editorial del API es texto plano, no HTML enriquecido.
 * React escapa cada párrafo, incluso si una respuesta contiene etiquetas.
 */
export function ProductoDescripcion({ texto }: { texto: string | null }) {
  const parrafos =
    texto
      ?.trim()
      .split(/\r?\n\s*\r?\n/)
      .filter(Boolean) ?? []
  if (!parrafos.length) return null

  return (
    <section
      aria-label="Descripción del producto"
      className="flex flex-col gap-3"
    >
      <h2 className="text-lg font-medium">Descripción</h2>
      {parrafos.map((parrafo, indice) => (
        <p
          key={indice}
          className="max-w-prose text-base leading-relaxed whitespace-pre-line text-muted-foreground"
        >
          {parrafo}
        </p>
      ))}
    </section>
  )
}
