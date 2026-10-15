# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────
# jdh-catalogo-ui (Next.js 16, output: "standalone")
# Stages: base -> deps -> auth-migrate   (one-shot: tablas de Better Auth)
#                      -> build -> runtime
# Producción: CATALOGO-JDH-API/deploy/compose.prod.yaml construye esta imagen
# desde el clon hermano ../CATALOGO-JDH-UI (tienda.jdh.local). Vercel no usa
# este archivo.
# ─────────────────────────────────────────────────────────────────────────

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.15.1 --activate
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ── auth-migrate: crea/actualiza user/session/account/verification/ ───────
# rateLimit/jwks. Corre `better-auth migrate` contra DATABASE_URL (base
# jdh_auth). Idempotente: solo aplica lo que falte.
FROM deps AS auth-migrate
COPY scripts/auth-schema.ts ./scripts/auth-schema.ts
CMD ["pnpm", "auth:migrate"]

# ── build ─────────────────────────────────────────────────────────────────
FROM deps AS build
# NEXT_PUBLIC_* se incrustan en el bundle del navegador EN EL BUILD: la imagen
# solo sirve para el entorno con el que se construyó. Se dejan como ARG a
# propósito (sin `ENV X=$X`): un ARG no pasado queda SIN DEFINIR y el código
# usa su valor por defecto; con `ENV` quedaría como cadena vacía y
# `process.env.NEXT_PUBLIC_API_URL ?? "<defecto>"` no caería al defecto.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_ASSETS_CDN_URL
# Next 16 bloquea optimizar imágenes de hosts locales. Con el bucket en la LAN
# (tienda.jdh.local) hay que permitirlo; se evalúa en `next build`.
ARG ALLOW_LOCAL_IMAGE_HOSTS
ENV NEXT_OUTPUT=standalone
COPY . .
# `src/lib/auth/server.ts` y `tenant.ts` exigen estas variables al cargar el
# módulo, y `next build` carga los módulos de rutas al recolectar datos de
# página. Son placeholders SOLO del proceso de build (no quedan en la imagen
# final: `runtime` parte de cero); los valores reales llegan en runtime.
RUN DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build" \
    BETTER_AUTH_SECRET="build-placeholder-build-placeholder-000" \
    AUTH_MICROSOFT_ENTRA_ID_ID="build-placeholder" \
    AUTH_MICROSOFT_ENTRA_ID_SECRET="build-placeholder" \
    AUTH_MICROSOFT_ENTRA_ID_TENANT_ID="00000000-0000-0000-0000-000000000000" \
    pnpm build

# ── runtime: solo el servidor standalone, sin código fuente ni pnpm ───────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1
CMD ["node", "server.js"]
