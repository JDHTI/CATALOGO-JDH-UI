/** Origen público de producción, independiente del host de cada preview. */
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://catalogo.jdh.com.co"
)
