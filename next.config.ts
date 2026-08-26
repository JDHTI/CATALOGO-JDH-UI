import type { NextConfig } from "next"

/**
 * Next 16 bloquea por defecto la optimización de imágenes servidas desde
 * hosts locales (`dangerouslyAllowLocalIP: false`) como defensa contra SSRF:
 * `/_next/image` responde 400 `"url" parameter is not allowed` ANTES de
 * mirar `remotePatterns`, así que un patrón correcto para `localhost` no
 * basta. El bucket MinIO de desarrollo vive en `localhost:9000`, de modo que
 * sin esto ningún logo ni foto de producto carga en local.
 *
 * Se habilita solo fuera de producción. `ALLOW_LOCAL_IMAGE_HOSTS=1` es la
 * salida para el caso de probar un build de producción (`next build` +
 * `next start`) contra el MinIO local; nunca debe activarse en el despliegue
 * real, donde el bucket es un dominio público.
 */
const permitirHostsLocales =
  process.env.NODE_ENV !== "production" ||
  process.env.ALLOW_LOCAL_IMAGE_HOSTS === "1"

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    dangerouslyAllowLocalIP: permitirHostsLocales,
    remotePatterns: [
      // Bucket MinIO local de desarrollo (HTTP a propósito: no hay TLS
      // local). Rutas del backend: `logos/marcas/…`, `logos/proveedores/…`
      // e imágenes de producto, todas bajo el mismo bucket.
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/jdh-catalogo/**",
      },
      // El dominio del bucket de producción aún no está definido.
      // Restringir al hostname real cuando exista.
      { protocol: "https", hostname: "**" },
    ],
  },
}

export default nextConfig
