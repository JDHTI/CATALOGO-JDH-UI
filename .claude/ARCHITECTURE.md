# ARCHITECTURE.md

Registro vivo de decisiones y cambios arquitectónicos de Catálogo JDH. A diferencia de `DESIGN.md` (sistema visual) y `CLAUDE.md` (guía operativa para agentes), este documento existe para responder **por qué** el proyecto está estructurado como está — no qué hace el código (eso se lee en el código) sino qué alternativas se descartaron y qué se rompería si se revierte la decisión.

## Cuándo añadir una entrada

Añade una entrada cuando un cambio:

- introduce o retira una dependencia estructural (framework, librería de datos, sistema de auth, ORM, etc.);
- cambia una convención transversal (estructura de carpetas, patrón de fetching, estrategia de caché, autenticación, despliegue);
- se desvía deliberadamente de una recomendación por defecto (de Next.js, de una librería, de DESIGN.md) y esa desviación no es obvia leyendo el código.

No documentes aquí bugs puntuales, cambios de UI sin impacto estructural, ni nada que ya se explique solo con `git log`/`git blame`.

**Formato de entrada:**

```markdown
## YYYY-MM-DD — Título corto en imperativo

**Contexto:** qué problema o pregunta motivó esto.
**Decisión:** qué se hizo, y qué alternativas se consideraron.
**Consecuencias:** qué implica hacia adelante (para quién, en qué casos, qué queda pendiente).
```

Las entradas nuevas van **al final** (orden cronológico ascendente) para que el historial se lea como una narrativa.

---

## Stack vigente (resumen, no fuente de verdad — ver entradas para el detalle)

| Área               | Elección                                                              |
| ------------------ | --------------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router, Turbopack por defecto)                        |
| Lenguaje           | TypeScript estricto                                                   |
| Gestor de paquetes | pnpm                                                                  |
| Estilos            | Tailwind CSS v4 (config CSS-first, sin `tailwind.config.js`)          |
| Componentes UI     | shadcn/ui (base Radix, preset `radix-nova`, color base `neutral`)     |
| Sistema de diseño  | `DESIGN.md` (monocromo corporativo JDH) — fuente de verdad visual     |
| Datos / caché      | TanStack Query (patrón SSR-safe para App Router)                      |
| Tablas             | TanStack Table (vía `components/data/data-table.tsx`)                 |
| Tema claro/oscuro  | next-themes, activado por clase `.dark`                               |
| Validación         | Zod                                                                   |
| Notificaciones     | Sonner (vía `components/ui/sonner.tsx`)                               |
| Animación          | Motion + Lenis                                                        |
| Skeletons          | boneyard-js (huesos capturados del DOM real)                          |
| Formato            | Prettier + `prettier-plugin-tailwindcss`                              |
| Auth               | Better Auth 1.6.25 — Entra ID (personal JDH) + email/clave (clientes) |

---

## 2026-08-19 — Adoptar `INTRANET-JDH-UI` como base del proyecto

**Contexto:** el repositorio era un scaffold pelado de `create-next-app`. Ya existía un proyecto hermano (`INTRANET-JDH-UI`) con un sistema de diseño implementado, un catálogo de componentes fiel a `DESIGN.md`, y una arquitectura de módulos verticales probada. Construir el catálogo desde cero habría significado re-derivar todo eso y arriesgar dos dialectos visuales distintos para la misma marca.

**Decisión:** portar la base completa del proyecto hermano en vez de reimplementarla:

- **Diseño:** `.claude/DESIGN.md` y el `src/app/globals.css` que lo implementa (primitivos → semántica → remapeo sobre los tokens de shadcn), Centrale Sans en `.woff2`, logos e iconos PWA generados, escala de z-index por `data-slot`.
- **Componentes:** el catálogo `Jdh*` completo (`components/{common,layout,navigation,forms,cards,data,modals,motion,icons}`) más `components/ui/` de shadcn, sin modificaciones — así un cambio en el sistema de diseño se puede aplicar en los dos proyectos con el mismo diff.
- **Estructura:** capa de rutas delgada + módulos verticales dirigidos por registro (`src/modules/` + `src/config/modules.ts`), misma convención y mismo contrato (`src/modules/README.md`).
- **Infraestructura:** `typedRoutes`, ESLint con el patrón `^_`, Prettier con el plugin de Tailwind, `pnpm`, TanStack Query/Table, Zod, Motion + Lenis, boneyard-js.

Se descartó lo que es exclusivo de la intranet: módulos de negocio (noticias, directorio, vacaciones…), la integración con Strapi, Microsoft Graph (fotos de empleado), notificaciones y el flujo de onboarding.

**Consecuencias:** los dos proyectos comparten dialecto, así que moverse entre ellos no cuesta re-aprender nada, pero también quedan **acoplados por copia**: una mejora en un componente `Jdh*` no se propaga sola. Si esa divergencia empieza a doler, el siguiente paso natural es extraer `components/` + `globals.css` a un paquete compartido — no se hizo ahora porque un monorepo para dos consumidores es más ceremonia que beneficio.

`better-auth` quedó **fijado a `1.6.25`** (sin `^`): la 1.7.0 cambió los tipos de `mapProfileToUser` / `BetterAuthOptions` y rompe la inferencia de `additionalFields` con el patrón `satisfies BetterAuthOptions` que usan los dos proyectos. Al subir de versión hay que hacerlo en ambos y a la vez.

## 2026-08-19 — Un solo árbol de rutas para catálogo público y de clientes; el precio es la única costura

**Contexto:** el producto tiene tres frentes: catálogo **público**, ingreso de **clientes** y **panel de administración**. Los dos primeros comparten estructura: la diferencia real es de dónde salen los precios (lista pública vs. lista negociada) y algunas preferencias de visualización.

**Decisión:** un único route group `(catalogo)` sirve a ambas audiencias — mismas rutas, mismo shell, mismos componentes. La audiencia se resuelve **una vez por request** en `src/lib/precios/getPriceContext()`, que lee la sesión y devuelve un `PriceContext` (`audiencia`, `clienteId`, `listaPrecioId`, `mostrarIva`). Ese contexto se pasa **explícitamente** como argumento a cada query del módulo; ninguna query lee la sesión por su cuenta.

Alternativas descartadas:

- **Dos route groups** (`(publico)` y `(clientes)`) con rutas espejo: duplicaría todo el mantenimiento del catálogo (y sus metadatos y su SEO) para variar un número.
- **Que cada query lea la sesión**: hace la query impura respecto a la audiencia, imposible de cachear por lista, y convierte "olvidé comprobar la sesión" en una fuga de precios negociados a la superficie pública.
- **Resolver el precio en el cliente**: expondría la lista completa en el payload.

**Consecuencias:**

- La regla dura del proyecto: **una query de catálogo recibe `PriceContext`, nunca lo deduce**. `priceCacheKey()` da la clave estable para `cacheTag()` y para las query keys de TanStack Query, de modo que el precio público y el de cada lista no se contaminen entre sí.
- Que un componente sepa la audiencia es aceptable solo para **copy** (ver `CatalogoView`), no para estructura. Si algún día la estructura divergiera de verdad, eso justifica dos vistas, no un `if`.
- **Coste real y ya visible:** `/` y `/productos` salen del build como rutas **dinámicas** (`ƒ`), no prerenderizadas, porque `getPriceContext()` lee la sesión (y por tanto cookies) en todo request, incluido el anónimo. Para un catálogo público con aspiraciones de SEO eso es un problema de rendimiento a resolver: la salida natural es partir la página en un shell estático + un límite de Suspense que resuelva solo el precio, o servir la variante pública desde una ruta cacheada y la del cliente desde una dinámica. Queda pendiente y merecerá su propia entrada.
- `PROTECTED_PREFIXES` en `src/proxy.ts` es la lista de lo privado; añadir una página pública no requiere tocar ese archivo, añadir un área privada sí.

## 2026-08-19 — Auth con dos proveedores: Entra ID para personal, email/clave para clientes

**Contexto:** la intranet usa Better Auth + Microsoft Entra ID single-tenant, lo que funciona porque todos sus usuarios están en el tenant de JDH. Los **clientes** del catálogo son externos: no tienen cuenta corporativa, así que Entra no puede ser su vía de ingreso.

**Decisión:** un solo Better Auth con dos proveedores. `socialProviders.microsoft` (Entra, single-tenant, App Roles → `roles`) para asesores y administradores; `emailAndPassword` para cuentas de cliente. Una sola pantalla `/ingreso` presenta ambas: el formulario de cliente como acción primaria y "Soy personal JDH" como secundaria (DESIGN.md §4.3 — un solo botón primario por bloque de decisión).

`emailAndPassword.disableSignUp: true` a propósito: la cuenta de un cliente la crea el panel de administración, que es lo único capaz de vincularla a su `clienteId` en el ERP. Un auto-registro no puede verificar que quien se inscribe sea realmente ese cliente, y de esa vinculación dependen los precios negociados.

El RBAC añade un rol `anonimo` que **no** viene de ningún proveedor de identidad: es el conjunto de permisos que se usa cuando `getCurrentUser()` devuelve `null` (`ANONYMOUS_PERMISSIONS`). Por eso las superficies que sirven a anónimos deben usar `getEffectivePermissions()` y no `user?.permissions ?? []`, que ocultaría el catálogo por falta de sesión.

**Consecuencias:**

- El error de credenciales es deliberadamente genérico: no distingue "no existe" de "contraseña incorrecta", para no ofrecer un oráculo de enumeración de cuentas.
- **Pendiente, no implementado:** el flujo por el que un admin crea la cuenta de un cliente y le asigna `clienteId`/`listaPrecioId` (hoy son `additionalFields` con `input: false`, escribibles solo vía `internalAdapter.updateUser`), y la recuperación de contraseña para clientes (requiere decidir el envío de correo). Sin esos dos, ningún cliente puede ingresar todavía.
- `src/proxy.ts` es **público-primero**, el inverso del de la intranet. Es la decisión correcta para una vitrina, pero significa que un área privada nueva **no** queda protegida por defecto: hay que añadirla a `PROTECTED_PREFIXES`. El chequeo autoritativo sigue siendo `requirePermissions` en el layout o la Server Action.
- La infraestructura de datos aún no está definida: `DATABASE_URL` es un placeholder sintácticamente válido para que `next dev`/`next build` arranquen (Better Auth construye su `Pool` al importar el módulo, pero no conecta hasta la primera lectura de sesión). Ninguna sesión funciona de verdad hasta que exista Postgres y se corra `pnpm auth:migrate`.
