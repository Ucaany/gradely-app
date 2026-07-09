"use client"

import * as React from "react"
import Link from "next/link"
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Target,
  Briefcase,
  Heart,
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

const studentNavMain = [
  {
    title: "Dashboard",
    url: "/student/dashboard",
    icon: LayoutDashboard,
  },
]

const studentNavAkademik = [
  {
    title: "Nilai Akademik",
    url: "/student/grades",
    icon: BookOpen,
  },
  {
    title: "Target Kelulusan",
    url: "/student/target",
    icon: Target,
  },
]

const studentNavKarier = [
  {
    title: "Portofolio",
    url: "/student/portfolio",
    icon: Briefcase,
  },
  {
    title: "Minat Karier",
    url: "/student/career",
    icon: Heart,
  },
]

interface StudentAppSidebarProps {
  user: {
    name: string
    email: string
    avatar?: string | null
  }
}

export function StudentAppSidebar({ user, ...props }: StudentAppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/student/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GraduationCap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Gradely</span>
                  <span className="truncate text-xs">Portal Mahasiswa</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={studentNavMain} label="Utama" />
        <NavMain items={studentNavAkademik} label="Akademik" />
        <NavMain items={studentNavKarier} label="Karier" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
