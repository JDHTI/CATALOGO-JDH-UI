/**
 * Columnas de enlaces del footer (DESIGN.md §4.2). La columna de marca y la de
 * sedes las deriva el componente de `siteConfig`; estas son las columnas de
 * enlaces del medio.
 *
 * `href` es un string plano (no un `Route` tipado): estas páginas
 * institucionales todavía no existen, así que el footer las renderiza como
 * `<a>` planos. Promoverlas a `<Link>` cuando exista su página.
 */
export interface FooterLink {
  label: string
  href: string
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

export interface FooterConfig {
  columns: FooterColumn[]
  /** Muestra la columna de sedes JDH (construida desde `siteConfig.sedes`). */
  showSedes: boolean
}

export const footerConfig: FooterConfig = {
  columns: [
    {
      title: "Catálogo",
      links: [
        { label: "Todos los productos", href: "/productos" },
        // Aquí había "Categorías" (→ /categorias) y "Marcas" (→ /marcas):
        // ambas rutas eran 404, y el catálogo real no se clasifica por
        // categorías (el esquema las tiene, pero sin datos). Los dos ejes
        // reales, proveedor y marca, se filtran DENTRO del listado y no
        // tienen página propia; cuando la tengan, vuelven aquí.
      ],
    },
    {
      title: "Clientes",
      links: [
        { label: "Ingresar", href: "/ingreso" },
        { label: "Solicitar cuenta", href: "/solicitar-cuenta" },
        { label: "Preguntas frecuentes", href: "/faq" },
      ],
    },
    {
      title: "Institucional",
      links: [
        { label: "Privacidad", href: "/privacidad" },
        { label: "Términos y condiciones", href: "/terminos" },
        { label: "Contacto", href: "/#contacto" },
      ],
    },
  ],
  showSedes: true,
}
