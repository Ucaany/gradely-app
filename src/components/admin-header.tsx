"use client"

import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { DarkModeToggle } from "@/components/dark-mode-toggle"

const backRoutes: Record<string, { label: string; href: string }> = {
  "/admin/users/students/new": { label: "Mahasiswa", href: "/admin/users/students" },
  "/admin/users/lecturers/new": { label: "Dosen Wali", href: "/admin/users/lecturers" },
  "/admin/users/companies/new": { label: "Perusahaan", href: "/admin/users/companies" },
  "/admin/users/import": { label: "Mahasiswa", href: "/admin/users/students" },
  "/admin/settings/general": { label: "Konfigurasi", href: "/admin/settings" },
}

export function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()

  const isStudentDetail = /^\/admin\/users\/students\/[^/]+$/.test(pathname) && pathname !== "/admin/users/students/new"
  const isLecturerDetail = /^\/admin\/users\/lecturers\/[^/]+$/.test(pathname) && pathname !== "/admin/users/lecturers/new"

  const staticBack = backRoutes[pathname]
  const dynamicBack = isStudentDetail
    ? { label: "Mahasiswa", href: "/admin/users/students" }
    : isLecturerDetail
    ? { label: "Dosen Wali", href: "/admin/users/lecturers" }
    : null

  const back = staticBack ?? dynamicBack

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        {back ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 px-2 text-muted-foreground hover:text-foreground"
            onClick={() => router.push(back.href)}
          >
            <ArrowLeft className="h-4 w-4" />
            {back.label}
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">ISI Yogyakarta · Admin</span>
        )}
      </div>
      <div className="ml-auto">
        <DarkModeToggle />
      </div>
    </header>
  )
}
