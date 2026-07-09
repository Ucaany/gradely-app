import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminAppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AdminHeader } from '@/components/admin-header'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, email, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <AdminAppSidebar
        user={{
          name: profile.full_name,
          email: profile.email,
          avatar: profile.avatar_url,
          role: 'admin',
        }}
      />
      <SidebarInset>
        <AdminHeader />
        <main className="flex flex-1 flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
