import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    // Las fotos de producto llegarán de un bucket S3 cuyo dominio aún no
    // está definido. Restringir al hostname real del bucket cuando exista.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
}

export default nextConfig
