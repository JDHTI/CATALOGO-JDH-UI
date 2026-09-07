import * as z from "zod"

/**
 * Política de contraseña y esquema de registro de CUENTAS DE CLIENTE.
 *
 * Módulo isomórfico a propósito (sin `server-only`): el formulario lo usa para
 * validar mientras se escribe y la Server Action lo usa para decidir. Es el
 * mismo objeto, así que el mensaje que ve el usuario y la regla que se aplica
 * de verdad no pueden desincronizarse. La validación del cliente es comodidad;
 * la que manda es la del servidor (`src/lib/auth/acciones.ts`).
 *
 * Sobre la política: Better Auth solo sabe imponer largo mínimo y máximo, así
 * que todo lo demás se comprueba aquí. Se combinan las dos escuelas — largo
 * generoso y lista de bloqueo (NIST SP 800-63B, que desaconseja las reglas de
 * composición) más un requisito de composición mínima, que es lo que espera
 * una auditoría corporativa. La lista de bloqueo es corta y deliberada: cubre
 * lo que de verdad aparece en un formulario de este dominio, no pretende ser
 * un diccionario.
 */

export const CONTRASENA_MIN = 10
/** Tope de Better Auth (`maxPasswordLength`, por defecto 128). */
export const CONTRASENA_MAX = 128

/**
 * Términos que no pueden SOSTENER una contraseña. Ver `dominadaPorTermino`:
 * no basta con que aparezcan, tienen que ser casi toda la contraseña.
 */
const BLOQUEADAS = [
  "contrasena",
  "contraseña",
  "password",
  "passw0rd",
  "123456",
  "12345678",
  "1234567890",
  "qwerty",
  "abc123",
  "juandhoyos",
  "jdh",
  "jdhti",
  "catalogo",
  "catalogojdh",
  "distribuciones",
  "colombia",
  "medellin",
  "admin",
  "administrador",
  "usuario",
  "bienvenido",
]

/** Normaliza para comparar contra la lista de bloqueo y contra los datos del usuario. */
function normalizar(valor: string): string {
  return (
    valor
      .toLowerCase()
      .normalize("NFD")
      // Marcas diacríticas combinantes (escapadas: sueltas en el código se
      // pegarían visualmente al carácter anterior). `contraseña` y `contrasena`
      // deben caer en la misma cadena antes de comparar.
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]/g, "")
  )
}

/**
 * Fracción de la contraseña (ya normalizada) que un término bloqueado tiene
 * que cubrir para descartarla.
 *
 * La alternativa —rechazar en cuanto el término APAREZCA en cualquier
 * posición— se probó y es inservible: con `jdh` o `abc123` en la lista,
 * cualquier contraseña larga y buena que los contenga de casualidad se cae.
 * `Bodega2026xy!!QwErTy` es un ejemplo real: 20 caracteres y cuatro familias,
 * rechazada por llevar "qwerty" dentro. Lo que hace débil a una contraseña no
 * es contener una palabra común, es SER una palabra común con adornos.
 */
const UMBRAL_TERMINO_DOMINANTE = 0.6

/** ¿Algún término bloqueado ocupa la mayor parte de la contraseña? */
function dominadaPorTermino(normalizada: string): boolean {
  if (!normalizada) return false
  return BLOQUEADAS.some(
    (termino) =>
      normalizada.includes(termino) &&
      termino.length / normalizada.length >= UMBRAL_TERMINO_DOMINANTE
  )
}

/**
 * Palabras con entidad propia dentro de un nombre o un correo. Se parte por
 * espacios y por los separadores habituales de una dirección (`@`, `.`, `_`,
 * `-`) para que de `maria.restrepo@tuempresa.com` salgan `maria`, `restrepo`
 * y `tuempresa`. Por debajo de 4 caracteres no se consideran: `de`, `com` o
 * una inicial aparecen en demasiadas contraseñas legítimas.
 */
function palabrasIdentificatorias(valor: string): string[] {
  return valor
    .split(/[\s@._+-]+/)
    .map(normalizar)
    .filter((palabra) => palabra.length >= 4)
}

export const contrasenaSchema = z
  .string()
  .min(CONTRASENA_MIN, `Usa al menos ${CONTRASENA_MIN} caracteres.`)
  .max(CONTRASENA_MAX, `No puede superar los ${CONTRASENA_MAX} caracteres.`)
  .regex(/[a-z]/, "Incluye al menos una letra minúscula.")
  .regex(/[A-Z]/, "Incluye al menos una letra mayúscula.")
  .regex(/[0-9]/, "Incluye al menos un número.")
  .refine(
    (valor) => !dominadaPorTermino(normalizar(valor)),
    "Es una contraseña demasiado común o predecible. Elige otra."
  )

export const registroSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(3, "Escribe tu nombre completo.")
      .max(120, "El nombre es demasiado largo."),
    // `.pipe(z.email())` y no `z.string().email()`: en zod 4 el validador de
    // correo es un esquema propio, y el `trim`/`toLowerCase` tienen que correr
    // ANTES de validarlo para que " Correo@X.com " entre normalizado.
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(
        z
          .email("Escribe un correo electrónico válido.")
          .max(160, "El correo es demasiado largo.")
      ),
    contrasena: contrasenaSchema,
    confirmacion: z.string(),
  })
  // La contraseña no puede ser el propio nombre o el propio correo: son los
  // dos datos que el atacante ya tiene si llegó al formulario.
  .superRefine((datos, ctx) => {
    if (datos.contrasena !== datos.confirmacion) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmacion"],
        message: "Las contraseñas no coinciden.",
      })
    }

    // Palabra a palabra, no el nombre completo: nadie pone "María Restrepo"
    // de contraseña, pero "Restrepo2026" sí es exactamente lo que se teclea.
    const limpia = normalizar(datos.contrasena)
    const derivada = [
      ...palabrasIdentificatorias(datos.nombre),
      ...palabrasIdentificatorias(datos.email),
    ].some((palabra) => limpia.includes(palabra))

    if (derivada) {
      ctx.addIssue({
        code: "custom",
        path: ["contrasena"],
        message: "No uses tu nombre ni tu correo dentro de la contraseña.",
      })
    }
  })

export type DatosRegistro = z.infer<typeof registroSchema>

/**
 * Medidor de fuerza para el formulario. NO es una regla de aceptación —
 * `contrasenaSchema` es quien decide— sino una señal de progreso mientras se
 * escribe: una contraseña puede ser válida y aun así marcar "aceptable".
 *
 * Se puntúa longitud y variedad de familias de caracteres, no entropía real:
 * un cálculo exacto necesitaría un diccionario en el bundle y no cambiaría lo
 * que el usuario hace con el resultado.
 */
export type NivelFuerza = 0 | 1 | 2 | 3 | 4

export const ETIQUETAS_FUERZA: Record<NivelFuerza, string> = {
  0: "Muy débil",
  1: "Débil",
  2: "Aceptable",
  3: "Fuerte",
  4: "Muy fuerte",
}

export function fuerzaContrasena(valor: string): NivelFuerza {
  if (!valor) return 0

  const familias = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) =>
    re.test(valor)
  ).length

  let puntos = 0
  if (valor.length >= CONTRASENA_MIN) puntos += 1
  if (valor.length >= 14) puntos += 1
  if (valor.length >= 20) puntos += 1
  if (familias >= 3) puntos += 1
  if (familias === 4) puntos += 1

  // Mismo criterio que la validación, para que el medidor no diga "muy
  // fuerte" sobre algo que el formulario va a rechazar (ni al revés).
  if (dominadaPorTermino(normalizar(valor))) puntos = 0

  return Math.min(puntos, 4) as NivelFuerza
}
