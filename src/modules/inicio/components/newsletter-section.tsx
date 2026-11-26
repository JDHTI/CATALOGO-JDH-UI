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
 * y llama al API desde el servidor. Va sobre el lienzo claro y no sobre una
 * banda negra: `JdhInput` no tiene variante sobre tinta.
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
      className="grid gap-8 rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12 lg:p-12"
    >
      <ScrollReveal>
        <div className="flex flex-col gap-3">
          <h2
            id="contacto-newsletter-title"
            className="text-2xl font-bold tracking-tight text-balance sm:text-3xl"
          >
            Recibe novedades del catálogo
          </h2>
          <p className="max-w-[45ch] text-sm text-muted-foreground">
            Déjanos tus datos y te contamos de nuevas referencias, promociones y
            lanzamientos de nuestros proveedores.
          </p>
        </div>
      </ScrollReveal>

      {enviado ? (
        <div
          role="status"
          className="flex flex-col items-start gap-3 self-center"
        >
          <MailCheck className="size-8" aria-hidden="true" />
          <p className="text-lg font-medium">Gracias, ya tenemos tus datos.</p>
          <p className="max-w-[50ch] text-sm text-muted-foreground">
            Te escribiremos cuando tengamos novedades para ti.
          </p>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          noValidate
          className="grid gap-5 md:grid-cols-2"
          aria-describedby={mensaje ? "contacto-newsletter-error" : undefined}
        >
          {mensaje ? (
            <Alert variant="destructive" className="md:col-span-2">
              <AlertCircle />
              <AlertDescription id="contacto-newsletter-error">
                {mensaje}
              </AlertDescription>
            </Alert>
          ) : null}

          <Field label="Nombre" required error={errores?.nombre}>
            <JdhInput
              name="nombre"
              autoComplete="name"
              required
              placeholder="María Restrepo"
            />
          </Field>

          <Field label="Correo electrónico" required error={errores?.correo}>
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
            hint="Opcional. NIT con dígito de verificación: 900123456-7"
            error={errores?.identificacion}
          >
            <JdhInput
              name="identificacion"
              inputMode="numeric"
              autoComplete="off"
              placeholder="900123456-7"
            />
          </Field>

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

          <div className="flex flex-col gap-1 md:col-span-2">
            <JdhCheckbox
              name="aceptaTratamientoDatos"
              required
              aria-invalid={errores?.aceptaTratamientoDatos ? true : undefined}
              // Error monocromo (DESIGN.md §4.5): borde de 2px en tinta, no el
              // rojo que shadcn pone a `aria-invalid`.
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
            <p className="pl-7 text-sm text-muted-foreground">
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
                className="flex items-center gap-1.5 pl-7 text-sm font-medium text-foreground"
              >
                <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                {errores.aceptaTratamientoDatos}
              </p>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <JdhButton
              type="submit"
              size="lg"
              loading={pendiente}
              className="w-full sm:w-auto"
            >
              Quiero recibir novedades
            </JdhButton>
          </div>
        </form>
      )}
    </section>
  )
}
