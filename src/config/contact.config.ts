/**
 * Datos compartidos por la franja superior y el footer.
 * Email y WhatsApp siguen pendientes de confirmación comercial.
 */
export const contactConfig = {
  phone: "(604) 4448018",
  phoneHref: "tel:+576044448018",
  /** Email de soporte comercial mostrado en la barra de contacto del header. */
  email: "ventas@jdhdistribuciones.com",
  emailHref: "mailto:ventas@jdhdistribuciones.com",
  /**
   * Enlace directo a WhatsApp Business (wa.me). El `text` va URL-encoded;
   * el número en `whatsappNumber` sin "+", espacios ni símbolos.
   * Lo usan la franja de contacto y el botón flotante (`WhatsappFlotante`).
   * PENDIENTE: reemplazar el número de relleno por el real.
   */
  whatsappNumber: "573000000000",
  whatsappUrl:
    "https://wa.me/573000000000?text=Hola%20JDH%2C%20quiero%20informaci%C3%B3n%20sobre%20el%20cat%C3%A1logo",
  /** Sede destacada en el header; el listado completo vive en `siteConfig.sedes`. */
  location: "Itagüí, Antioquia",
  address: "Cra 42 #54 A 155 Int C Oficina 501",
  instagramUrl: "https://www.instagram.com/juand.hoyosdistribuciones",
} as const
