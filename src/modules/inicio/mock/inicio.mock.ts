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
    categoriaSlug: "aceites-y-grasas",
    marca: "Oleaginosas del Valle",
    precioCentavos: 15890000,
    unidadVenta: "Caja × 12 botellas de 1 L",
    presentacion: "Caja",
    imagen: "/photos/productos/aceite-soya.jpg",
    descripcionCorta: "Aceite vegetal refinado para cocina institucional.",
    descripcionLarga:
      "Aceite vegetal refinado de alta estabilidad para fritura y cocción en operaciones de alto volumen. Punto de humo alto, sabor neutro y rendimiento constante por turno, ideal para freidoras industriales y planchas.",
    detallesEmpaque: [
      "Presentación: caja por 12 botellas de 1 L",
      "Código de producto: JDH-ACE-1001",
      "Peso neto: 12 kg por caja",
      "Conservar en lugar fresco y seco, lejos de la luz directa",
    ],
    badge: "Más vendido",
  },
  {
    id: "p-002",
    nombre: "Arroz blanco premium",
    categoria: "Granos y cereales",
    categoriaSlug: "granos-y-cereales",
    marca: "Roa",
    precioCentavos: 9850000,
    unidadVenta: "Bulto 25 kg",
    presentacion: "Bulto",
    imagen: "/photos/productos/arroz-blanco.jpg",
    descripcionCorta: "Arroz de primera calidad, rendimiento constante.",
    descripcionLarga:
      "Arroz blanco de primera calidad con selección óptica y control de humedad en cada lote. Empaque hermético que protege el grano durante el almacenamiento; rendimiento constante y cocción pareja para servicios de alimentación de alto volumen.",
    detallesEmpaque: [
      "Presentación: bulto por 25 kg",
      "Código de producto: JDH-GRA-2002",
      "Peso neto: 25 kg por bulto",
      "Almacenar en lugar fresco, seco y ventilado",
    ],
  },
  {
    id: "p-003",
    nombre: "Leche entera UHT",
    categoria: "Lácteos",
    categoriaSlug: "lacteos",
    marca: "Alpina",
    precioCentavos: 5640000,
    unidadVenta: "Caja × 12 unidades de 1 L",
    presentacion: "Caja",
    imagen: "/photos/productos/leche-uht.jpg",
    descripcionCorta: "Leche UHT con cadena de frío verificada.",
    descripcionLarga:
      "Leche entera sometida a tratamiento UHT que conserva sus propiedades sin refrigeración hasta la apertura. Cadena de frío verificada desde la planta hasta la entrega; ideal para cafeterías, hoteles y servicios de alimentación.",
    detallesEmpaque: [
      "Presentación: caja por 12 unidades de 1 L",
      "Código de producto: JDH-LAC-3003",
      "Vida útil: 6 meses sin abrir",
      "Refrigerar después de abrir",
    ],
    badge: "Nuevo",
  },
  {
    id: "p-004",
    nombre: "Atún en agua",
    categoria: "Enlatados y conservas",
    categoriaSlug: "enlatados-y-conservas",
    marca: "Conservas del Caribe",
    precioCentavos: 14880000,
    unidadVenta: "Caja × 48 latas de 170 g",
    presentacion: "Caja",
    imagen: "/photos/productos/atun-agua.jpg",
    descripcionCorta: "Atún en agua con estándar de exportación.",
    descripcionLarga:
      "Atún en agua procesado con estándares de exportación: llenado en caliente y sellado hermético que garantiza larga vida útil sin conservantes adicionales. Stock estable y porciones controladas para despensa institucional.",
    detallesEmpaque: [
      "Presentación: caja por 48 latas de 170 g",
      "Código de producto: JDH-ENL-6006",
      "Vida útil: 3 años",
      "Almacenar en lugar fresco y seco",
    ],
  },
  {
    id: "p-005",
    nombre: "Gaseosa cola 1.5 L",
    categoria: "Bebidas",
    categoriaSlug: "bebidas",
    marca: "Coca-Cola",
    precioCentavos: 4320000,
    unidadVenta: "Caja × 12 botellas",
    presentacion: "Caja",
    imagen: "/photos/productos/gaseosa-cola.jpg",
    descripcionCorta: "Gaseosa cola en presentación food service.",
    descripcionLarga:
      "Gaseosa cola de alta rotación en presentación institucional por caja. Disponibilidad constante en el canal y demanda garantizada en restaurantes, cafeterías y eventos.",
    detallesEmpaque: [
      "Presentación: caja por 12 botellas de 1.5 L",
      "Código de producto: JDH-BEB-5005",
      "Conservar en lugar fresco; no exponer al sol",
      "Servir frío para mejor experiencia",
    ],
    badge: "Oferta",
  },
  {
    id: "p-006",
    nombre: "Detergente líquido multiusos",
    categoria: "Limpieza y aseo",
    categoriaSlug: "limpieza-y-aseo",
    marca: "Fabuloso",
    precioCentavos: 7150000,
    unidadVenta: "Caja × 4 galones",
    presentacion: "Galón",
    imagen: "/photos/productos/detergente-liquido.jpg",
    descripcionCorta: "Detergente concentrado para operaciones exigentes.",
    descripcionLarga:
      "Detergente líquido concentrado de uso institucional con alto rendimiento por galón. Fórmula que reduce el costo por operación de limpieza y cumple estándares de higiene para cocinas, baños y áreas de servicio.",
    detallesEmpaque: [
      "Presentación: caja por 4 galones",
      "Código de producto: JDH-LIM-8008",
      "Peso neto: 15.1 kg por caja",
      "Mantener fuera del alcance de los niños",
    ],
  },
  {
    id: "p-007",
    nombre: "Galletas surtidas institucionales",
    categoria: "Snacks y confitería",
    categoriaSlug: "snacks-y-confiteria",
    marca: "Colombina",
    precioCentavos: 3890000,
    unidadVenta: "Caja × 24 paquetes",
    presentacion: "Caja",
    imagen: "/photos/productos/galletas-surtidas.jpg",
    descripcionCorta: "Galletas surtidas en empaque individual.",
    descripcionLarga:
      "Galletas surtidas en empaques individuales que facilitan la venta unitaria y el control de porción. Alta rotación en puntos de venta y dispensadores; presentación que optimiza el espacio de exhibición.",
    detallesEmpaque: [
      "Presentación: caja por 24 paquetes individuales",
      "Código de producto: JDH-SNA-7007",
      "Vida útil: 9 meses",
      "Conservar en lugar fresco y seco",
    ],
    badge: "Nuevo",
  },
  {
    id: "p-008",
    nombre: "Panela pulverizada",
    categoria: "Granos y cereales",
    categoriaSlug: "granos-y-cereales",
    marca: "Flor Huila",
    precioCentavos: 6420000,
    unidadVenta: "Bulto 20 kg",
    presentacion: "Bulto",
    imagen: "/photos/productos/panela-pulverizada.jpg",
    descripcionCorta: "Panela pulverizada de origen tradicional.",
    descripcionLarga:
      "Panela pulverizada obtenida de jugo de caña concentrado en trapiche, con proceso tradicional de cocción. Presentación a granel ideal para producción de bebidas, repostería y servicios de alimentación.",
    detallesEmpaque: [
      "Presentación: bulto por 20 kg",
      "Código de producto: JDH-GRA-2008",
      "Peso neto: 20 kg por bulto",
      "Conservar en lugar fresco y seco",
    ],
  },
  {
    id: "p-009",
    nombre: "Agua natural 600 ml",
    categoria: "Bebidas",
    categoriaSlug: "bebidas",
    marca: "Postobón",
    precioCentavos: 2160000,
    unidadVenta: "Paquete × 12 botellas",
    presentacion: "Paquete",
    imagen: "/photos/productos/agua-natural.jpg",
    descripcionCorta: "Agua natural en presentación por paquete.",
    descripcionLarga:
      "Agua natural purificada en presentación por paquete para puntos de venta y servicio institucional. Alta rotación y disponibilidad constante en el canal.",
    detallesEmpaque: [
      "Presentación: paquete por 12 botellas de 600 ml",
      "Código de producto: JDH-BEB-5009",
      "Conservar en lugar fresco",
      "Consumir antes de la fecha impresa",
    ],
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
