"use client"

import { usePathname, useRouter } from "next/navigation"
import { ChevronRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { DarkModeToggle } from "@/components/dark-mode-toggle"

interface BreadcrumbItem {
  label: string
  href?: string
}

const ROUTE_BREADCRUMBS: Record<string, BreadcrumbItem[]> = {
  "/student/dashboard": [{ label: "Dashboard" }],
  "/student/profile": [{ label: "Dashboard", href: "/student/dashboard" }, { label: "Pengaturan", href: "/student/settings" }, { label: "Profil Saya" }],
  "/student/settings": [{ label: "Dashboard", href: "/student/dashboard" }, { label: "Pengaturan" }],
  "/student/settings/invite": [{ label: "Dashboard", href: "/student/dashboard" }, { label: "Pengaturan", href: "/student/settings" }, { label: "Invite Token" }],
  "/student/grades": [{ label: "Dashboard", href: "/student/dashboard" }, { label: "Nilai Akademik" }],
  "/student/grades/import": [{ label: "Dashboard", href: "/student/dashboard" }, { label: "Nilai Akademik", href: "/student/grades" }, { label: "Import KHS" }],
  "/student/target": [{ label: "Dashboard", href: "/student/dashboard" }, { label: "Target Kelulusan" }],
  "/student/portfolio": [{ label: "Dashboard", href: "/student/dashboard" }, { label: "Portofolio" }],
  "/student/career": [{ label: "Dashboard", href: "/student/dashboard" }, { label: "Minat Karier" }],
}

const BACK_ROUTES: Record<string, string> = {
  "/student/grades/import": "/student/grades",
  "/student/settings/invite": "/student/settings",
  "/student/profile": "/student/settings",
}

export function StudentHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const breadcrumbs = ROUTE_BREADCRUMBS[pathname] ?? [{ label: "Dashboard" }]
  const backHref = BACK_ROUTES[pathname]

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4 shrink-0" />

        {backHref && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => router.push(backHref)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4 shrink-0" />
          </>
        )}

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm min-w-0">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1
            return (
              <div key={index} className="flex items-center gap-1 min-w-0">
                {index > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                )}
                {item.href && !isLast ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-1.5 py-0.5 text-sm text-muted-foreground hover:text-foreground font-normal"
                    onClick={() => router.push(item.href!)}
                  >
                    {item.label}
                  </Button>
                ) : (
                  <span className={`truncate px-1.5 ${isLast ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {item.label}
                  </span>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      <div className="ml-auto shrink-0">
        <DarkModeToggle />
      </div>
    </header>
  )
}
