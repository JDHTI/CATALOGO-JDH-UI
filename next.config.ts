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

/**
 * El host del bucket sale de `NEXT_PUBLIC_ASSETS_CDN_URL` — la misma variable
 * con la que `src/lib/site-assets.ts` arma las URLs del hero y los banners, y
 * el mismo bucket del que el API sirve productos y logos. Derivarlo en vez de
 * escribirlo evita el fallo clásico: mover el bucket a un Custom Domain y
 * olvidar esta lista, con `/_next/image` respondiendo 400 sin más explicación.
 *
 * Si la variable no está, se cae al comodín de cualquier host HTTPS que había
 * antes: preferible a que un entorno sin configurar deje la página sin
 * imágenes por un 400 difícil de leer.
 */
function patronDelBucket(): NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
>[number] {
  const publicUrl = process.env.NEXT_PUBLIC_ASSETS_CDN_URL
  if (!publicUrl) return { protocol: "https", hostname: "**" }

  try {
    const { protocol, hostname, port, pathname } = new URL(publicUrl)
    return {
      protocol: protocol.replace(":", "") as "http" | "https",
      hostname,
      ...(port && { port }),
      // El dominio público de R2 (`pub-….r2.dev`) sirve la RAÍZ del bucket, así
      // que ahí `pathname` es "/" y el patrón queda `/**`. Con MinIO o un
      // endpoint path-style, la base incluye el bucket y se conserva.
      pathname: `${pathname.replace(/\/+$/, "")}/**`,
    }
  } catch {
    return { protocol: "https", hostname: "**" }
  }
}

const nextConfig: NextConfig = {
  // Imagen Docker mínima (despliegue en tienda.jdh.local): `.next/standalone`
  // trae server.js y solo los node_modules trazados. Solo con NEXT_OUTPUT=
  // standalone (lo fija el Dockerfile) para no alterar el build de Vercel.
  ...(process.env.NEXT_OUTPUT === "standalone" && {
    output: "standalone" as const,
    // Node >=22.12 resuelve la condición `module-sync` de los `exports` de
    // @swc/helpers hacia `esm/`, pero el trazado solo copia `cjs/`: el
    // contenedor muere con "Cannot find module .../@swc/helpers/esm/
    // _interop_require_default.js". Con pnpm el paquete no está en el
    // `node_modules` de primer nivel, de ahí la ruta del store virtual.
    outputFileTracingIncludes: {
      "/*": [
        "node_modules/.pnpm/@swc+helpers@*/node_modules/@swc/helpers/esm/**/*",
      ],
    },
  }),
  typedRoutes: true,
  images: {
    dangerouslyAllowLocalIP: permitirHostsLocales,
    remotePatterns: [
      // El bucket en uso, derivado de S3_PUBLIC_URL. Ahí viven TODAS las
      // imágenes remotas: `logos/marcas/…`, `logos/proveedores/…`,
      // `site/hero/…`, `site/banners/…` y las de producto.
      patronDelBucket(),
      // Bucket MinIO local de desarrollo (HTTP a propósito: no hay TLS local).
      // Se deja fijo además del derivado para poder alternar entre el bucket
      // real y el local sin reiniciar con otra config.
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/jdh-catalogo/**",
      },
      // Bucket de producción (Cloudflare R2, subdominio público r2.dev).
      // Mismo host que NEXT_PUBLIC_ASSETS_CDN_URL / S3_PUBLIC_URL del backend.
      {
        protocol: "https",
        hostname: "pub-b1f8029314db46a59976c23763aa4b06.r2.dev",
      },
    ],
  },
}

export default nextConfig
