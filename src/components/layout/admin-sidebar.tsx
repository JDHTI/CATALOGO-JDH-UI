"use client"

import { adminNav } from "@/modules/admin/admin-nav"

import { Sidebar, type SidebarItem } from "./sidebar"

/**
 * Sidebar del panel de administración. La dirige `adminNav` (declarada en el
 * módulo admin), aparte del registro de módulos porque admin es su propia
 * superficie. Wrapper delgado sobre el `Sidebar` genérico.
 */
export function AdminSidebar() {
  const items: SidebarItem[] = adminNav.map((item) => ({
    href: item.href,
    label: item.label,
    icon: item.icon,
    exact: item.href === "/admin",
  }))

  return (
    <Sidebar
      brand={{ label: "Admin · JDH", href: "/admin" }}
      sections={[{ id: "admin", items }]}
    />
  )
}
