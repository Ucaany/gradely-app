"use client"

import * as React from "react"
import Link from "next/link"
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  AlertTriangle,
  QrCode,
  Settings,
} from "lucide-react"
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

const lecturerNavMain = [
  {
    title: "Dashboard",
    url: "/lecturer/dashboard",
    icon: LayoutDashboard,
  },
]

const lecturerNavBimbingan = [
  {
    title: "Mahasiswa Bimbingan",
    url: "/lecturer/students",
    icon: Users,
  },
  {
    title: "Monitoring Risiko",
    url: "/lecturer/risk",
    icon: AlertTriangle,
  },
]

const lecturerNavLainnya = [
  {
    title: "Kode Bergabung",
    url: "/lecturer/join-code",
    icon: QrCode,
  },
  {
    title: "Pengaturan",
    url: "/lecturer/settings",
    icon: Settings,
  },
]

interface LecturerAppSidebarProps {
  user: {
    name: string
    email: string
    avatar?: string | null
    role?: 'student' | 'admin' | 'lecturer' | 'company'
  }
}

export function LecturerAppSidebar({ user, ...props }: LecturerAppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/lecturer/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GraduationCap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Gradely</span>
                  <span className="truncate text-xs">Portal Dosen Wali</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={lecturerNavMain} label="Utama" />
        <NavMain items={lecturerNavBimbingan} label="Bimbingan" />
        <NavMain items={lecturerNavLainnya} label="Lainnya" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
