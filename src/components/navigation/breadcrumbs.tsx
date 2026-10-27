import { cn } from "@/lib/utils"

import { Fragment } from "react"
import type { Route } from "next"
import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export interface BreadcrumbEntry {
  label: string
  /** Omit on the current (last) page. */
  href?: `/${string}`
}

/**
 * Route breadcrumbs (DESIGN.md §4.7). The last entry — or any entry without an
 * `href` — renders as the current page. Uses a "/" separator per the mockup.
 */
export function Breadcrumbs({
  items,
  className,
  prominent = false,
}: {
  items: BreadcrumbEntry[]
  className?: string
  prominent?: boolean
}) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList
        className={cn("text-xs", prominent && "text-base font-bold md:text-lg")}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <Fragment key={item.href ?? item.label}>
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage
                    className={prominent ? "font-bold" : undefined}
                  >
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href as Route}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast ? <BreadcrumbSeparator>/</BreadcrumbSeparator> : null}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
