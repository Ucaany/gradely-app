import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LecturerAppSidebar } from '@/components/lecturer-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { LecturerHeader } from '@/components/lecturer-header'

export default async function LecturerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, email, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role !== 'lecturer') redirect('/login')

  return (
    <SidebarProvider>
      <LecturerAppSidebar
        user={{
          name: profile.full_name,
          email: profile.email,
          avatar: profile.avatar_url,
          role: 'lecturer',
        }}
      />
      <SidebarInset>
        <LecturerHeader />
        <main className="flex flex-1 flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
