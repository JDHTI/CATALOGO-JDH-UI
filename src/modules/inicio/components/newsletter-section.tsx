"use client"

import * as React from "react"
import { AlertCircle, CircleAlert, MailCheck } from "lucide-react"
import { toast } from "sonner"

import { JdhButton } from "@/components/common/jdh-button"
import { Field, INVALID_CONTROL_CLASSES } from "@/components/forms/field"
import { JdhCheckbox } from "@/components/forms/jdh-checkbox"
import { JdhInput } from "@/components/forms/jdh-input"
import { JdhSelect } from "@/components/forms/jdh-select"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { enviarContacto, type ResultadoContacto } from "../server/acciones"

type Errores = Extract<ResultadoContacto, { ok: false }>["errores"]

/** Radix Select no admite un item con valor vacío: "ninguno" es "no la dio". */
const SIN_IDENTIFICACION = "ninguno"

const OPCIONES_IDENTIFICACION = [
  { value: "NIT", label: "NIT" },
  { value: "CC", label: "Cédula (CC)" },
  { value: SIN_IDENTIFICACION, label: "Prefiero no darla" },
]

/**
 * Formulario de contacto al pie del homepage, tipo newsletter: nombre,
 * correo, celular, ciudad e identificación opcional (NIT o cédula). Por ahora
 * solo se GUARDA en el API (`POST /contact-leads`); qué se hace con esos
 * contactos se decide después.
 *
 * La autorización de tratamiento de datos (Ley 1581 de 2012, habeas data) es
 * obligatoria y explícita: una casilla sin marcar por defecto, no un texto
 * legal que se da por aceptado al enviar. El API guarda cuándo se aceptó.
 *
 * Envía a la Server Action `enviarContacto`, que valida con el mismo esquema
 * y llama al API desde el servidor.
 *
 * La tarjeta va en TEMA INVERTIDO (oscura en claro, clara en oscuro) con el
 * ámbito `.tema-invertido` de `globals.css`, que reasigna los tokens: los
 * controles comunes se invierten solos, sin variantes "sobre tinta".
 */
export function NewsletterSection() {
  const [pendiente, startTransition] = React.useTransition()
  const [mensaje, setMensaje] = React.useState<string | null>(null)
  const [errores, setErrores] = React.useState<Errores>(undefined)
  const [enviado, setEnviado] = React.useState(false)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const texto = (campo: string) => String(form.get(campo) ?? "")
    const tipo = texto("tipoIdentificacion")
    const datos = {
      nombre: texto("nombre"),
      correo: texto("correo"),
      celular: texto("celular"),
      ciudad: texto("ciudad"),
      tipoIdentificacion: tipo === SIN_IDENTIFICACION ? "" : tipo,
      identificacion:
        tipo === SIN_IDENTIFICACION ? "" : texto("identificacion"),
      aceptaTratamientoDatos: form.get("aceptaTratamientoDatos") === "on",
      sitioWeb: texto("sitioWeb"),
    }

    setMensaje(null)
    setErrores(undefined)

    startTransition(async () => {
      const resultado = await enviarContacto(datos)
      if (!resultado.ok) {
        setMensaje(resultado.mensaje)
        setErrores(resultado.errores)
        return
      }
      setEnviado(true)
      toast.success("¡Listo! Guardamos tus datos.")
    })
  }

  return (
    <section
      aria-labelledby="contacto-newsletter-title"
      className="flex flex-col gap-8"
    >
      {/* Encabezado FUERA de la tarjeta, como el resto de secciones de la
          portada: la tarjeta es solo el formulario. */}
      <ScrollReveal>
        <div className="flex flex-col gap-2">
          <h2
            id="contacto-newsletter-title"
            className="text-2xl font-bold tracking-tight text-balance sm:text-3xl"
          >
            Recibe novedades del catálogo
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Déjanos tus datos y te contamos de nuevas referencias, promociones y
            lanzamientos de nuestros proveedores.
          </p>
        </div>
      </ScrollReveal>

      {/* `tema-invertido` (globals.css): la tarjeta se ve oscura en el tema
          claro y clara en el oscuro, con todos sus controles invertidos por
          tokens. `bg-background`/`text-foreground` la pintan con los tokens
          del ámbito, no con los de la página. */}
      <div className="tema-invertido rounded-[var(--jdh-radius-md)] border border-border bg-background p-6 text-foreground sm:p-8 lg:p-10">
        {enviado ? (
          <div role="status" className="flex flex-col items-start gap-3">
            <MailCheck className="size-8" aria-hidden="true" />
            <p className="text-lg font-medium">
              Gracias, ya tenemos tus datos.
            </p>
            <p className="max-w-[50ch] text-sm text-muted-foreground">
              Te escribiremos cuando tengamos novedades para ti.
            </p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            noValidate
            className="flex flex-col gap-6"
            aria-describedby={mensaje ? "contacto-newsletter-error" : undefined}
          >
            {mensaje ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription id="contacto-newsletter-error">
                  {mensaje}
                </AlertDescription>
              </Alert>
            ) : null}

            {/* Seis campos a lo ancho: tres columnas en escritorio (dos filas
                parejas), dos en tablet, uno en móvil. */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Nombre" required error={errores?.nombre}>
                <JdhInput
                  name="nombre"
                  autoComplete="name"
                  required
                  placeholder="María Restrepo"
                />
              </Field>

              <Field
                label="Correo electrónico"
                required
                error={errores?.correo}
              >
                <JdhInput
                  name="correo"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="compras@tuempresa.com"
                />
              </Field>

              <Field label="Celular" required error={errores?.celular}>
                <JdhInput
                  name="celular"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  required
                  placeholder="300 123 4567"
                />
              </Field>

              <Field label="Ciudad" required error={errores?.ciudad}>
                <JdhInput
                  name="ciudad"
                  autoComplete="address-level2"
                  required
                  placeholder="Medellín"
                />
              </Field>

              <Field
                label="Tipo de identificación"
                hint="Opcional"
                error={errores?.tipoIdentificacion}
              >
                <JdhSelect
                  name="tipoIdentificacion"
                  options={OPCIONES_IDENTIFICACION}
                  placeholder="NIT o cédula"
                />
              </Field>

              <Field
                label="Número de identificación"
                hint="Opcional. El NIT, con dígito de verificación."
                error={errores?.identificacion}
              >
                <JdhInput
                  name="identificacion"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="900123456-7"
                />
              </Field>
            </div>

            {/* Trampa para bots: fuera de pantalla, fuera del orden de
                tabulación y oculta a lectores de pantalla. */}
            <div
              aria-hidden="true"
              className="absolute -left-[9999px] h-px w-px overflow-hidden"
            >
              <label>
                Sitio web
                <input
                  name="sitioWeb"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </div>

            {/* Pie: autorización a la izquierda, en letra pequeña (es texto
                legal, no parte del mensaje), y el envío a la derecha. */}
            <div className="flex flex-col gap-5 border-t border-border pt-6 md:flex-row md:items-center md:justify-between md:gap-10">
              <div className="flex max-w-2xl flex-col gap-1 [&_label]:text-xs [&_label]:leading-snug [&_p]:text-xs">
                <JdhCheckbox
                  name="aceptaTratamientoDatos"
                  required
                  aria-invalid={
                    errores?.aceptaTratamientoDatos ? true : undefined
                  }
                  // Error monocromo (DESIGN.md §4.5): borde de 2px en tinta,
                  // no el rojo que shadcn pone a `aria-invalid`.
                  className={
                    errores?.aceptaTratamientoDatos
                      ? INVALID_CONTROL_CLASSES
                      : undefined
                  }
                  aria-describedby={
                    errores?.aceptaTratamientoDatos
                      ? "contacto-autorizacion-error"
                      : undefined
                  }
                  label="Autorizo el tratamiento de mis datos personales"
                  description="Juan D. Hoyos Distribuciones los usará para contactarme con información comercial, según la Ley 1581 de 2012."
                />
                <p className="pl-7 text-muted-foreground">
                  Consulta la{" "}
                  {/* `<a>` plano, como el footer: la página aún no existe y
                      `typedRoutes` no aceptaría la ruta en un `<Link>`. */}
                  <a
                    href="/privacidad"
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    política de tratamiento de datos
                  </a>
                  .
                </p>
                {errores?.aceptaTratamientoDatos ? (
                  <p
                    id="contacto-autorizacion-error"
                    className="flex items-center gap-1.5 pl-7 font-medium text-foreground"
                  >
                    <CircleAlert
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    {errores.aceptaTratamientoDatos}
                  </p>
                ) : null}
              </div>

              <JdhButton
                type="submit"
                size="lg"
                loading={pendiente}
                className="w-full shrink-0 md:w-auto"
              >
                Quiero recibir novedades
              </JdhButton>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
