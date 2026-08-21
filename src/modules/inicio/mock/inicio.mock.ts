import type { CategoriaDestacada, ProductoDestacado, Proveedor } from "../types"

/**
 * Dataset del homepage. Precios de LISTA PÚBLICA de ejemplo, en centavos de
 * COP — el homepage no lee sesión ni PriceContext (es compartido por
 * anónimos y clientes), así que muestra solo estos valores de referencia.
 * Cuando exista backend, estas colecciones se reemplazan por queries con la
 * misma forma.
 */
export const productosDestacados: ProductoDestacado[] = [
  {
    id: "p-001",
    nombre: "Aceite de soya refinado",
    categoria: "Aceites y grasas",
    precioCentavos: 15890000,
    unidadVenta: "Caja × 12 botellas de 1 L",
    badge: "Más vendido",
  },
  {
    id: "p-002",
    nombre: "Arroz blanco premium",
    categoria: "Granos y cereales",
    precioCentavos: 9850000,
    unidadVenta: "Bulto 25 kg",
  },
  {
    id: "p-003",
    nombre: "Leche entera UHT",
    categoria: "Lácteos",
    precioCentavos: 5640000,
    unidadVenta: "Caja × 12 unidades de 1 L",
    badge: "Nuevo",
  },
  {
    id: "p-004",
    nombre: "Atún en agua",
    categoria: "Enlatados y conservas",
    precioCentavos: 14880000,
    unidadVenta: "Caja × 48 latas de 170 g",
  },
  {
    id: "p-005",
    nombre: "Gaseosa cola 1.5 L",
    categoria: "Bebidas",
    precioCentavos: 4320000,
    unidadVenta: "Caja × 12 botellas",
    badge: "Oferta",
  },
  {
    id: "p-006",
    nombre: "Detergente líquido multiusos",
    categoria: "Limpieza y aseo",
    precioCentavos: 7150000,
    unidadVenta: "Caja × 4 galones",
  },
  {
    id: "p-007",
    nombre: "Galletas surtidas institucionales",
    categoria: "Snacks y confitería",
    precioCentavos: 3890000,
    unidadVenta: "Caja × 24 paquetes",
    badge: "Nuevo",
  },
  {
    id: "p-008",
    nombre: "Panela pulverizada",
    categoria: "Granos y cereales",
    precioCentavos: 6420000,
    unidadVenta: "Bulto 20 kg",
  },
  {
    id: "p-009",
    nombre: "Agua natural 600 ml",
    categoria: "Bebidas",
    precioCentavos: 2160000,
    unidadVenta: "Paquete × 12 botellas",
    badge: "Oferta",
  },
]

export const categoriasDestacadas: CategoriaDestacada[] = [
  {
    slug: "aceites-y-grasas",
    nombre: "Aceites y grasas",
    descripcion: "Aceites vegetales, mantecas y grasas para cocina industrial.",
    icono: "droplets",
  },
  {
    slug: "granos-y-cereales",
    nombre: "Granos y cereales",
    descripcion:
      "Arroz, frijol, lentejas y harinas en presentaciones a granel.",
    icono: "wheat",
  },
  {
    slug: "lacteos",
    nombre: "Lácteos",
    descripcion:
      "Leches UHT, quesos y derivados con cadena de frío garantizada.",
    icono: "milk",
  },
  {
    slug: "bebidas",
    nombre: "Bebidas",
    descripcion:
      "Gaseosas, aguas y jugos para restaurantes, hoteles y eventos.",
    icono: "cup-soda",
  },
  {
    slug: "limpieza-y-aseo",
    nombre: "Limpieza y aseo",
    descripcion: "Detergentes, desinfectantes y papel institucional.",
    icono: "spray-can",
  },
  {
    slug: "snacks-y-confiteria",
    nombre: "Snacks y confitería",
    descripcion: "Galletas, snacks y dulces para tiendas y cafeterías.",
    icono: "cookie",
  },
]

export const proveedores: Proveedor[] = [
  {
    id: "prov-001",
    nombre: "Alimentos La Campiña",
    descripcion:
      "Granos y cereales de origen nacional con trazabilidad completa.",
  },
  {
    id: "prov-002",
    nombre: "Oleaginosas del Valle",
    descripcion:
      "Aceites y grasas vegetales certificados para uso institucional.",
  },
  {
    id: "prov-003",
    nombre: "Lácteos del Norte",
    descripcion:
      "Leche y derivados con cadena de frío desde la planta hasta tu bodega.",
  },
  {
    id: "prov-004",
    nombre: "Bebidas Andinas",
    descripcion:
      "Portafolio de hidratación y gaseosas para food service y retail.",
  },
  {
    id: "prov-005",
    nombre: "Higiene Total",
    descripcion:
      "Soluciones de limpieza profesional para operaciones exigentes.",
  },
  {
    id: "prov-006",
    nombre: "Conservas del Caribe",
    descripcion: "Enlatados y conservas con estándares de exportación.",
  },
]
