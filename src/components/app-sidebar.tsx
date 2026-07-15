"use client"

import * as React from "react"
import Link from "next/link"
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  Building2,
  MessageSquare,
  UserCheck,
  Sparkles,
  Bell,
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

const adminNavMain = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
  },
]

const adminNavPengguna = [
  {
    title: "Mahasiswa",
    url: "/admin/users/students",
    icon: Users,
    items: [
      { title: "Daftar Mahasiswa", url: "/admin/users/students" },
      { title: "Tambah Mahasiswa", url: "/admin/users/students/new" },
      { title: "Import CSV", url: "/admin/users/import" },
    ],
  },
  {
    title: "Dosen Wali",
    url: "/admin/users/lecturers",
    icon: UserCheck,
    items: [
      { title: "Daftar Dosen", url: "/admin/users/lecturers" },
      { title: "Tambah Dosen", url: "/admin/users/lecturers/new" },
    ],
  },
  {
    title: "Perusahaan",
    url: "/admin/users/companies",
    icon: Building2,
    items: [
      { title: "Daftar Perusahaan", url: "/admin/users/companies" },
      { title: "Tambah Perusahaan", url: "/admin/users/companies/new" },
    ],
  },
]

const adminNavAkademik = [
  {
    title: "Program Studi",
    url: "/admin/study-programs",
    icon: BookOpen,
  },
  {
    title: "Aturan Akademik",
    url: "/admin/academic-rules",
    icon: BookOpen,
  },
  {
    title: "Skill & Karir",
    url: "/admin/skills-career",
    icon: Sparkles,
  },
]

const adminNavKonfigurasi = [
  {
    title: "Kirim Notifikasi",
    url: "/admin/notifications",
    icon: Bell,
  },
  {
    title: "Konfigurasi Fonnte",
    url: "/admin/settings",
    icon: MessageSquare,
  },
  {
    title: "Pengaturan Umum",
    url: "/admin/settings/general",
    icon: Settings,
  },
]

interface AdminAppSidebarProps {
  user: {
    name: string
    email: string
    avatar?: string | null
    role?: 'student' | 'admin' | 'lecturer' | 'company'
  }
}

export function AdminAppSidebar({ user, ...props }: AdminAppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GraduationCap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Gradely</span>
                  <span className="truncate text-xs">Admin Panel</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={adminNavMain} label="Utama" />
        <NavMain items={adminNavPengguna} label="Pengguna" />
        <NavMain items={adminNavAkademik} label="Akademik" />
        <NavMain items={adminNavKonfigurasi} label="Konfigurasi" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
