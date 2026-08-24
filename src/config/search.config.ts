export interface CatalogoCategoryOption {
  value: string
  label: string
}

export interface CatalogoSubcategoryOption {
  value: string
  label: string
}

export interface CatalogoCategoryWithSubcategories extends CatalogoCategoryOption {
  subcategories: CatalogoSubcategoryOption[]
}

/**
 * Árbol categoría → subcategorías MOCKEADO — solo lo necesario para poder
 * maquetar el mega menú (columnas filtrables por categoría) y el dropdown del
 * buscador antes de que exista un backend real. Las rutas que consumen esto
 * (`/productos?categoria=<value>` y `&subcategoria=<value>`) todavía no
 * interpretan esos parámetros — ver `catalogo-view.tsx`.
 *
 * ÚNICA FUENTE DE VERDAD para las categorías: `searchCategoryOptions`,
 * `featuredCategoryLinks` y `navCategoryLinks` se DERIVAN de aquí (sin
 * subcategorías) para los consumidores que solo necesitan el nivel plano
 * (`CategoryDropdown`, `MainNav`) — así categoría y subcategorías nunca
 * quedan desincronizadas entre dos listas.
 *
 * Cuando exista el backend, sustituir este árbol por las categorías reales
 * (o un hook que las resuelva) sin tocar los componentes que lo consumen.
 */
export const categoryTree: CatalogoCategoryWithSubcategories[] = [
  {
    value: "aceites-y-grasas",
    label: "Aceites y grasas",
    subcategories: [
      { value: "aceite-vegetal", label: "Aceite vegetal" },
      { value: "aceite-oliva", label: "Aceite de oliva" },
      { value: "mantequilla", label: "Mantequilla" },
      { value: "margarina", label: "Margarina" },
    ],
  },
  {
    value: "granos-y-cereales",
    label: "Granos y cereales",
    subcategories: [
      { value: "arroz", label: "Arroz" },
      { value: "pasta", label: "Pasta" },
      { value: "harina", label: "Harina de trigo" },
      { value: "avena", label: "Avena" },
    ],
  },
  {
    value: "lacteos",
    label: "Lácteos",
    subcategories: [
      { value: "leche", label: "Leche" },
      { value: "queso", label: "Queso" },
      { value: "yogurt", label: "Yogurt" },
      { value: "crema-de-leche", label: "Crema de leche" },
    ],
  },
  {
    value: "carnicos-y-frios",
    label: "Cárnicos y fríos",
    subcategories: [
      { value: "pollo", label: "Pollo" },
      { value: "res", label: "Res" },
      { value: "cerdo", label: "Cerdo" },
      { value: "embutidos", label: "Embutidos" },
    ],
  },
  {
    value: "bebidas",
    label: "Bebidas",
    subcategories: [
      { value: "gaseosas", label: "Gaseosas" },
      { value: "jugos", label: "Jugos" },
      { value: "agua", label: "Agua" },
      { value: "cafe-y-te", label: "Café y té" },
    ],
  },
  {
    value: "enlatados-y-conservas",
    label: "Enlatados y conservas",
    subcategories: [
      { value: "atun-y-sardinas", label: "Atún y sardinas" },
      { value: "vegetales-enlatados", label: "Vegetales enlatados" },
      { value: "frutas-en-almibar", label: "Frutas en almíbar" },
      { value: "salsas-y-aderezos", label: "Salsas y aderezos" },
    ],
  },
  {
    value: "snacks-y-confiteria",
    label: "Snacks y confitería",
    subcategories: [
      { value: "papas-y-frituras", label: "Papas y frituras" },
      { value: "galletas", label: "Galletas" },
      { value: "chocolates-y-dulces", label: "Chocolates y dulces" },
      { value: "frutos-secos", label: "Frutos secos" },
    ],
  },
  {
    value: "limpieza-y-aseo",
    label: "Limpieza y aseo",
    subcategories: [
      { value: "detergentes", label: "Detergentes" },
      { value: "desinfectantes", label: "Desinfectantes" },
      { value: "papel-y-servilletas", label: "Papel higiénico y servilletas" },
      { value: "jabones", label: "Jabones" },
    ],
  },
  {
    value: "frutas-y-verduras",
    label: "Frutas y verduras",
    subcategories: [
      { value: "frutas-frescas", label: "Frutas frescas" },
      { value: "verduras-frescas", label: "Verduras frescas" },
      { value: "tuberculos", label: "Tubérculos" },
      { value: "hierbas-aromaticas", label: "Hierbas y aromáticas" },
    ],
  },
  {
    value: "congelados",
    label: "Congelados",
    subcategories: [
      { value: "vegetales-congelados", label: "Vegetales congelados" },
      { value: "carnes-congeladas", label: "Carnes congeladas" },
      { value: "papas-congeladas", label: "Papas congeladas" },
      { value: "helados", label: "Helados" },
    ],
  },
]

export const searchCategoryOptions: CatalogoCategoryOption[] = [
  { value: "todas", label: "Todas las categorías" },
  ...categoryTree.map(({ value, label }) => ({ value, label })),
]

/** Subconjunto sin "todas", para los accesos rápidos de la barra de categorías. */
export const featuredCategoryLinks: CatalogoCategoryOption[] = categoryTree.map(
  ({ value, label }) => ({ value, label })
)

/**
 * Categorías que caben en la barra de navegación (MainNav) SIN scroll
 * horizontal: 8 de las 10 — las que encajan en el ancho del contenedor. El
 * resto queda accesible desde el mega menú y el buscador.
 */
export const navCategoryLinks: CatalogoCategoryOption[] =
  featuredCategoryLinks.slice(0, 8)
