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
  "/company/dashboard": [{ label: "Dashboard" }],
  "/company/students": [{ label: "Dashboard", href: "/company/dashboard" }, { label: "Cari Mahasiswa" }],
  "/company/profile": [{ label: "Dashboard", href: "/company/dashboard" }, { label: "Profil Perusahaan" }],
}

export function CompanyHeader() {
  const pathname = usePathname()
  const router = useRouter()

  const breadcrumbs = ROUTE_BREADCRUMBS[pathname] ?? [{ label: "Dashboard" }]
  const backHref = pathname !== "/company/dashboard" && pathname !== "/company/students"
    ? "/company/dashboard"
    : undefined

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
