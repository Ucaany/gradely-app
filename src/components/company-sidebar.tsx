"use client"

import * as React from "react"
import Link from "next/link"
import { Building2, LayoutDashboard, Users, Settings } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"

const companyNavMain = [
  {
    title: "Dashboard",
    url: "/company/dashboard",
    icon: LayoutDashboard,
  },
]

const companyNavTalent = [
  {
    title: "Cari Mahasiswa",
    url: "/company/students",
    icon: Users,
  },
]

const companyNavLainnya = [
  {
    title: "Profil Perusahaan",
    url: "/company/profile",
    icon: Settings,
  },
]

interface CompanyAppSidebarProps {
  user: {
    name: string
    email: string
    avatar?: string | null
    role?: 'student' | 'admin' | 'lecturer' | 'company'
  }
}

export function CompanyAppSidebar({ user, ...props }: CompanyAppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/company/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Gradely</span>
                  <span className="truncate text-xs">Portal Perusahaan</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={companyNavMain} label="Utama" />
        <NavMain items={companyNavTalent} label="Talent Scouting" />
        <NavMain items={companyNavLainnya} label="Pengaturan" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
