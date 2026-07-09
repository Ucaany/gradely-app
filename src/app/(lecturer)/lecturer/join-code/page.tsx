import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Users, Info } from 'lucide-react'
import { JoinCodeClient } from '@/components/lecturer/join-code-client'

export default async function LecturerJoinCodePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: advisorRows } = await supabase
    .from('advisor_students')
    .select('join_code')
    .eq('lecturer_id', user.id)
    .limit(1)

  const joinCode = advisorRows?.[0]?.join_code ?? null

  const { data: totalStudents } = await supabase
    .from('advisor_students')
    .select('id', { count: 'exact' })
    .eq('lecturer_id', user.id)

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kode Bergabung</h1>
        <p className="text-sm text-muted-foreground">
          Bagikan kode ini ke mahasiswa agar mereka dapat terhubung ke bimbingan Anda
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-4 w-4 text-violet-500" />
              Kode Bergabung
            </CardTitle>
            <CardDescription>
              Mahasiswa memasukkan kode ini di halaman Invite Token untuk terhubung ke bimbingan Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JoinCodeClient initialCode={joinCode} lecturerId={user.id} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Statistik Bimbingan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalStudents?.length ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Total mahasiswa terhubung</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Cara Penggunaan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">1</span>
                <p>Buat atau generate kode bergabung di panel kiri</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">2</span>
                <p>Bagikan kode tersebut ke mahasiswa bimbingan Anda</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">3</span>
                <p>Mahasiswa membuka menu <strong>Pengaturan → Invite Token</strong> dan memasukkan kode</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">4</span>
                <p>Mahasiswa otomatis terdaftar dalam daftar bimbingan Anda</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
