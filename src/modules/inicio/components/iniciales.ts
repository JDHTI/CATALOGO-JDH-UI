/** Iniciales (máx. 2) para el monograma de un proveedor. */
export function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter((palabra) => palabra.length > 0)
    .slice(0, 2)
    .map((palabra) => palabra[0]!.toUpperCase())
    .join("")
}
