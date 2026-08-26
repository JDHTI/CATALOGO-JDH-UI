import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [
      // Bucket MinIO local de desarrollo (HTTP a propósito: no hay TLS local).
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/jdh-catalogo/**",
      },
      // El dominio del bucket S3 de producción aún no está definido.
      // Restringir al hostname real cuando exista.
      { protocol: "https", hostname: "**" },
    ],
  },
}

export default nextConfig
