import type { Metadata, Viewport } from "next"

import "./globals.css"

import { LenisProvider } from "@/components/providers/lenis-provider"
import { PwaRegister } from "@/components/providers/pwa-register"
import { QueryProvider } from "@/components/providers/query-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  // Isotipo (mark) de JDH en la pestaña del navegador. NO hay
  // `src/app/favicon.ico` (se eliminó a propósito): esa convención de archivo
  // genera su propio `<link rel="icon">` en paralelo a este, y algunos
  // navegadores priorizan el `.ico` automático por encima de este `icons`
  // explícito — un solo favicon, sin competencia. `mark` en vez de `compact`:
  // a tamaño de pestaña el texto del compact es ilegible, el isotipo solo se
  // reconoce mejor.
  icons: {
    icon: [{ url: "/logos/mark-white.png", type: "image/png" }],
    apple: "/logos/mark-white.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1D1D1B" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <LenisProvider>
            <QueryProvider>
              <TooltipProvider>{children}</TooltipProvider>
              <Toaster />
            </QueryProvider>
          </LenisProvider>
        </ThemeProvider>
        <PwaRegister />
      </body>
    </html>
  )
}
