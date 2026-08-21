import type { MainNavItem } from "@/lib/navigation"

/**
 * Entradas de la barra horizontal que NO son módulos. Los módulos reales
 * vienen del registro (`src/config/modules.ts`); este array es para lo que no
 * es un módulo del catálogo (páginas institucionales, accesos externos).
 *
 * Se fusiona con el registro en `resolveMainNav`, dentro del `MainNav` cliente.
 * Los íconos viven aquí (son funciones) y solo se consumen en cliente.
 *
 * Vacío por ahora: el nav se deriva completo del registro.
 */
export const mainNavExtras: MainNavItem[] = []
