/** Error del API con el `statusCode` NestJS (404 → producto no encontrado).
 *  Vive aparte de `client.ts` para que un componente que solo necesita
 *  distinguir el código de error no arrastre el cliente completo. */
export class CatalogoApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message)
    this.name = "CatalogoApiError"
  }
}
