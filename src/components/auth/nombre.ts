/**
 * Primer nombre de pila, para saludar.
 *
 * Entra ID devuelve el `displayName` completo del directorio ("María Fernanda
 * Restrepo Álvarez") y las cuentas de cliente traen lo que la persona escribió
 * en el registro. Saludar con la cadena entera suena a carta de banco, así que
 * la bienvenida usa solo la primera palabra.
 *
 * Si el nombre viene en formato "Apellido, Nombre" —como lo exporta algún
 * directorio— la coma manda: lo que interesa es lo que va DESPUÉS de ella.
 */
export function primerNombre(nombre: string): string {
  const limpio = nombre.trim()
  if (!limpio) return ""

  const trasComa = limpio.includes(",")
    ? (limpio.split(",")[1] ?? "").trim()
    : limpio

  return (trasComa || limpio).split(/\s+/)[0] ?? limpio
}
