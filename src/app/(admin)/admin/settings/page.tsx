import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WahaSettingsForm } from '@/components/admin/waha-settings-form'
import { MessageSquare } from 'lucide-react'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: university } = await supabase
    .from('universities')
    .select('id')
    .limit(1)
    .single()

  const universityId = university?.id ?? ''

  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .eq('university_id', universityId)
    .in('key', ['fonnte_token'])

  const settingsMap = Object.fromEntries(
    (settings ?? []).map((s) => [s.key, s.value])
  )

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Konfigurasi Fonnte</h1>
            <p className="text-sm text-muted-foreground">
              Atur koneksi WhatsApp via Fonnte API untuk notifikasi otomatis
            </p>
          </div>
        </div>

        <WahaSettingsForm
          universityId={universityId}
          defaultValues={{
            fonnte_token: settingsMap['fonnte_token'] ?? '',
          }}
        />
      </div>
    </div>
  )
}
