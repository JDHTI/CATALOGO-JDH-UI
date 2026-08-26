/** Error del API con el `statusCode` NestJS (404 → producto no encontrado).
 *  Vive aparte de `client.ts` para que el mock pueda lanzarlo sin importar
 *  el cliente (que a su vez importa el mock para el switch por env). */
export class CatalogoApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message)
    this.name = "CatalogoApiError"
  }
}
