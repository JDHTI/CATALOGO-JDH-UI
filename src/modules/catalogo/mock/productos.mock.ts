import type {
  Paginado,
  Producto,
  ProductosQueryParams,
  Proveedor,
} from "../types"
import { aPaginaProductos, aProducto, type ProductoDto } from "../schemas/api"
import { CatalogoApiError } from "../api/errors"

/**
 * Mock del API de productos (jdh-catalogo-api) mientras el backend termina.
 * Replica la SEMÁNTICA confirmada del contrato — `search` sobre nombre, sku
 * y marca (case-insensitive), filtro por `supplierId`, paginación `{ data,
 * meta }`, proveedores completos ordenados por nombre — para que apagar el
 * mock (NEXT_PUBLIC_CATALOGO_MOCK) no cambie ningún comportamiento de UI.
 *
 * Los datos viven en forma DTO y pasan por los MISMOS mappers de
 * `schemas/api.ts` que usa el cliente real: el camino mock ejercita la
 * traducción DTO → dominio completa. `imagenUrl` es null en la mayoría (así
 * llegará del S3 al inicio) y apunta a fotos locales en unos pocos, para ver
 * ambos estados de la card.
 */

const LATENCIA_MS = 350

const espera = () => new Promise((r) => setTimeout(r, LATENCIA_MS))

export const proveedoresMock: Proveedor[] = [
  { id: "prov-alpina", nombre: "Alpina" },
  { id: "prov-diana", nombre: "Diana Corporación" },
  { id: "prov-familia", nombre: "Grupo Familia" },
  { id: "prov-hv", nombre: "Harinera del Valle" },
  { id: "prov-nestle", nombre: "Nestlé de Colombia" },
  { id: "prov-team", nombre: "Team Foods" },
  { id: "prov-vanoli", nombre: "Vanoli Distribuciones" },
  { id: "prov-zenu", nombre: "Industria de Alimentos Zenú" },
]

const prov = (id: string) => proveedoresMock.find((p) => p.id === id)!

/** Generador compacto: [sku, nombre, marca, fabricante, proveedorId, imagen?] */
type Fila = [string, string, string, string, string, string?]

const FILAS: Fila[] = [
  // Aceites y grasas — Team Foods
  [
    "JDH-ACE-1001",
    "Aceite vegetal de soya × 20 L",
    "Z",
    "Team Foods Colombia",
    "prov-team",
    "/photos/productos/aceite-soya.jpg",
  ],
  [
    "JDH-ACE-1002",
    "Aceite de girasol premium caja × 12 botellas de 1 L",
    "Gourmet",
    "Team Foods Colombia",
    "prov-team",
  ],
  [
    "JDH-ACE-1003",
    "Margarina industrial esparcible × 15 kg",
    "Dagusto",
    "Team Foods Colombia",
    "prov-team",
  ],
  [
    "JDH-ACE-1004",
    "Manteca vegetal para panadería × 25 kg",
    "La Sabrosa",
    "Team Foods Colombia",
    "prov-team",
  ],
  // Granos y cereales — Diana / Harinera del Valle
  [
    "JDH-GRA-2001",
    "Arroz blanco premium bulto × 25 kg",
    "Diana",
    "Diana Corporación",
    "prov-diana",
    "/photos/productos/arroz-blanco.jpg",
  ],
  [
    "JDH-GRA-2002",
    "Arroz integral bulto × 12,5 kg",
    "Diana",
    "Diana Corporación",
    "prov-diana",
  ],
  [
    "JDH-GRA-2003",
    "Frijol cargamanto rojo × 12,5 kg",
    "Diana",
    "Diana Corporación",
    "prov-diana",
  ],
  [
    "JDH-GRA-2004",
    "Lenteja tipo laird bulto × 12,5 kg",
    "Diana",
    "Diana Corporación",
    "prov-diana",
  ],
  [
    "JDH-HAR-2101",
    "Harina de trigo panadera bulto × 50 kg",
    "Haz de Oros",
    "Harinera del Valle",
    "prov-hv",
  ],
  [
    "JDH-HAR-2102",
    "Harina para arepas precocida × 12 paquetes de 1 kg",
    "Doñarepa",
    "Harinera del Valle",
    "prov-hv",
  ],
  [
    "JDH-HAR-2103",
    "Pasta espagueti caja × 24 paquetes de 500 g",
    "San Remo",
    "Harinera del Valle",
    "prov-hv",
  ],
  [
    "JDH-HAR-2104",
    "Panela pulverizada × 24 paquetes de 500 g",
    "Cañaveral",
    "Harinera del Valle",
    "prov-hv",
    "/photos/productos/panela-pulverizada.jpg",
  ],
  // Lácteos — Alpina
  [
    "JDH-LAC-3001",
    "Leche entera UHT caja × 12 unidades de 1 L",
    "Alpina",
    "Alpina Productos Alimenticios",
    "prov-alpina",
    "/photos/productos/leche-uht.jpg",
  ],
  [
    "JDH-LAC-3002",
    "Leche deslactosada UHT caja × 12 unidades de 1 L",
    "Alpina",
    "Alpina Productos Alimenticios",
    "prov-alpina",
  ],
  [
    "JDH-LAC-3003",
    "Yogurt natural institucional garrafa × 4 L",
    "Alpina",
    "Alpina Productos Alimenticios",
    "prov-alpina",
  ],
  [
    "JDH-LAC-3004",
    "Queso doble crema bloque × 2,5 kg",
    "Alpina",
    "Alpina Productos Alimenticios",
    "prov-alpina",
  ],
  [
    "JDH-LAC-3005",
    "Mantequilla con sal caja × 24 barras de 250 g",
    "Alpina",
    "Alpina Productos Alimenticios",
    "prov-alpina",
  ],
  // Cárnicos — Zenú
  [
    "JDH-CAR-4001",
    "Salchicha tipo suiza granel × 5 kg",
    "Zenú",
    "Industria de Alimentos Zenú",
    "prov-zenu",
  ],
  [
    "JDH-CAR-4002",
    "Jamón de cerdo estándar bloque × 2,5 kg",
    "Zenú",
    "Industria de Alimentos Zenú",
    "prov-zenu",
  ],
  [
    "JDH-CAR-4003",
    "Mortadela institucional bloque × 4 kg",
    "Zenú",
    "Industria de Alimentos Zenú",
    "prov-zenu",
  ],
  [
    "JDH-CAR-4004",
    "Chorizo antioqueño caja × 10 paquetes de 500 g",
    "Zenú",
    "Industria de Alimentos Zenú",
    "prov-zenu",
  ],
  // Bebidas y culinarios — Nestlé
  [
    "JDH-BEB-5001",
    "Café instantáneo institucional × 12 frascos de 170 g",
    "Nescafé",
    "Nestlé de Colombia",
    "prov-nestle",
  ],
  [
    "JDH-BEB-5002",
    "Chocolate en polvo caja × 24 bolsas de 500 g",
    "Nestlé",
    "Nestlé de Colombia",
    "prov-nestle",
  ],
  [
    "JDH-CUL-5101",
    "Caldo de gallina caja × 48 cajas de 24 cubos",
    "Maggi",
    "Nestlé de Colombia",
    "prov-nestle",
  ],
  [
    "JDH-CUL-5102",
    "Leche condensada caja × 48 unidades de 395 g",
    "La Lechera",
    "Nestlé de Colombia",
    "prov-nestle",
  ],
  [
    "JDH-GAL-5201",
    "Galletas surtidas caja institucional × 3 kg",
    "Saltín Noel",
    "Nestlé de Colombia",
    "prov-nestle",
    "/photos/productos/galletas-surtidas.jpg",
  ],
  // Enlatados y abarrotes — Vanoli
  [
    "JDH-ENL-6001",
    "Atún en agua caja × 48 latas de 170 g",
    "Van Camp's",
    "Seatech International",
    "prov-vanoli",
    "/photos/productos/atun-agua.jpg",
  ],
  [
    "JDH-ENL-6002",
    "Sardinas en salsa de tomate caja × 24 latas de 425 g",
    "Vikingos",
    "Seatech International",
    "prov-vanoli",
  ],
  [
    "JDH-BEB-6101",
    "Agua natural botella caja × 24 unidades de 600 ml",
    "Manantial",
    "Vanoli Distribuciones",
    "prov-vanoli",
    "/photos/productos/agua-natural.jpg",
  ],
  [
    "JDH-BEB-6102",
    "Gaseosa cola retornable caja × 30 botellas de 350 ml",
    "Colcola",
    "Vanoli Distribuciones",
    "prov-vanoli",
    "/photos/productos/gaseosa-cola.jpg",
  ],
  // Aseo institucional — Grupo Familia
  [
    "JDH-ASE-7001",
    "Papel higiénico jumbo rollo × 4 rollos de 250 m",
    "Familia Institucional",
    "Grupo Familia",
    "prov-familia",
  ],
  [
    "JDH-ASE-7002",
    "Toalla de manos en rollo × 6 rollos de 150 m",
    "Familia Institucional",
    "Grupo Familia",
    "prov-familia",
  ],
  [
    "JDH-ASE-7003",
    "Servilleta cuadrada caja × 12 paquetes de 300 und",
    "Familia Institucional",
    "Grupo Familia",
    "prov-familia",
  ],
  [
    "JDH-ASE-7004",
    "Detergente líquido multiusos garrafa × 20 L",
    "Familia Institucional",
    "Grupo Familia",
    "prov-familia",
    "/photos/productos/detergente-liquido.jpg",
  ],
]

const productosDtoMock: ProductoDto[] = FILAS.map(
  ([sku, nombre, marca, fabricante, proveedorId, imagen], i) => ({
    id: `prod-${String(i + 1).padStart(3, "0")}`,
    sku,
    nombre,
    descripcion: `${nombre} — referencia del portafolio institucional JDH, distribuida por ${prov(proveedorId).nombre}. Presentación pensada para operaciones de alto volumen: restaurantes, casinos, hoteles e instituciones.`,
    marca,
    fabricante,
    proveedor: prov(proveedorId),
    categoria: null,
    subcategoria: null,
    imagenUrl: imagen ?? null,
  })
)

/* ——— Adaptadores con la misma firma que el cliente real ——— */

export async function listarProductosMock(
  params: ProductosQueryParams = {}
): Promise<Paginado<Producto>> {
  await espera()
  const { page = 1, limit = 12, search, supplierId } = params

  let filtrados = productosDtoMock
  if (supplierId) {
    filtrados = filtrados.filter((p) => p.proveedor.id === supplierId)
  }
  if (search?.trim()) {
    const termino = search.trim().toLowerCase()
    filtrados = filtrados.filter((p) =>
      [p.nombre, p.sku, p.marca ?? ""].some((campo) =>
        campo.toLowerCase().includes(termino)
      )
    )
  }

  const total = filtrados.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const data = filtrados.slice((page - 1) * limit, page * limit)

  return aPaginaProductos({ data, meta: { page, limit, total, totalPages } })
}

export async function obtenerProductoMock(id: string): Promise<Producto> {
  await espera()
  const dto = productosDtoMock.find((p) => p.id === id)
  if (!dto) {
    // Mismo contrato de error que el cliente real (404 de NestJS).
    throw new CatalogoApiError(404, `Producto ${id} no encontrado`)
  }
  return aProducto(dto)
}

export async function listarProveedoresMock(): Promise<Proveedor[]> {
  await espera()
  // Igual que GET /suppliers: incluye totalProductos y solo proveedores
  // con al menos un producto, ordenados por nombre.
  return proveedoresMock
    .map((proveedor) => ({
      ...proveedor,
      totalProductos: productosDtoMock.filter(
        (p) => p.proveedor.id === proveedor.id
      ).length,
    }))
    .filter((p) => p.totalProductos > 0)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
}
