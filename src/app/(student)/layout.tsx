import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Jika bukan student, tampilkan pesan akses ditolak
  if (profile.role !== 'student') {
    const roleNames: Record<string, string> = {
      admin: 'Admin Kampus',
      lecturer: 'Dosen',
      company: 'Mitra Industri',
    }

    const roleDashboards: Record<string, string> = {
      admin: '/admin/dashboard',
      lecturer: '/lecturer/dashboard',
      company: '/company/dashboard',
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-muted">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="shadow-lg">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold mb-2">Akses Ditolak</AlertTitle>
            <AlertDescription className="space-y-4">
              <p className="text-sm">
                Anda login sebagai <strong>{roleNames[profile.role] || profile.role}</strong>. 
                Halaman ini hanya dapat diakses oleh <strong>Mahasiswa</strong>.
              </p>
              <div className="flex flex-col gap-2">
                <Link href={roleDashboards[profile.role] || '/login'}>
                  <Button className="w-full" variant="default">
                    Ke Dashboard {roleNames[profile.role]}
                  </Button>
                </Link>
                <form action="/api/auth/signout" method="POST">
                  <Button type="submit" className="w-full" variant="outline">
                    Logout
                  </Button>
                </form>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
