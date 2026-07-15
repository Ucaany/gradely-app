import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationTriggerPanel } from '@/components/admin/notification-trigger-panel'
import { Bell } from 'lucide-react'

export default async function AdminNotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, university_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/login')

  const { data: university } = await supabase
    .from('universities')
    .select('id')
    .limit(1)
    .single()

  const universityId = university?.id ?? profile.university_id ?? ''

  const { count: eligibleCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'student')
    .eq('university_id', universityId)
    .eq('is_active', true)
    .not('phone', 'is', null)

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kirim Notifikasi</h1>
          <p className="text-sm text-muted-foreground">
            Kirim notifikasi WhatsApp & inbox ke mahasiswa secara massal
          </p>
        </div>
      </div>

      <NotificationTriggerPanel
        universityId={universityId}
        eligibleStudentCount={eligibleCount ?? 0}
      />
    </div>
  )
}
