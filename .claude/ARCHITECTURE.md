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
- **Error de hidratación en `/productos` (resuelto).** `MainNav` y el panel de filtros comparten la query de marcas, y la hidratación diferida del `Suspense` ocurre cuando esa query ya resolvió: el cliente pintaba el estado con datos donde el SSR había puesto el esqueleto. Primero se dejó pasar por ser solo de `next dev`, pero un error rojo en cada carga es ruido que tapa problemas reales, así que `catalog-filters.tsx` fuerza el estado de carga en el primer render del cliente con `useMontado()` (`useSyncExternalStore`, no un `useEffect` con `setState` — lo prohíbe `react-hooks/set-state-in-effect`). Cuesta un fotograma de esqueleto y deja la consola limpia. Ojo si alguna vez el layout comparte otra query con contenido dentro de ese `Suspense`: reaparecería el mismo patrón.
- **Los nombres comerciales llegan del ERP en MAYÚSCULAS SOSTENIDAS y con forma jurídica** ("LOCERIA COLOMBIANA S.A.", "ACO UNILEVER"); el backend guarda el texto crudo del datawarehouse a propósito. `formatNombreComercial()` en `src/lib/format.ts` los presenta en capitalización de título preservando siglas ("S.A.", "S.A.S.") y nombres que empiezan por dígito ("3M"), y no toca un texto que ya venga bien capitalizado. Es SOLO presentación: el dominio conserva el valor crudo, que es contra lo que se casan los logos de marca y lo que se filtra localmente. Por lo mismo se retiró el `uppercase` del eyebrow de marca en la card, el detalle y el placeholder de imagen: sobre un nombre que ya viene en alta y puede traer forma jurídica, forzarlo otra vez lo hace ilegible.
- **Slots de logo y grillas fantasma (2026-08-26, tras revisión del usuario).** Habrá logos almacenados para marcas y proveedores, así que `Proveedor`/`Marca` declaran `logoUrl` (pedido al backend, aún no publicado; `nullish` en el schema para que las respuestas actuales sigan validando). `LogoComercial` es el único punto que resuelve una imagen de entidad, con tres respaldos: `logoUrl` → asset local por slug en `public/photos/marcas/` → monograma de iniciales. La caja mide lo mismo en los tres casos, así que la página no cambia de layout cuando los logos empiecen a llegar. Y el estado sin datos dejó de ser un cartel: cada sección dibuja su GRILLA FANTASMA con esos mismos slots, porque con la base vacía la homepage se veía rota — ver la cabecera de `section-empty.tsx`, que guarda las tres iteraciones de este problema. Dos detalles que solo se vieron mirando la página: el truco hairline de `gap-px` sobre fondo gris deja un bloque gris cuando la última fila queda incompleta (ahora cada celda dibuja sus líneas con `box-shadow`), y el monograma reducía "3M" a "3" (un nombre de ≤3 caracteres se muestra entero).
- **Gotcha de Next 16 con las imágenes locales:** `images.dangerouslyAllowLocalIP` es `false` por defecto y `/_next/image` rechaza con 400 `"url" parameter is not allowed` cualquier host local ANTES de evaluar `remotePatterns` — un patrón correcto para `localhost` no basta. Como el MinIO de desarrollo vive en `localhost:9000`, sin habilitarlo no carga ni un logo ni una foto en local. Se habilita solo fuera de producción, con `ALLOW_LOCAL_IMAGE_HOSTS=1` como salida para probar un build de producción contra el MinIO local. Verificado: con la opción activa, el bucket correcto pasa y tanto un bucket ajeno como otro puerto local siguen rechazados.
- Rate limit del API: 100 req/60s por IP. Cada carga de `/productos` hace 4 llamadas (productos, proveedores, marcas globales del nav y marcas del proveedor); los ejes se cachean 5 minutos en TanStack Query para no repetirlas.

## 2026-08-26 — Buscador del header como combobox con sugerencias, y altura del chrome medida en runtime

**Contexto:** el buscador del header solo transportaba el término a `/productos?q=`: había que enviar la búsqueda, esperar la página completa y recién ahí ver si el producto existía. Con ~9.000 referencias cuyos nombres vienen del ERP ("ARROZ DIANA X 500G"), acertar el término a la primera es improbable, y cada intento fallido costaba una navegación entera. En paralelo, la franja de contacto y el label de "Mi cuenta" seguían presentes en móvil, y la barra del menú mostraba el texto de "Menú" pero recortaba a solo-icono los dos accesos que sí necesitan leerse ("Explorar catálogo", "Promociones") — el reparto inverso al que ya se había validado en `dev`.

**Decisión:**

- **El buscador es un combobox ARIA**, no un input con submit. `ProductSearchBar` mantiene el input, el debounce (220ms), el índice activo del teclado y el ciclo de apertura/cierre; el panel de sugerencias vive en el módulo (`modules/catalogo/components/busqueda-sugerencias.tsx`) y es **presentacional**. La query (`useBusquedaProductos`) se dispara desde el layout porque el combobox necesita el número de opciones para acotar las flechas — pasarla al módulo obligaría a devolver ese conteo hacia arriba por callback. El módulo aporta lo que es suyo: cómo se identifica un producto de un vistazo y a dónde navega.
- **Dos caminos deliberados y no redundantes:** el panel resuelve "quiero ESTE producto" (navega al detalle) y el submit resuelve "quiero VER lo que hay" (navega al listado con `?q=`, conservando proveedor y marca). Por eso el panel **siempre** termina en un enlace al catálogo completo, incluso cuando no hay sugerencias.
- **La búsqueda del header es por nombre de producto.** Es el único eje que un comprador tiene en la cabeza al escribir; proveedor y marca siguen siendo cosa del panel de filtros. Se descartó filtrar client-side los resultados que el backend devuelve por sku o marca: dejaría el panel vacío en casos válidos y desalinearía el conteo de "ver todo". Cuando el API exponga un modo de búsqueda acotado, el cambio es un param en `listarProductos`.
- **`--catalogo-chrome-height` se mide en runtime**, no se escribe por breakpoint. `CatalogoChrome` observa con un `ResizeObserver` el alto real de `AppHeader` + `MainNav` y le suma la franja de contacto solo cuando de verdad ocupa espacio (`md`+). El header pasa de dos filas en móvil a una desde `lg`, así que ningún número a mano puede ser correcto en todos los anchos: el valor de `globals.css` queda solo como fallback pre-hidratación.
- **Reparto del chrome en móvil** (recuperado del estado de `dev`): la franja aviso + contacto no se muestra bajo `md` (`hidden md:block`, sin desmontar para no tirar los motion values); "Mi cuenta" queda en solo-icono bajo `sm`; y en la barra del menú el label que se sacrifica es el de "Menú" — es el trigger más reconocible por su icono — para que "Explorar catálogo" y "Promociones" lleven texto completo siempre. Los tres quedan equidistantes con un único `justify-evenly`, sin divisores, y desde `lg` la columna de marcas absorbe el sobrante y devuelve el layout de escritorio.

**Concurrencia y caché — el buscador es el endpoint más caliente de la tienda.** Se dispara mientras se teclea, en todas las rutas del catálogo, y con el escenario objetivo (~500 visitantes simultáneos) es el que peor escala si se deja con los valores por defecto. El presupuesto se acota en capas, de la más barata a la más caro:

| Capa    | Medida                                                               | Qué evita                                                |
| ------- | -------------------------------------------------------------------- | -------------------------------------------------------- |
| Entrada | Mínimo de 2 caracteres (`MIN_CARACTERES_BUSQUEDA`)                   | Que un caracter pida media bodega                        |
| Entrada | Debounce de 220ms                                                    | Una petición por palabra, no por letra                   |
| Entrada | La query se ata a que el panel esté ABIERTO                          | Teclear tras un Escape no consume peticiones             |
| Payload | `limit=5` (`LIMITE_SUGERENCIAS`)                                     | Traer 12 filas para pintar 5                             |
| Caché   | `staleTime` 5 min + `gcTime` 30 min, clave con espaciado normalizado | Repetir un término de la misma sesión                    |
| Red     | El `queryFn` propaga el `AbortSignal` a `fetch`                      | Tres peticiones vivas compitiendo mientras se teclea     |
| Fallo   | `retry: false` en sugerencias                                        | Multiplicar la carga cuando el backend ya está sufriendo |

Dos de esas decisiones se subieron al `QueryClient` global (`src/lib/query-client.ts`) porque el problema no es del buscador sino de la escala:

- **Reintentos:** el default de TanStack Query son 3 ante CUALQUIER error. Con un rate limit por IP, un 429 o un 5xx puntual se convierte en 4× la carga justo en el peor momento — reintentos como causa de que la caída siga. Ahora **4xx nunca se reintenta** (un 429 solo empeora repitiendo) y 5xx/red se reintenta **una** vez. El código se lee por duck typing sobre `statusCode` y no importando `CatalogoApiError`: `src/lib/` no debe depender de un módulo.
- **`refetchOnWindowFocus: false`:** el catálogo cambia por una sincronización del ERP, no de un segundo a otro. El default refresca TODAS las queries vivas al volver a la pestaña, lo que con muchos usuarios es un pico correlacionado (todos vuelven a la vez) que no aporta datos nuevos.

**Lo que la UI NO puede resolver, y hay que hacer en el API/infra:** todo lo anterior recorta las peticiones **por usuario**; nada de eso hace que 500 usuarios buscando "arroz" compartan trabajo, porque la caché de TanStack Query es por pestaña y se pierde al recargar. Eso solo lo da HTTP:

1. `Cache-Control: public, max-age=30, s-maxage=300, stale-while-revalidate=60` en `GET /products` (hoy no manda ningún header de caché, así que ni el navegador guarda nada).
2. Un CDN o reverse proxy delante del API. Con `s-maxage`, los términos populares se sirven desde el borde y el origen ve una fracción del tráfico. Es la medida con más impacto de toda la lista.
3. Rate limit **por endpoint**, no global por IP: 100 req/60s compartidos duelen detrás de un NAT corporativo o de operador móvil, donde muchos usuarios salen por la misma IP.
4. Índice para la búsqueda por nombre (`pg_trgm` con índice GIN si es `ILIKE '%…%'`): 50 rps de escaneo secuencial sobre ~9.000 filas es barato, pero deja de serlo con el catálogo creciendo.

**Consecuencias:**

- **Límite de 5 sugerencias = panel sin scroll.** Con la fila de alto fijo (76px: miniatura de 56 + `py-2.5`) la lista mide exactamente 380px y se lee entera de un vistazo. Para que ese alto sea fijo, el nombre va a **una línea** (`truncate`, no `line-clamp-2`): a dos líneas la fila pasa a 88px y las 5 ya no caben. El `max-h-[min(70svh,25rem)]` con `overflow` queda como válvula para un viewport corto de verdad (móvil en horizontal), no como modo normal.
- El panel es la primera superficie que muestra imágenes de producto en miniatura: `ProductoImagen` ganó `variant="miniatura"`, que reduce el placeholder al ícono. En un recuadro de 56px el texto de apoyo del placeholder de card no se lee y solo ensucia la fila.
- La normalización de la clave de caché toca el espaciado pero **no la caja**: si el backend distinguiera mayúsculas, bajarlas cambiaría los resultados, y los nombres del ERP vienen en alta sostenida. Queda por verificar contra el servicio vivo si la búsqueda es `ILIKE`; si lo es, bajar la caja de una vez multiplica el acierto de caché (propio y del CDN).
- El panel scrollea por dentro y lleva `data-lenis-prevent`: sin eso el scroll smooth global se queda el gesto y la lista no se puede recorrer.
- Un `Link` con `role="option"` es deliberado: mantiene clic medio y "abrir en pestaña nueva", y `tabIndex={-1}` deja el recorrido a las flechas desde el input. Los estados (cargando, error, vacío) van FUERA del `role="listbox"` — no son opciones.
- Al medir el chrome en runtime, cualquier cambio de altura en `AppHeader` o `MainNav` se propaga solo al hero y a los `sticky` del listado. Si alguna vez se añade una cuarta franja fija, tiene que entrar dentro del `div` medido o sumarse explícitamente, como ya hace la franja de contacto.

## 2026-09-01 — Hero y banners del homepage desde el bucket, por convención de URL (sin API)

**Contexto:** el hero y la franja publicitaria eran assets del repo (`public/photos/…`), así que cambiar la publicidad de la portada exigía un commit y un despliegue. Se pidió consumirlos del bucket: `site/hero/`, de donde se publica una pieza, y `site/banners/`, con las piezas que rotan (dos formatos por pieza, `-desktop` / `-mobile`).

**Decisión: la UI arma las URLs por CONVENCIÓN, no consultando un endpoint.** La primera versión de esta entrada documentaba lo contrario —un `GET /site/:carpeta` que listara la carpeta— y estaba equivocada: el API ya tiene el módulo `site-images` y su diseño es explícito en `site-images.service.ts` y `docs/site-images.md`, **"sin controlador HTTP a propósito… el frontend arma la URL por convención (`S3_PUBLIC_URL` + key fija)"**. Alinearse con eso, y no pedir un endpoint nuevo, es lo que hace esta entrada.

- **El slug nombra el PLACEMENT, no la campaña** (`home-desktop-1`, no `blackfriday-2026`). Esa es la pieza clave del diseño del backend y lo que hace que los nombres puedan vivir en el código sin perder el objetivo: la URL nunca cambia, mercadeo **sobreescribe** el objeto con `pnpm site-images:upload` (repo del API) y el sitio cambia sin desplegar. Los huecos se declaran en `modules/inicio/placements.ts` — el único archivo a tocar para añadir o quitar un banner.
- **`NEXT_PUBLIC_ASSETS_CDN_URL` en la UI** — mismo valor que `S3_PUBLIC_URL` en el `.env` del API. **Sin valor por defecto:** un default (el MinIO local, por ejemplo) haría que un entorno mal configurado apuntara en silencio a un bucket equivocado y diera 404 en todas las piezas, más difícil de diagnosticar que no mostrarlas. Sin la variable, la portada usa sus respaldos. Productos y logos NO la necesitan: llegan con URL completa desde el API.
- **Un `HEAD` por pieza para saber si está subida.** Sin endpoint no hay listado: la UI conoce el nombre del placement pero no si el archivo existe. Sin esa comprobación un placement vacío daría imagen rota y el hero no podría caer a su respaldo. Van cacheados con `revalidate: 300` — **los mismos 5 minutos del `Cache-Control` con que el API sube estas piezas**; recordar la respuesta más tiempo que el propio objeto solo retrasaría ver un reemplazo.
- **El hero se resuelve por lista de candidatos** (`HERO_SLUGS`, hoy `["home-desktop", "home"]`): se publica el primero que exista. Es lo más cerca de "la primera pieza de la carpeta" que se puede estar sin listar, conserva el efecto útil (dejar el arte de la próxima campaña subido y activarlo renombrando) y tolera que un operador haya usado el slug de ejemplo de la documentación del API. Las comprobaciones van en serie porque la primera acierta casi siempre; los banners, en paralelo, porque son placements independientes.
- **Estas lecturas se hacen en el SERVIDOR, al revés que el resto de las secciones del home.** El hero es el LCP: descubrirlo tras hidratar significa pedir la imagen más grande del sitio en la segunda vuelta y pintar un reemplazo a la vista. Se resuelven en `page.tsx` y bajan como props; al ir cacheadas, `/` sigue prerenderizada. **Verificado con `pnpm build`: `/` sale `○ (Static)`.**
- **Sin respaldo local, y eso fue una corrección.** La primera versión caía a `public/photos/hero-alimentos.png`, hasta que se vio que la rama `feature/08-imagenes-productos` **borra ese archivo** al mover los assets al bucket: el respaldo habría dejado el hero roto justo en el caso que pretendía cubrir. Ahora, sin pieza subida, la sección se dibuja sin imagen (el copy es negro sobre fondo claro, legible y con el mismo alto) y los banners no se dibujan — una franja publicitaria vacía no comunica nada. Ningún fallo de red se propaga (`resolverImagenSitio` devuelve `null`). El precio es que el hero **depende** de que la pieza exista en el bucket.

**Consecuencias:**

- **El `alt` de los banners vive en el CÓDIGO** (`placements.ts`), no en el bucket: sin API no hay metadato que acompañe al objeto. Es la costura incómoda de este diseño — cambiar el arte no requiere desplegar, cambiar su texto alternativo sí. Y el arte lleva el mensaje horneado, así que ese texto es lo único que un lector de pantalla recibe de la pieza; hoy es un respaldo genérico y hay que transcribir el texto real de cada creativo.
- **Añadir un tercer banner sí requiere despliegue**, porque es un placement nuevo. Cambiar los dos existentes, no. Si mercadeo necesita un número variable de piezas, ahí sí hace falta el endpoint de listado que este cambio descartó.
- El módulo `inicio` dejó de ser solo presentación: ahora tiene `placements.ts`, `types.ts` y `server/`. Su barrel **no** re-exporta `server/queries.ts` (importa `server-only` y el barrel llega a `config/modules.ts`, que sí viaja al cliente); las rutas lo importan por deep path.
- `docs/brand/imagenes.md` sigue siendo la fuente de las MEDIDAS, pero la ubicación ya no es `public/`: es el bucket, y el nombre del archivo tiene que ser el slug del placement o el sitio no lo encuentra.
- **`images.remotePatterns` se DERIVA de `NEXT_PUBLIC_ASSETS_CDN_URL`** (`patronDelBucket()` en `next.config.ts`), en vez del comodín `{ protocol: "https", hostname: "**" }` que pasaba cualquier host. Así mover el bucket a un Custom Domain no exige recordar un segundo archivo — el fallo típico, con `/_next/image` devolviendo 400 sin explicación. Sin la variable se cae al comodín, para no dejar sin imágenes a un entorno a medio configurar. El pattern cubre también las imágenes de producto y los logos, que salen del mismo bucket.
- **Verificado contra el bucket real** (R2, dominio público `pub-….r2.dev`, que sirve la RAÍZ del bucket sin su nombre en la ruta): las cinco piezas responden 200 en `image/webp` — `site/hero/home-desktop.webp` (399 KB) y `site/banners/home-{desktop,mobile}-{1,2}.webp`. Ojo con el orden del nombre: **el formato va ANTES del índice** (`home-desktop-1`, no `home-1-desktop`), que es lo contrario de lo que sugería la primera lectura del requisito. r2.dev no permite listar, así que un cambio de nombres solo se detecta porque la pieza deja de aparecer.
- Descartado en el camino: extraer el transporte del API público (`apiGet`, `CatalogoApiError`) a `src/lib/api/`. Se hizo mientras esto iba contra un endpoint y se revirtió al desaparecer el segundo consumidor — `modules/catalogo/api/` queda como estaba.

## 2026-09-03 — Cerrar el ciclo de autenticación: base propia, registro de clientes, foto de Entra y bienvenida

**Contexto:** el andamiaje de Better Auth existía desde el arranque del proyecto, pero no había forma de iniciar sesión de verdad: `DATABASE_URL` apuntaba a un Postgres inexistente (`localhost:5432`), el registro estaba cerrado por configuración y el ingreso con Entra no traía perfil. Se pidió cerrar el ciclo completo para las dos audiencias, sin exponer ningún token en almacenamiento del navegador.

**Decisión:**

- **Base de sesiones `jdh_auth`, en el Postgres del API.** Mismo contenedor (`jdh-catalogo-postgres`, puerto 5435), base distinta. Se descartó un esquema `auth` dentro de `jdh_catalogo` —permitiría JOINs, pero un `prisma migrate reset` del API borra la base entera y se llevaría sesiones y contraseñas— y también un contenedor propio, que añade un servicio que mantener a cambio de un aislamiento que la base separada ya da. La crea `docker/postgres/init/01-crear-base-auth.sh` en el repo del API; el esquema lo aplica `pnpm auth:migrate`.

- **Auto-registro ABIERTO, invirtiendo el `disableSignUp: true` original.** La objeción de entonces —nadie demuestra en un formulario que es tal cliente del ERP— sigue en pie, pero se resuelve donde de verdad importa, que es el PRECIO y no la existencia de la cuenta: una cuenta nueva nace sin `clienteId` ni `listaPrecioId` (ambos `input: false`, solo escribibles vía `internalAdapter`), así que `getPriceContext()` la trata como pública y ve la misma lista que un anónimo. Registrarse da identidad (favoritos, listas, pedidos); vincularla al ERP, y con ello abrir precios negociados, sigue siendo exclusivo del panel de administración. **Ésta es la invariante que no se puede romper al tocar el registro.**

- **La política de contraseña vive en `lib/auth/registro.ts` y la aplica una Server Action, no el cliente.** Better Auth solo sabe imponer largo mínimo y máximo; si el formulario llamara a `/api/auth/sign-up/email` directamente, un `fetch` a mano se saltaría composición, lista de bloqueo y la regla de no derivarla del nombre o del correo. `lib/auth/acciones.ts` valida con el MISMO esquema zod que pinta los errores en pantalla, así que el mensaje y la regla no pueden desincronizarse. La lista de bloqueo exige que el término **domine** la contraseña (≥60% de su longitud), no que aparezca: rechazar por subcadena tumbaba `Bodega2026xy!!QwErTy` —20 caracteres, cuatro familias— por llevar "qwerty" dentro. El mismo criterio alimenta el medidor de fuerza, para que no diga "muy fuerte" sobre algo que el formulario va a rechazar.

- **La foto de Entra se sirve desde `/api/perfil/foto`, no como data URL en `user.image`.** Better Auth sabe traerla (`disableProfilePhoto: false`) pero la guarda en base64 en la fila del usuario, y `setCookieCache` serializa la fila CRUDA (`parseUserOutput`), no lo que devuelve `customSession`: no hay forma de filtrarla después. Una foto de 120×120 ronda los 10 KB, la cookie de sesión se parte en trozos (`MAX_COOKIE_SIZE` = 4050 B) y esos trozos viajan en cada petición que atraviesa el matcher de `proxy.ts`. En su lugar `user.image` guarda la ruta fija (18 caracteres) y el handler resuelve los bytes contra Graph con el access token de `auth.api.getAccessToken` —que refresca solo, porque hay `offline_access`— y los cachea un día en el navegador. La ruta no recibe identificador: sirve la foto de QUIEN PIDE, resuelta desde su cookie, así que no se pueden enumerar fotos ajenas. Sin foto en el directorio, sin cuenta de Microsoft o con Graph caído responde 404 y el avatar cae a iniciales, que es la respuesta correcta para los tres casos.

- **Límite de peticiones con `storage: "database"`.** El contador en memoria por defecto es POR PROCESO: con varias réplicas detrás de un balanceador, el atacante multiplica sus intentos por el número de instancias. 5 intentos/minuto en `/sign-in/email`, 3 en `/sign-up/email`. La tabla `rateLimit` la crea `pnpm auth:migrate`, y por eso `scripts/auth-schema.ts` tiene que declarar también esta opción.

- **`--primary` se INVIERTE en tema oscuro.** Era `var(--color-ink)` en ambos temas, igual que `--background` en oscuro: el botón primario era literalmente del color del fondo, visible solo por su texto. Se introdujo el par `--color-primary-surface` / `--color-on-primary-surface`, propio y no un alias de `--color-ink*`, porque el chrome negro sí se queda negro en los dos temas y el botón primario no puede. De paso se corrigió `--color-border-strong` en oscuro: DESIGN.md §2.3 lo define con MENOS presencia que `--color-border` (08 vs 12) y se había replicado literal, dejando los controles delineados a ~1.1:1 contra el lienzo, por debajo del 3:1 que exige WCAG 2.2 SC 1.4.11 para el límite visual de un componente. Ahora es `--neutral-500` (5.3:1). **Pendiente ratificar ambas correcciones en DESIGN.md §2.3.**

- **Bienvenida en dos piezas.** `WelcomeCurtain` es la animación del salto al catálogo: se dispara con `?bienvenida=1` —en la URL y no en `sessionStorage`, porque el ingreso con Entra sale del navegador y vuelve por una redirección de Microsoft, y `callbackURL` es lo único que sobrevive al viaje—. `WelcomeBanner` es el saludo persistente y descartable. La cortina es `aria-hidden` (cromo de transición) y bajo `prefers-reduced-motion` no se degrada a una versión estática: se salta entera, porque lo que hay que anunciar —quién eres y qué precios estás viendo— lo dice el banner, que sí es texto real en el documento.

- **El banner se monta DENTRO del bloque medido de `CatalogoChrome`.** El primer slide de la portada mide `100svh - var(--catalogo-chrome-height)` y esa variable la fija un `ResizeObserver` sobre ese bloque: metiendo la franja ahí, aparecer y descartarse recalculan la altura del hero solos, sin sumar un número a mano. Es exactamente la regla que ya pedía la entrada del 2026-08-30 ("si alguna vez se añade una cuarta franja fija, tiene que entrar dentro del `div` medido"). El descarte se guarda por usuario con `useSyncExternalStore` sobre `localStorage` —el primitivo correcto para leer un almacén externo sin desajuste de hidratación ni `setState` dentro de un efecto—, y de regalo queda sincronizado entre pestañas.

- **Tras ingresar, todo el mundo aterriza en `/`,** también el personal JDH, que antes caía en `/admin`. El catálogo es el producto; administración es una herramienta a la que se entra a propósito, y pasa a ser una entrada explícita del menú de perfil condicionada a `admin:access` — sin el permiso no se dibuja, porque `/admin` responde 404 a quien no lo tiene y anunciarla filtraría que existe.

- **`/ingreso` gana un conmutador y reordena su marca.** El conmutador ingresar/registrarse son dos ENLACES con el modo en la URL, no estado de React: es enlazable, sobrevive a una recarga y deja la página como Server Component que decide qué formulario renderizar. El bloque de proveedores cambia con el modo — al ingresar se ofrece Entra ID, que es como entra el personal JDH; al registrarse no, porque una cuenta de JDH la aprovisiona el directorio y lo que corresponde ahí son los proveedores externos. El lockup se mueve del panel de tinta a la columna de credenciales, y su hueco en el panel lo ocupa la salida al catálogo (`BackToCatalog`, delineada sobre tinta con un velo para conservar contraste sobre cualquiera de las tres fotografías).

**Consecuencias:**

- **Verificado de extremo a extremo contra el Postgres real:** alta, sesión, cierre, ingreso, clave incorrecta (401 `INVALID_EMAIL_OR_PASSWORD`), rutas protegidas (307 a `/ingreso?redirectTo=…`) y públicas (200). Las cookies salen `HttpOnly; SameSite=Lax`. La URL de autorización de Entra apunta al tenant correcto con `scope=openid profile email User.Read offline_access`, `prompt=select_account` y PKCE `S256`. La política de contraseña se probó con diez casos, incluidos los de acento (`Contraseña123` cae por normalización NFD) y los derivados del nombre o del correo.
- **`pnpm build` mantiene `/` y `/productos` como `○ (Static)`.** `WelcomeCurtain` usa `useSearchParams` y va envuelto en `Suspense` justamente por eso: sin ese límite, el hook desde el layout arrastraría a renderizado en cliente TODAS las rutas del grupo.
- **Nada de la sesión pasa por `localStorage`.** Lo único que Better Auth escribe ahí es `better-auth.message`, un ping entre pestañas cuyo contenido es `{ event: "session", data: { trigger } }` — sin token ni datos de usuario (verificado en `client/session-refresh.mjs`). El token de sesión **sí** viaja en el cuerpo JSON de las respuestas de `sign-in`/`sign-up`: es inherente a Better Auth 1.6.25, no existe opción para omitirlo, y el cliente no lo persiste en ningún sitio; la autoridad es siempre la cookie.
- **El callback `http://localhost:3000/api/auth/callback/microsoft` tiene que estar registrado** como Redirect URI (tipo Web) en el App Registration de Entra, y su equivalente para cada entorno desplegado. Es el único paso del ciclo que no se puede verificar sin credenciales reales; si falta, Microsoft devuelve `AADSTS50011`.
- **Google y Microsoft externos son MAQUETA.** Están `disabled` de verdad, con el motivo escrito debajo en vez de comunicado solo por la opacidad. No se reutilizó el proveedor `microsoft` existente porque valida el tenant de JDH (`assertJdhTenant`) y rechazaría justo a la audiencia que ese bloque dice atender: conectarlos exige proveedores nuevos en `socialProviders`.
- **Sin infraestructura de correo quedan dos costuras abiertas:** `requireEmailVerification` está en `false` (exigirlo dejaría a toda cuenta nueva sin poder entrar) y el registro **sí revela** si un correo ya existe. Es un oráculo de enumeración conocido y aceptado: la alternativa que preserva el secreto —aceptar el alta en silencio y avisar por correo al dueño de la dirección— necesita ese envío. Cambiar ambas cosas a la vez cuando exista.
- Cambiar `--primary` afecta a todo lo que pinta `bg-primary`: chips seleccionados, badges, `JdhCard` en tinta, `CtaBanner`, checkbox y radio marcados, `InitialsAvatar` en tono `ink`. En oscuro ahora se invierten, que es el comportamiento correcto de un tema monocromo. Las reglas `dark:border-[var(--color-ink-border)]` que compensaban una tarjeta negra sobre fondo negro quedan como no-op inofensivos: sobre una superficie blanca ese borde blanco no se ve, y la tarjeta ya no necesita ayuda para separarse del fondo.
- `InitialsAvatar` gana un tercer tono, `on-ink`, para cuando el avatar mismo se apoya sobre el chrome negro (menú de perfil, cortina). `ink` seguía siendo `bg-primary`, que sobre tinta era invisible en tema claro.
