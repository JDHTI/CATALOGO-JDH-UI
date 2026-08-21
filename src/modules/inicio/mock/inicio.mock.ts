import type {
  CategoriaDestacada,
  Marca,
  ProductoDestacado,
  Proveedor,
} from "../types"

/**
 * Dataset del homepage. Precios de LISTA PÚBLICA de ejemplo, en centavos de
 * COP — el homepage no lee sesión ni PriceContext (es compartido por
 * anónimos y clientes), así que muestra solo estos valores de referencia.
 * Cuando exista backend, estas colecciones se reemplazan por queries con la
 * misma forma.
 *
 * Las fotos de producto (public/photos/productos/) se obtuvieron vía
 * Openverse con licencia comercial CC — ver public/photos/CREDITS.md para la
 * atribución.
 */
export const productosDestacados: ProductoDestacado[] = [
  {
    id: "p-001",
    nombre: "Aceite de soya refinado",
    categoria: "Aceites y grasas",
    precioCentavos: 15890000,
    unidadVenta: "Caja × 12 botellas de 1 L",
    imagen: "/photos/productos/aceite-soya.jpg",
    badge: "Más vendido",
  },
  {
    id: "p-002",
    nombre: "Arroz blanco premium",
    categoria: "Granos y cereales",
    precioCentavos: 9850000,
    unidadVenta: "Bulto 25 kg",
    imagen: "/photos/productos/arroz-blanco.jpg",
  },
  {
    id: "p-003",
    nombre: "Leche entera UHT",
    categoria: "Lácteos",
    precioCentavos: 5640000,
    unidadVenta: "Caja × 12 unidades de 1 L",
    imagen: "/photos/productos/leche-uht.jpg",
    badge: "Nuevo",
  },
  {
    id: "p-004",
    nombre: "Atún en agua",
    categoria: "Enlatados y conservas",
    precioCentavos: 14880000,
    unidadVenta: "Caja × 48 latas de 170 g",
    imagen: "/photos/productos/atun-agua.jpg",
  },
  {
    id: "p-005",
    nombre: "Gaseosa cola 1.5 L",
    categoria: "Bebidas",
    precioCentavos: 4320000,
    unidadVenta: "Caja × 12 botellas",
    imagen: "/photos/productos/gaseosa-cola.jpg",
    badge: "Oferta",
  },
  {
    id: "p-006",
    nombre: "Detergente líquido multiusos",
    categoria: "Limpieza y aseo",
    precioCentavos: 7150000,
    unidadVenta: "Caja × 4 galones",
    imagen: "/photos/productos/detergente-liquido.jpg",
  },
  {
    id: "p-007",
    nombre: "Galletas surtidas institucionales",
    categoria: "Snacks y confitería",
    precioCentavos: 3890000,
    unidadVenta: "Caja × 24 paquetes",
    imagen: "/photos/productos/galletas-surtidas.jpg",
    badge: "Nuevo",
  },
  {
    id: "p-008",
    nombre: "Panela pulverizada",
    categoria: "Granos y cereales",
    precioCentavos: 6420000,
    unidadVenta: "Bulto 20 kg",
    imagen: "/photos/productos/panela-pulverizada.jpg",
  },
  {
    id: "p-009",
    nombre: "Agua natural 600 ml",
    categoria: "Bebidas",
    precioCentavos: 2160000,
    unidadVenta: "Paquete × 12 botellas",
    imagen: "/photos/productos/agua-natural.jpg",
    badge: "Oferta",
  },
]

export const categoriasDestacadas: CategoriaDestacada[] = [
  {
    slug: "aceites-y-grasas",
    nombre: "Aceites y grasas",
    descripcion: "Aceites, mantecas y grasas para cocina industrial.",
    icono: "droplets",
  },
  {
    slug: "granos-y-cereales",
    nombre: "Granos y cereales",
    descripcion: "Arroz, frijol, lentejas y harinas a granel.",
    icono: "wheat",
  },
  {
    slug: "lacteos",
    nombre: "Lácteos",
    descripcion: "Leches UHT, quesos y derivados con cadena de frío.",
    icono: "milk",
  },
  {
    slug: "carnicos-y-frios",
    nombre: "Cárnicos y fríos",
    descripcion: "Embutidos, carnes frías y productos de mostrador.",
    icono: "meat",
  },
  {
    slug: "bebidas",
    nombre: "Bebidas",
    descripcion: "Gaseosas, aguas y jugos para food service.",
    icono: "cup-soda",
  },
  {
    slug: "enlatados-y-conservas",
    nombre: "Enlatados y conservas",
    descripcion: "Atún, verduras y conservas con estándar exportación.",
    icono: "can",
  },
  {
    slug: "snacks-y-confiteria",
    nombre: "Snacks y confitería",
    descripcion: "Galletas, snacks y dulces para tiendas y cafeterías.",
    icono: "cookie",
  },
  {
    slug: "limpieza-y-aseo",
    nombre: "Limpieza y aseo",
    descripcion: "Detergentes, desinfectantes y papel institucional.",
    icono: "spray-can",
  },
  {
    slug: "frutas-y-verduras",
    nombre: "Frutas y verduras",
    descripcion: "Frescos seleccionados para operaciones diarias.",
    icono: "apple",
  },
  {
    slug: "congelados",
    nombre: "Congelados",
    descripcion: "Proteínas y vegetales con cadena de frío garantizada.",
    icono: "snowflake",
  },
]

export const proveedores: Proveedor[] = [
  {
    id: "prov-001",
    nombre: "Alimentos La Campiña",
    slogan: "Granos y cereales con trazabilidad, del campo a tu bodega.",
    descripcion:
      "Granos y cereales de origen nacional con trazabilidad completa.",
  },
  {
    id: "prov-002",
    nombre: "Oleaginosas del Valle",
    slogan: "Aceites certificados para cocinas profesionales.",
    descripcion:
      "Aceites y grasas vegetales certificados para uso institucional.",
  },
  {
    id: "prov-003",
    nombre: "Lácteos del Norte",
    slogan: "Cadena de frío garantizada, de la planta a tu bodega.",
    descripcion:
      "Leche y derivados con cadena de frío desde la planta hasta tu bodega.",
  },
  {
    id: "prov-004",
    nombre: "Bebidas Andinas",
    slogan: "Hidratación y gaseosas para food service y retail.",
    descripcion:
      "Portafolio de hidratación y gaseosas para food service y retail.",
  },
  {
    id: "prov-005",
    nombre: "Higiene Total",
    slogan: "Limpieza profesional para operaciones exigentes.",
    descripcion:
      "Soluciones de limpieza profesional para operaciones exigentes.",
  },
  {
    id: "prov-006",
    nombre: "Conservas del Caribe",
    slogan: "Enlatados con estándar de exportación.",
    descripcion: "Enlatados y conservas con estándares de exportación.",
  },
]

/**
 * Marcas institucionales típicas del sector — banner grande de SOLO logos
 * (30 marcas = grilla 5×6 completa). Los logos viven en public/photos/marcas/
 * (descargados vía Clearbit/favicon de Google — scripts/fetch-brand-logos.py).
 */
export const marcasDestacadas: Marca[] = [
  { id: "alpina", nombre: "Alpina", imagen: "/photos/marcas/alpina.png" },
  { id: "rica", nombre: "Rica", imagen: "/photos/marcas/rica.png" },
  {
    id: "crem-helado",
    nombre: "Crem Helado",
    imagen: "/photos/marcas/crem-helado.png",
  },
  { id: "zenu", nombre: "Zenú", imagen: "/photos/marcas/zenu.png" },
  { id: "pietran", nombre: "Pietrán", imagen: "/photos/marcas/pietran.png" },
  { id: "noel", nombre: "Noel", imagen: "/photos/marcas/noel.png" },
  { id: "tosh", nombre: "Tosh", imagen: "/photos/marcas/tosh.png" },
  { id: "oreo", nombre: "Oreo", imagen: "/photos/marcas/oreo.png" },
  {
    id: "aguila-roja",
    nombre: "Café Águila Roja",
    imagen: "/photos/marcas/aguila-roja.png",
  },
  { id: "nestle", nombre: "Nestlé", imagen: "/photos/marcas/nestle.png" },
  { id: "maggi", nombre: "Maggi", imagen: "/photos/marcas/maggi.png" },
  { id: "heinz", nombre: "Heinz", imagen: "/photos/marcas/heinz.png" },
  {
    id: "delmonte",
    nombre: "Del Monte",
    imagen: "/photos/marcas/delmonte.png",
  },
  { id: "quaker", nombre: "Quaker", imagen: "/photos/marcas/quaker.png" },
  { id: "oetker", nombre: "Oetker", imagen: "/photos/marcas/oetker.png" },
  { id: "pringles", nombre: "Pringles", imagen: "/photos/marcas/pringles.png" },
  { id: "bimbo", nombre: "Bimbo", imagen: "/photos/marcas/bimbo.png" },
  { id: "danone", nombre: "Danone", imagen: "/photos/marcas/danone.png" },
  { id: "lactalis", nombre: "Lactalis", imagen: "/photos/marcas/lactalis.png" },
  { id: "yoplait", nombre: "Yoplait", imagen: "/photos/marcas/yoplait.png" },
  {
    id: "campbells",
    nombre: "Campbell's",
    imagen: "/photos/marcas/campbells.png",
  },
  { id: "lipton", nombre: "Lipton", imagen: "/photos/marcas/lipton.png" },
  { id: "arcor", nombre: "Arcor", imagen: "/photos/marcas/arcor.png" },
  { id: "nutella", nombre: "Nutella", imagen: "/photos/marcas/nutella.png" },
  {
    id: "coca-cola",
    nombre: "Coca-Cola",
    imagen: "/photos/marcas/coca-cola.png",
  },
  { id: "pepsi", nombre: "Pepsi", imagen: "/photos/marcas/pepsi.png" },
  { id: "corona", nombre: "Corona", imagen: "/photos/marcas/corona.png" },
  { id: "colgate", nombre: "Colgate", imagen: "/photos/marcas/colgate.png" },
  { id: "lays", nombre: "Lay's", imagen: "/photos/marcas/lays.png" },
  { id: "doritos", nombre: "Doritos", imagen: "/photos/marcas/doritos.png" },
]
