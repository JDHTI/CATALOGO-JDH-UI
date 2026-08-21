/**
 * Glifo de WhatsApp dibujado a mano: esta versión de `lucide-react` no
 * incluye íconos de marca (los quitó por licenciamiento). `currentColor` para
 * que herede el token de texto del contenedor — monocromo, como exige
 * DESIGN.md, nada de color de marca en el chrome.
 */
export function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 21l1.65 -4.35a8.5 8.5 0 1 1 3.2 3.2L3 21" />
      <path d="M9 10a.5 .5 0 0 0 1 0V9a.5 .5 0 0 0 -1 0v1z" />
      <path d="M14 10a.5 .5 0 0 0 1 0V9a.5 .5 0 0 0 -1 0v1z" />
      <path d="M9.5 13.5a.5 .5 0 0 0 .5 .5h4a.5 .5 0 0 0 .5 -.5" />
    </svg>
  )
}
