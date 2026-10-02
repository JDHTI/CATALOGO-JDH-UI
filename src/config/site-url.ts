/**
 * Origen público de producción, independiente del host de cada preview.
 *
 * Cascada: `NEXT_PUBLIC_SITE_URL` → dominio de producción que inyecta Vercel →
 * el dominio corporativo. El paso intermedio no es opcional mientras
 * `catalogo.jdh.com.co` no resuelva DNS: `og:image`, canónicas y JSON-LD se
 * arman sobre este origen, y apuntarlos a un host inexistente deja las vistas
 * previas de Teams/WhatsApp con el icono genérico. La variante `NEXT_PUBLIC_`
 * de la variable de sistema se inlinea en build, así que vale igual en
 * servidor y en cliente.
 */
const vercelProduccion = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL

export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ||
    (vercelProduccion ? `https://${vercelProduccion}` : "") ||
    "https://catalogo.jdh.com.co"
)
