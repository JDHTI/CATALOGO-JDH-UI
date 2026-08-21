import type { ProductoCatalogo } from "../types"

/**
 * Dataset del listado de /productos. Productos GENÉRICOS sin foto (el
 * listado es placeholder; el modal cae a la foto de categoría o a un
 * placeholder). Precios de LISTA PÚBLICA en centavos de COP.
 *
 * Cuando exista backend, estas colecciones se reemplazan por queries con la
 * misma forma (ver src/modules/README.md).
 */

interface DetalleCategoria {
  descripcionCorta: string
  descripcionLarga: string
  empaque: string[]
}

const DETALLES: Record<string, DetalleCategoria> = {
  "aceites-y-grasas": {
    descripcionCorta: "Aceites vegetales refinados para cocina institucional.",
    descripcionLarga:
      "Aceite vegetal refinado de alta estabilidad para fritura y cocción en operaciones de alto volumen. Elaborado con materia prima seleccionada y proceso de refinado físico que garantiza sabor neutro, bajo contenido de ácidos grasos libres y punto de humo alto, ideal para freidoras industriales, planchas y preparaciones que exigen rendimiento constante por turno.",
    empaque: [
      "Presentación: caja por 12 botellas de 1 L",
      "Código de producto: JDH-ACE-1001",
      "Peso neto: 12 kg por caja",
      "Conservar en lugar fresco y seco, lejos de la luz directa",
    ],
  },
  "granos-y-cereales": {
    descripcionCorta: "Granos y harinas seleccionados, listos para granel.",
    descripcionLarga:
      "Granos de primera calidad con trazabilidad de origen y control de humedad en cada lote. Procesados en plantas certificadas con selección óptica y empaque hermético que protege el producto durante el almacenamiento. Presentación pensada para el consumo de alto volumen en restaurantes, casinos e instituciones: rendimiento constante y cocción pareja.",
    empaque: [
      "Presentación: bulto por 25 kg",
      "Código de producto: JDH-GRA-2002",
      "Peso neto: 25 kg por bulto",
      "Almacenar en lugar fresco, seco y ventilado",
    ],
  },
  lacteos: {
    descripcionCorta: "Lácteos UHT y derivados con cadena de frío.",
    descripcionLarga:
      "Productos lácteos elaborados con leche fresca de ganaderías certificadas, sometidos a tratamiento UHT que conserva sus propiedades sin necesidad de refrigeración hasta la apertura. Cadena de frío verificada desde la planta hasta la entrega en tu bodega. Ideal para cafeterías, hoteles y servicios de alimentación que requieren calidad constante y larga vida útil.",
    empaque: [
      "Presentación: caja por 12 unidades de 1 L",
      "Código de producto: JDH-LAC-3003",
      "Vida útil: 6 meses sin abrir",
      "Refrigerar después de abrir",
    ],
  },
  "carnicos-y-frios": {
    descripcionCorta: "Embutidos y carnes frías de mostrador institucional.",
    descripcionLarga:
      "Carnes frías y embutidos elaborados bajo estrictos estándares de inocuidad, con materias primas seleccionadas y procesos de cocción controlada. Presentaciones por kilo pensadas para mostrador y preparación en cocina institucional. Distribución con cadena de frío certificada de punta a punta para garantizar frescura y seguridad alimentaria.",
    empaque: [
      "Presentación: caja por 10 paquetes de 500 g",
      "Código de producto: JDH-CAR-4004",
      "Conservar entre 0 °C y 4 °C",
      "Consumir antes de la fecha impresa en el empaque",
    ],
  },
  bebidas: {
    descripcionCorta: "Gaseosas, aguas y jugos para food service.",
    descripcionLarga:
      "Portafolio completo de bebidas para operaciones de food service y retail: gaseosas, aguas saborizadas y jugos en presentaciones de alto rendimiento por caja. Productos de marcas líderes con disponibilidad constante en el canal institucional y rotación garantizada por su alta demanda en restaurantes, cafeterías y eventos.",
    empaque: [
      "Presentación: caja por 12 botellas de 1.5 L",
      "Código de producto: JDH-BEB-5005",
      "Conservar en lugar fresco; no exponer al sol",
      "Servir frío para mejor experiencia",
    ],
  },
  "enlatados-y-conservas": {
    descripcionCorta: "Conservas con estándar de exportación.",
    descripcionLarga:
      "Enlatados y conservas procesados con estándares de exportación: materia prima seleccionada, llenado en caliente y sellado hermético que garantiza larga vida útil sin conservantes adicionales. Ideal para despensa institucional: stock estable, porciones controladas y versatilidad en la preparación de menús.",
    empaque: [
      "Presentación: caja por 48 latas de 170 g",
      "Código de producto: JDH-ENL-6006",
      "Vida útil: 3 años",
      "Almacenar en lugar fresco y seco",
    ],
  },
  "snacks-y-confiteria": {
    descripcionCorta: "Galletas, snacks y dulces para tiendas y cafeterías.",
    descripcionLarga:
      "Línea de snacks y confitería para puntos de venta, cafeterías y dispensadores: galletas surtidas, snacks salados y dulces en empaques individuales que facilitan la venta unitaria y el control de porción. Marcas reconocidas con alta rotación y presentaciones que optimizan el espacio de exhibición.",
    empaque: [
      "Presentación: caja por 24 paquetes individuales",
      "Código de producto: JDH-SNA-7007",
      "Vida útil: 9 meses",
      "Conservar en lugar fresco y seco",
    ],
  },
  "limpieza-y-aseo": {
    descripcionCorta: "Detergentes, desinfectantes y papel institucional.",
    descripcionLarga:
      "Soluciones de limpieza profesional para operaciones exigentes: detergentes concentrados, desinfectantes de uso institucional y papel de alto rendimiento. Fórmulas diseñadas para maximizar rendimiento por galón y reducir el costo por operación de limpieza, cumpliendo estándares de higiene para cocinas, baños y áreas de servicio.",
    empaque: [
      "Presentación: caja por 4 galones",
      "Código de producto: JDH-LIM-8008",
      "Peso neto: 15.1 kg por caja",
      "Mantener fuera del alcance de los niños",
    ],
  },
  "frutas-y-verduras": {
    descripcionCorta: "Frescos seleccionados para operaciones diarias.",
    descripcionLarga:
      "Frutas y verduras seleccionadas en origen con criterios de madurez, calibre y frescura para operaciones de alto volumen. Cadena de frío desde la central de abastos hasta la entrega, con rotación diaria que garantiza producto fresco en cada despacho. Ideal para restaurantes, casinos y servicios de alimentación que priorizan calidad constante.",
    empaque: [
      "Presentación: canastilla por 20 kg",
      "Código de producto: JDH-FRV-9009",
      "Conservar refrigerado entre 4 °C y 8 °C",
      "Consumo preferente: 5 días desde el despacho",
    ],
  },
  congelados: {
    descripcionCorta: "Proteínas y vegetales congelados con cadena de frío.",
    descripcionLarga:
      "Alimentos congelados IQF (congelación individual rápida) que preservan textura, sabor y valor nutricional. Presentaciones por caja optimizadas para congelación institucional, con cadena de frío certificada en todo el trayecto. Solución práctica para operaciones que necesitan porcionar sin mermas y mantener stock de respaldo.",
    empaque: [
      "Presentación: caja por 6 paquetes de 2 kg",
      "Código de producto: JDH-CON-1010",
      "Conservar a -18 °C",
      "No recongelar después de descongelar",
    ],
  },
}

/** (categoríaSlug, nombre visible) — alineado con searchCategoryOptions. */
const CATEGORIAS: [string, string][] = [
  ["aceites-y-grasas", "Aceites y grasas"],
  ["granos-y-cereales", "Granos y cereales"],
  ["lacteos", "Lácteos"],
  ["carnicos-y-frios", "Cárnicos y fríos"],
  ["bebidas", "Bebidas"],
  ["enlatados-y-conservas", "Enlatados y conservas"],
  ["snacks-y-confiteria", "Snacks y confitería"],
  ["limpieza-y-aseo", "Limpieza y aseo"],
  ["frutas-y-verduras", "Frutas y verduras"],
  ["congelados", "Congelados"],
]

/** Marcas institucionales por categoría. */
const MARCAS: Record<string, string[]> = {
  "aceites-y-grasas": ["Oleaginosas del Valle", "Girasoli", "La Finísima"],
  "granos-y-cereales": ["Roa", "Diana", "Flor Huila"],
  lacteos: ["Alpina", "Colanta", "Rica"],
  "carnicos-y-frios": ["Zenú", "Pietrán", "Rancho"],
  bebidas: ["Postobón", "Coca-Cola", "Pepsi"],
  "enlatados-y-conservas": ["Conservas del Caribe", "Isabel"],
  "snacks-y-confiteria": ["Colombina", "Noel", "Tosh"],
  "limpieza-y-aseo": ["Fabuloso", "Ariel", "Don Limpio"],
  "frutas-y-verduras": ["Del Huerto", "Frutas del Campo"],
  congelados: ["McCain", "Crem Helado"],
}

/** Nombres y precios de los productos por categoría (48 en total). */
const PRODUCTOS_BASE: Record<
  string,
  { nombre: string; precio: number; unidad: string; presentacion: string }[]
> = {
  "aceites-y-grasas": [
    {
      nombre: "Aceite de soya refinado 1 L",
      precio: 132400,
      unidad: "Caja × 12 botellas de 1 L",
      presentacion: "Caja",
    },
    {
      nombre: "Aceite de palma refinado 5 L",
      precio: 289900,
      unidad: "Caneca × 2 de 5 L",
      presentacion: "Caneca",
    },
    {
      nombre: "Aceite de girasol 1 L",
      precio: 158900,
      unidad: "Caja × 12 botellas de 1 L",
      presentacion: "Caja",
    },
    {
      nombre: "Manteca vegetal institucional 10 kg",
      precio: 198500,
      unidad: "Caja × 2 de 10 kg",
      presentacion: "Caja",
    },
    {
      nombre: "Aceite alto oleico 5 L",
      precio: 342000,
      unidad: "Caneca × 2 de 5 L",
      presentacion: "Caneca",
    },
  ],
  "granos-y-cereales": [
    {
      nombre: "Arroz blanco premium 25 kg",
      precio: 98500,
      unidad: "Bulto 25 kg",
      presentacion: "Bulto",
    },
    {
      nombre: "Arroz integral 25 kg",
      precio: 112800,
      unidad: "Bulto 25 kg",
      presentacion: "Bulto",
    },
    {
      nombre: "Frijol rojo 25 kg",
      precio: 256000,
      unidad: "Bulto 25 kg",
      presentacion: "Bulto",
    },
    {
      nombre: "Lenteja 25 kg",
      precio: 189500,
      unidad: "Bulto 25 kg",
      presentacion: "Bulto",
    },
    {
      nombre: "Harina de trigo 25 kg",
      precio: 96400,
      unidad: "Bulto 25 kg",
      presentacion: "Bulto",
    },
  ],
  lacteos: [
    {
      nombre: "Leche entera UHT 1 L",
      precio: 4700,
      unidad: "Caja × 12 unidades de 1 L",
      presentacion: "Caja",
    },
    {
      nombre: "Leche deslactosada UHT 1 L",
      precio: 5100,
      unidad: "Caja × 12 unidades de 1 L",
      presentacion: "Caja",
    },
    {
      nombre: "Queso mozzarella por kilo",
      precio: 38900,
      unidad: "Caja × 4 kg",
      presentacion: "Caja",
    },
    {
      nombre: "Yogurt natural 1 L",
      precio: 12800,
      unidad: "Caja × 6 botellas de 1 L",
      presentacion: "Caja",
    },
    {
      nombre: "Mantequilla institucional 500 g",
      precio: 16200,
      unidad: "Caja × 12 unidades",
      presentacion: "Caja",
    },
  ],
  "carnicos-y-frios": [
    {
      nombre: "Jamón de cerdo 500 g",
      precio: 18400,
      unidad: "Caja × 10 paquetes de 500 g",
      presentacion: "Caja",
    },
    {
      nombre: "Salchichón ahumado 500 g",
      precio: 15900,
      unidad: "Caja × 10 paquetes de 500 g",
      presentacion: "Caja",
    },
    {
      nombre: "Chorizo santarrosano 500 g",
      precio: 17200,
      unidad: "Caja × 10 paquetes de 500 g",
      presentacion: "Caja",
    },
    {
      nombre: "Tocino ahumado por kilo",
      precio: 27800,
      unidad: "Caja × 4 kg",
      presentacion: "Caja",
    },
    {
      nombre: "Pechuga de pavo 500 g",
      precio: 21400,
      unidad: "Caja × 10 paquetes de 500 g",
      presentacion: "Caja",
    },
  ],
  bebidas: [
    {
      nombre: "Gaseosa cola 1.5 L",
      precio: 3600,
      unidad: "Caja × 12 botellas",
      presentacion: "Caja",
    },
    {
      nombre: "Gaseosa cola light 1.5 L",
      precio: 3600,
      unidad: "Caja × 12 botellas",
      presentacion: "Caja",
    },
    {
      nombre: "Agua natural 600 ml",
      precio: 1800,
      unidad: "Paquete × 12 botellas",
      presentacion: "Paquete",
    },
    {
      nombre: "Jugo de naranja 1 L",
      precio: 7800,
      unidad: "Caja × 12 botellas",
      presentacion: "Caja",
    },
    {
      nombre: "Cerveza ligera 330 ml",
      precio: 2900,
      unidad: "Caja × 24 latas",
      presentacion: "Caja",
    },
  ],
  "enlatados-y-conservas": [
    {
      nombre: "Atún en agua 170 g",
      precio: 3100,
      unidad: "Caja × 48 latas de 170 g",
      presentacion: "Caja",
    },
    {
      nombre: "Atún en aceite 170 g",
      precio: 3300,
      unidad: "Caja × 48 latas de 170 g",
      presentacion: "Caja",
    },
    {
      nombre: "Arvejas en lata 400 g",
      precio: 2600,
      unidad: "Caja × 24 latas",
      presentacion: "Caja",
    },
    {
      nombre: "Mazorca dulce 400 g",
      precio: 2900,
      unidad: "Caja × 24 latas",
      presentacion: "Caja",
    },
    {
      nombre: "Salsa de tomate 1 kg",
      precio: 5400,
      unidad: "Caja × 12 bolsas de 1 kg",
      presentacion: "Caja",
    },
  ],
  "snacks-y-confiteria": [
    {
      nombre: "Galletas surtidas institucionales",
      precio: 3240,
      unidad: "Caja × 24 paquetes",
      presentacion: "Caja",
    },
    {
      nombre: "Galletas de avena 500 g",
      precio: 6200,
      unidad: "Caja × 12 paquetes",
      presentacion: "Caja",
    },
    {
      nombre: "Papas fritas 200 g",
      precio: 4800,
      unidad: "Caja × 24 paquetes",
      presentacion: "Caja",
    },
    {
      nombre: "Caramelos surtidos por kilo",
      precio: 14800,
      unidad: "Caja × 6 kg",
      presentacion: "Caja",
    },
    {
      nombre: "Barquillos rellenos 400 g",
      precio: 5600,
      unidad: "Caja × 12 paquetes",
      presentacion: "Caja",
    },
  ],
  "limpieza-y-aseo": [
    {
      nombre: "Detergente multiusos 1 L",
      precio: 8900,
      unidad: "Caja × 12 botellas de 1 L",
      presentacion: "Caja",
    },
    {
      nombre: "Desinfectante pino 1 L",
      precio: 7600,
      unidad: "Caja × 12 botellas de 1 L",
      presentacion: "Caja",
    },
    {
      nombre: "Jabón lavaplatos 4 L",
      precio: 15800,
      unidad: "Caja × 4 galones",
      presentacion: "Galón",
    },
    {
      nombre: "Papel higiénico industrial",
      precio: 34200,
      unidad: "Paquete × 12 rollos",
      presentacion: "Paquete",
    },
    {
      nombre: "Espuma limpiadora 750 ml",
      precio: 11200,
      unidad: "Caja × 12 unidades",
      presentacion: "Caja",
    },
  ],
  "frutas-y-verduras": [
    {
      nombre: "Canastilla de tomate chonto",
      precio: 68500,
      unidad: "Canastilla 20 kg",
      presentacion: "Canastilla",
    },
    {
      nombre: "Canastilla de cebolla cabezona",
      precio: 74200,
      unidad: "Canastilla 20 kg",
      presentacion: "Canastilla",
    },
    {
      nombre: "Canastilla de papa criolla",
      precio: 79800,
      unidad: "Canastilla 20 kg",
      presentacion: "Canastilla",
    },
    {
      nombre: "Canastilla de plátano verde",
      precio: 45600,
      unidad: "Canastilla 20 kg",
      presentacion: "Canastilla",
    },
    {
      nombre: "Canastilla de limón tahití",
      precio: 128500,
      unidad: "Canastilla 20 kg",
      presentacion: "Canastilla",
    },
  ],
  congelados: [
    {
      nombre: "Papa a la francesa 2 kg",
      precio: 16800,
      unidad: "Caja × 6 paquetes de 2 kg",
      presentacion: "Caja",
    },
    {
      nombre: "Vegetales mixtos IQF 2 kg",
      precio: 19400,
      unidad: "Caja × 6 paquetes de 2 kg",
      presentacion: "Caja",
    },
    {
      nombre: "Guisantes IQF 2 kg",
      precio: 18200,
      unidad: "Caja × 6 paquetes de 2 kg",
      presentacion: "Caja",
    },
    {
      nombre: "Helado de vainilla 3 L",
      precio: 36800,
      unidad: "Caja × 4 baldes de 3 L",
      presentacion: "Caja",
    },
    {
      nombre: "Yuca congelada 2 kg",
      precio: 14900,
      unidad: "Caja × 6 paquetes de 2 kg",
      presentacion: "Caja",
    },
  ],
}

const PRESENTACIONES = new Set<string>()

let seq = 0
export const productosCatalogo: ProductoCatalogo[] = CATEGORIAS.flatMap(
  ([slug, nombre]) => {
    const detalle = DETALLES[slug]
    const marcas = MARCAS[slug]
    return PRODUCTOS_BASE[slug].map((base, i) => {
      seq += 1
      const id = `cat-${String(seq).padStart(3, "0")}`
      PRESENTACIONES.add(base.presentacion)
      // Algunos productos en oferta (con precio anterior para tachado) y un
      // par agotados, para que los filtros y el modal tengan estados reales.
      const enOferta = seq % 7 === 0
      const agotado = seq === 9 || seq === 33
      return {
        id,
        nombre: base.nombre,
        categoriaSlug: slug,
        categoria: nombre,
        marca: marcas[i % marcas.length],
        precioCentavos: base.precio * 100,
        precioAnteriorCentavos: enOferta
          ? Math.round(base.precio * 1.2) * 100
          : undefined,
        unidadVenta: base.unidad,
        presentacion: base.presentacion,
        descripcionCorta: detalle.descripcionCorta,
        descripcionLarga: detalle.descripcionLarga,
        detallesEmpaque: detalle.empaque,
        badge: agotado
          ? undefined
          : enOferta
            ? "Oferta"
            : seq % 11 === 0
              ? "Nuevo"
              : undefined,
        disponible: !agotado,
      }
    })
  }
)

/** Todas las presentaciones que aparecen en el catálogo (para el filtro). */
export const presentacionesCatalogo = Array.from(PRESENTACIONES).sort()

/** Marcas del catálogo para el filtro (en orden de frecuencia). */
export const marcasCatalogo = Array.from(
  productosCatalogo.reduce((map, p) => {
    map.set(p.marca, (map.get(p.marca) ?? 0) + 1)
    return map
  }, new Map<string, number>())
)
  .sort((a, b) => b[1] - a[1])
  .map(([marca]) => marca)
