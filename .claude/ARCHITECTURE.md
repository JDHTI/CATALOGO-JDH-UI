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

## 2026-08-26 — Consumir productos reales de jdh-catalogo-api desde el cliente, con mock conmutable por env

**Contexto:** el backend del catálogo (`jdh-catalogo-api`, NestJS en `http://localhost:8080/api/v1`) empieza a exponer productos y proveedores. El catálogo es SOLO referencia visual para vendedores y clientes — sin venta, sin carrito y sin precios (llegarán después). El contrato es provisional: los nombres de campos pueden ajustarse cuando el backend cierre sus módulos, y `imagenUrl` (bucket S3) será `null` para muchos productos al inicio. El listado necesita búsqueda, filtro por proveedor y paginación interactivas.

**Decisión:** el módulo `catalogo` consume el API público **desde el cliente** con TanStack Query (`hooks/use-productos.ts`), no vía `server/queries.ts`: los endpoints son públicos (sin sesión — `backend-fetch.ts` sería incorrecto porque fuerza identidad) y la interactividad búsqueda/filtro/página se beneficia del caché por query key y `keepPreviousData`. La frontera con el API vive en dos capas para absorber renombres: `schemas/api.ts` valida el DTO con zod (tolerante: nullish, ids coercionados) y lo mapea a los tipos de dominio de `types.ts`; `api/client.ts` es el único lugar que conoce URLs, `NEXT_PUBLIC_API_URL` y el formato de error NestJS. Un mock local (`mock/productos.mock.ts`) replica la semántica confirmada del contrato (search sobre nombre/sku/marca, `supplierId`, `{ data, meta }`) y se conmuta con `NEXT_PUBLIC_CATALOGO_MOCK=1`; pasa por los MISMOS mappers que el cliente real. El estado del listado (q/proveedor/pagina) vive en la URL, así el buscador del header (`/productos?q=…`) cae en el mismo mecanismo. Los precios NO existen en estos tipos ni en la UI: las cards y el detalle dejan el slot comentado, y cuando el backend los defina entrarán por el mapper + `PriceContext`, nunca improvisados en componentes. Alternativas descartadas: fetch en Server Components (perdería el caché interactivo y la página ya es dinámica por la sesión) y mantener el dataset visual anterior (se retiró junto con sus filtros decorativos).

**Consecuencias:**

- Un rename de campos del backend se ajusta SOLO en `schemas/api.ts`; componentes y hooks no ven DTOs.
- `next.config.ts` permite imágenes remotas de cualquier host HTTPS de forma temporal; hay que restringirlo al dominio real del bucket S3 cuando exista.
- El detalle de producto se resuelve en cliente: el `<title>` de `/productos/[id]` es genérico. Si el catálogo necesita SEO real por producto, habrá que mover esa lectura a servidor (con `generateMetadata`) — merecerá su propia entrada.
- Apagar el mock es poner `NEXT_PUBLIC_CATALOGO_MOCK=0` (o quitarla); es una variable de build, no de runtime.

> **Superada el 2026-08-26 por la entrada siguiente:** el mock y su variable de entorno se eliminaron por completo, y la clasificación por categorías se reemplazó por proveedor + marca.

## 2026-08-26 — Eliminar todo dato de producto inventado y clasificar solo por proveedor y marca

**Contexto:** el catálogo arrastraba tres generaciones de datos falsos: el mock del módulo `catalogo` (recién añadido, con su switch por env), un dataset de marketing en `modules/inicio` con productos que tenían **precio y botón de carrito**, y una lista de 10 **categorías inventadas** en `src/config/search.config.ts` que alimentaba el buscador del header, la barra de navegación, los banners del listado y la grilla del homepage. Ninguna categoría existía en los datos reales: el backend tiene las columnas pero sin datos, y `/productos?categoria=…` nunca fue un filtro real — todos esos enlaces eran destinos muertos. El backend confirmó además la escala real (~9.000 productos, hasta 645 proveedores) y que los ids son enteros.

**Decisión:** los únicos ejes de clasificación son **proveedor** (`supplierId`) y **marca** (`brandId`, tabla propia en el backend, `GET /brands?supplierId=`); las categorías desaparecen de la UI hasta que existan datos. Se borraron `mock/productos.mock.ts`, `mock/inicio.mock.ts`, `search.config.ts`, `category-dropdown.tsx`, `categories-section.tsx`, `modules/inicio/types.ts` y las cards de marketing `components/cards/product-card.tsx` + `product-detail-modal.tsx` (eran el único sitio con precio y "Añadir al carrito"). El API es ahora la única fuente de productos: sin `NEXT_PUBLIC_CATALOGO_MOCK`, sin datos de relleno. Consecuencias por superficie:

- **Panel de filtros** (`catalog-filters.tsx`): dos ejes, selección única cada uno (el API acepta un id por eje), con **búsqueda local** y tope de 50 filas renderizadas — una lista de 645 radios no es usable ni barata en DOM. Las marcas se acotan al proveedor elegido, y cambiar de proveedor limpia la marca (puede no existir en el nuevo).
- **Buscador del header**: perdió el segmento de categoría; solo transporta el término a `/productos?q=`.
- **Barra de navegación inferior**: se alimenta de `GET /brands` (las 6 marcas con más referencias). Se eligió marca sobre proveedor porque es el eje con el que un comprador reconoce el portafolio de un vistazo.
- **Banners del listado**: se quedaron como pieza visual y perdieron su CTA, en vez de inventarles un destino.
- **Homepage**: las cuatro secciones que dependían del mock ahora piden sus datos al API **desde el cliente**, lo que mantiene `/` estática y sin depender de que el API esté arriba en build.

**Sobre los estados vacíos** — el error que corrigió esta entrada: la primera versión OCULTABA cada sección de la homepage sin datos. Con el backend en base vacía eso borró todo el cuerpo de la página y se leyó, correctamente, como una página averiada. Ahora cada sección **conserva su encabezado** y muestra un `SectionEmpty` con altura parecida a la grilla que sustituye, distinguiendo "aún no hay datos publicados" de "no pudimos cargar" (`section-empty.tsx`). La regla general: en la homepage, la ausencia de datos es un estado que se comunica, no una sección que desaparece; en `/productos`, donde el usuario fue a buscar productos, el error es explícito y con reintento.

**Consecuencias:**

- Sin backend arriba no hay catálogo que mostrar, a propósito. Es el comportamiento pedido: antes que un dato inventado, un estado vacío honesto.
- El eje marca degrada solo: si `/brands` responde 404, `useMarcas` lo marca `noImplementado`, la UI oculta ese eje y **nunca envía `brandId`** — así un backend sin ese filtro no recibe un param que podría rechazar con 400.
- `logoDeMarca` en `brands-section.tsx` mapea el nombre real de la marca a los logos de `public/photos/marcas/` por slug; si no hay asset, la celda es tipográfica. Los logos son assets, no datos: la sección nunca depende de que exista el archivo.
- **Verificado contra el servicio vivo** (base vacía): la UI emite `?page=1&limit=12&search=…&supplierId=…&brandId=…` tal cual, y el detalle resuelve el 404 tanto de un id inexistente como de uno malformado. `pnpm build` deja `/` y `/productos` estáticas.
- Queda un **warning de hidratación solo en `next dev`** en `/productos`: `MainNav` y el panel comparten la query de marcas, y la hidratación diferida del `Suspense` ocurre cuando esa query ya resolvió, así que el cliente pinta el estado con datos donde el SSR puso el skeleton. En producción no ocurre (la ruta se sirve prerenderizada con el fallback del `Suspense`) y se verificó con cero errores de consola. No se parcheó con un estado `mounted` porque eso añadiría un render extra y un parpadeo de skeleton en producción para silenciar ruido de desarrollo.
- **Los nombres comerciales llegan del ERP en MAYÚSCULAS SOSTENIDAS y con forma jurídica** ("LOCERIA COLOMBIANA S.A.", "ACO UNILEVER"); el backend guarda el texto crudo del datawarehouse a propósito. `formatNombreComercial()` en `src/lib/format.ts` los presenta en capitalización de título preservando siglas ("S.A.", "S.A.S.") y nombres que empiezan por dígito ("3M"), y no toca un texto que ya venga bien capitalizado. Es SOLO presentación: el dominio conserva el valor crudo, que es contra lo que se casan los logos de marca y lo que se filtra localmente. Por lo mismo se retiró el `uppercase` del eyebrow de marca en la card, el detalle y el placeholder de imagen: sobre un nombre que ya viene en alta y puede traer forma jurídica, forzarlo otra vez lo hace ilegible.
- Rate limit del API: 100 req/60s por IP. Cada carga de `/productos` hace 4 llamadas (productos, proveedores, marcas globales del nav y marcas del proveedor); los ejes se cachean 5 minutos en TanStack Query para no repetirlas.
