import * as z from "zod"

/**
 * Esquema del formulario de contacto del homepage (tipo newsletter).
 *
 * Isomórfico a propósito, como `src/lib/auth/registro.ts`: lo usa la Server
 * Action para decidir y podría usarlo el formulario para validar mientras se
 * escribe, así que la regla y el mensaje no se desincronizan.
 *
 * Replica el contrato de `POST /api/v1/contact-leads` (PR #25 del API). El
 * API valida otra vez y es quien manda; aquí se valida para devolver errores
 * por campo sin un viaje de ida y vuelta, y se NORMALIZA lo que el API también
 * normalizaría, para que el cuerpo que sale ya sea el definitivo. El API
 * rechaza campos fuera del contrato (`forbidNonWhitelisted`): `aCuerpoApi`
 * arma exactamente los ocho.
 */

export const TIPOS_IDENTIFICACION = ["NIT", "CC"] as const
export type TipoIdentificacion = (typeof TIPOS_IDENTIFICACION)[number]

/** Valor fijo del campo `origen`: de dónde salió el contacto. */
export const ORIGEN_CONTACTO = "home-newsletter"

/** "" (campo vacío del formulario) cuenta como "no lo dio". */
const vacioANull = (valor: unknown) =>
  typeof valor === "string" && valor.trim() === "" ? null : valor

/**
 * Celular colombiano: diez dígitos que empiezan por 3. Se aceptan prefijo
 * +57/57 y los separadores con que la gente lo escribe ("300 123 4567",
 * "(300) 123-4567"); sale siempre como los diez dígitos.
 */
export function normalizarCelular(valor: string): string {
  const digitos = valor.replace(/[\s.\-()]/g, "").replace(/^\+/, "")
  return digitos.length === 12 && digitos.startsWith("57")
    ? digitos.slice(2)
    : digitos
}

export const contactoSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "Escribe tu nombre.")
      .max(120, "El nombre es demasiado largo."),
    correo: z
      .string()
      .trim()
      .toLowerCase()
      .max(254, "El correo es demasiado largo.")
      .pipe(z.email("Escribe un correo válido.")),
    celular: z
      .string()
      .transform(normalizarCelular)
      .pipe(
        z
          .string()
          .regex(
            /^3\d{9}$/,
            "Escribe un celular de 10 dígitos que empiece por 3."
          )
      ),
    ciudad: z
      .string()
      .trim()
      .min(2, "Escribe tu ciudad.")
      .max(80, "El nombre de la ciudad es demasiado largo."),
    tipoIdentificacion: z.preprocess(
      vacioANull,
      z.enum(TIPOS_IDENTIFICACION).nullable()
    ),
    identificacion: z.preprocess(
      (valor) =>
        typeof valor === "string"
          ? vacioANull(valor.replace(/[.\s]/g, ""))
          : valor,
      z.string().nullable()
    ),
    aceptaTratamientoDatos: z.literal(true, {
      error: "Necesitamos tu autorización para guardar tus datos.",
    }),
  })
  .superRefine((datos, ctx) => {
    const { tipoIdentificacion: tipo, identificacion: numero } = datos
    if (numero && !tipo) {
      ctx.addIssue({
        code: "custom",
        path: ["tipoIdentificacion"],
        message: "Elige si es NIT o cédula.",
      })
      return
    }
    if (tipo && !numero) {
      ctx.addIssue({
        code: "custom",
        path: ["identificacion"],
        message: "Escribe el número o deja el tipo sin elegir.",
      })
      return
    }
    if (!tipo || !numero) return
    // El dígito de verificación con guion solo existe en el NIT.
    const patron = tipo === "NIT" ? /^\d{5,15}(-\d)?$/ : /^\d{5,15}$/
    if (!patron.test(numero)) {
      ctx.addIssue({
        code: "custom",
        path: ["identificacion"],
        message:
          tipo === "NIT"
            ? "Escribe solo números; el dígito de verificación va con guion (900123456-7)."
            : "Escribe solo los números de la cédula.",
      })
    }
  })

export type DatosContacto = z.output<typeof contactoSchema>
export type CampoContacto = keyof DatosContacto

/** Cuerpo EXACTO de `POST /contact-leads`: ni un campo más. */
export function aCuerpoApi(datos: DatosContacto) {
  return {
    nombre: datos.nombre,
    correo: datos.correo,
    celular: datos.celular,
    ciudad: datos.ciudad,
    tipoIdentificacion: datos.tipoIdentificacion,
    identificacion: datos.identificacion,
    aceptaTratamientoDatos: datos.aceptaTratamientoDatos,
    origen: ORIGEN_CONTACTO,
  }
}
