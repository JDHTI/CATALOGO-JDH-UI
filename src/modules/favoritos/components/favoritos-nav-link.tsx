"use client"

import { Heart } from "lucide-react"

import { IconNavLink } from "@/components/layout/icon-nav-link"

import { useFavoritosIds } from "../hooks/use-favoritos"

/**
 * Ícono de Favoritos del header, con el contador real.
 *
 * Existe como componente aparte del `AppHeader` para que el header no tenga
 * que conocer la capa de datos de favoritos: aquí vive la única dependencia
 * y el header sigue siendo composición.
 *
 * El enlace se pinta SIEMPRE, también para el visitante anónimo — es parte
 * del chrome y quitarlo movería los íconos de sitio según haya sesión o no.
 * Lo que aparece solo con sesión es el contador, que es el dato que depende
 * del usuario.
 */
export function FavoritosNavLink() {
  const { total, activo } = useFavoritosIds()

  return (
    <IconNavLink
      href="/favoritos"
      icon={Heart}
      label="Favoritos"
      count={activo ? total : 0}
    />
  )
}
