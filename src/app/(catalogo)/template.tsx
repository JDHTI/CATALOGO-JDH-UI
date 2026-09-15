import { PageTransition } from "@/components/motion/page-transition"

/**
 * Remounts the content on each catalog navigation so the enter transition
 * plays while the persistent chrome remains visually anchored.
 */
export default function CatalogoTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return <PageTransition>{children}</PageTransition>
}
