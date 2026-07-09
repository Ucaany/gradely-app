import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentAppSidebar } from '@/components/student-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { StudentHeader } from '@/components/student-header'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, email, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role !== 'student') redirect('/login')

  return (
    <SidebarProvider>
      <StudentAppSidebar
        user={{
          name: profile.full_name,
          email: profile.email,
          avatar: profile.avatar_url,
        }}
      />
      <SidebarInset>
        <StudentHeader />
        <main className="flex flex-1 flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
