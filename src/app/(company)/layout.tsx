import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompanyAppSidebar } from '@/components/company-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { CompanyHeader } from '@/components/company-header'

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, email, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role !== 'company') redirect('/login')

  return (
    <SidebarProvider>
      <CompanyAppSidebar
        user={{
          name: profile.full_name,
          email: profile.email,
          avatar: profile.avatar_url,
          role: 'company',
        }}
      />
      <SidebarInset>
        <CompanyHeader />
        <main className="flex flex-1 flex-col items-center">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
