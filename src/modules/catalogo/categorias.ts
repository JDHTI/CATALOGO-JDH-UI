import {
  Beef,
  CookingPot,
  Factory,
  PawPrint,
  Package,
  PenLine,
  ShieldPlus,
  SprayCan,
  Sparkles,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from "lucide-react"

/**
 * La taxonomía NO vive aquí: la publica el API (`GET /categories`, ver
 * `useCategorias`) y se edita sin desplegar la UI. Este archivo solo decide
 * cómo se PINTA una categoría — su ícono —, indexado por `slug`.
 *
 * Una categoría nueva o renombrada que no esté en el mapa se pinta con
 * `ICONO_CATEGORIA_POR_DEFECTO`: nunca rompe ni desaparece.
 */
const ICONOS_CATEGORIA: Readonly<Record<string, LucideIcon>> = {
  alimentos: CookingPot,
  proteinas: Beef,
  "aseo-y-limpieza": SprayCan,
  "cuidado-personal": Sparkles,
  menaje: UtensilsCrossed,
  "empaques-y-desechables": Package,
  "licores-y-tabaco": Wine,
  "papeleria-y-oficina": PenLine,
  industrial: Factory,
  mascotas: PawPrint,
  farmaceuticos: ShieldPlus,
}

export const ICONO_CATEGORIA_POR_DEFECTO: LucideIcon = Package

export function iconoCategoria(slug: string): LucideIcon {
  return Object.hasOwn(ICONOS_CATEGORIA, slug)
    ? ICONOS_CATEGORIA[slug]
    : ICONO_CATEGORIA_POR_DEFECTO
}
