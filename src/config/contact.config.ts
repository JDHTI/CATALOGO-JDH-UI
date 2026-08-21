/**
 * Datos de contacto mostrados en la franja superior del header (y,
 * eventualmente, en el footer). Valores de MARCADOR DE POSICIÓN — sustituir
 * por los reales de la compañía antes de producción.
 */
export const contactConfig = {
  phone: "+57 604 000 0000",
  phoneHref: "tel:+576040000000",
  /** Email de soporte comercial mostrado en la barra de contacto del header. */
  email: "ventas@jdhdistribuciones.com",
  emailHref: "mailto:ventas@jdhdistribuciones.com",
  /**
   * Enlace directo a WhatsApp Business (wa.me). El `text` va URL-encoded;
   * el número en `whatsappNumber` sin "+", espacios ni símbolos.
   */
  whatsappNumber: "573000000000",
  whatsappUrl:
    "https://wa.me/573000000000?text=Hola%20JDH%2C%20quiero%20informaci%C3%B3n%20sobre%20el%20cat%C3%A1logo",
  /** Sede destacada en el header; el listado completo vive en `siteConfig.sedes`. */
  location: "Medellín, Colombia",
  instagramUrl: "https://www.instagram.com/jdhdistribuciones",
} as const
