import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendAndLog, messageTemplates } from '@/lib/waha'
import type { ApiResponse } from '@/types'

async function insertNotification(userId: string, title: string, message: string) {
  const supabase = createServiceClient()
  await supabase.from('notifications').insert({ user_id: userId, title, message, is_read: false })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role, university_id').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const body = await request.json()
    const { type } = body
    const uniId: string = profile.university_id

    if (!uniId) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'university_id diperlukan', success: false }, { status: 400 })
    }

    if (type === 'academic_warning') {
      const { data: atRisk } = await supabase
        .from('users')
        .select('id, full_name, phone, current_semester')
        .eq('role', 'student')
        .eq('university_id', uniId)
        .eq('is_active', true)
        .not('phone', 'is', null)

      if (!atRisk || atRisk.length === 0) {
        return NextResponse.json<ApiResponse>({ data: { sent: 0, skipped: 0, failed: 0 }, error: null, success: true })
      }

      const studentIds = atRisk.map((s) => s.id)
      const { data: allGrades } = await supabase
        .from('student_grades')
        .select('student_id, credits, grade_points')
        .in('student_id', studentIds)

      const gradesByStudent = (allGrades ?? []).reduce<Record<string, { credits: number; grade_points: number }[]>>(
        (acc, g) => {
          acc[g.student_id] ??= []
          acc[g.student_id].push(g)
          return acc
        },
        {}
      )

      let sent = 0
      let skipped = 0
      let failed = 0

      await Promise.allSettled(
        atRisk.map(async (student) => {
          const grades = gradesByStudent[student.id]
          if (!grades || grades.length === 0) { skipped++; return }

          const totalPoints = grades.reduce((sum, g) => sum + g.grade_points * g.credits, 0)
          const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0)
          const ipk = totalCredits > 0 ? totalPoints / totalCredits : 0

          if (ipk >= 2.0) { skipped++; return }

          try {
            const msg = messageTemplates.academicWarning(
              student.full_name,
              ipk,
              student.current_semester ?? 1
            )
            await sendAndLog(uniId, {
              phone: student.phone!,
              message: msg,
              recipientId: student.id,
            })
            await insertNotification(
              student.id,
              'Peringatan Akademik',
              `IPK kamu saat ini ${ipk.toFixed(2)} pada semester ${student.current_semester ?? 1}. Segera konsultasikan dengan dosen wali.`
            )
            sent++
          } catch {
            failed++
          }
        })
      )

      return NextResponse.json<ApiResponse>({ data: { sent, skipped, failed }, error: null, success: true })
    }

    if (type === 'semester_reminder') {
      const { semester, academic_year } = body
      if (!semester || !academic_year) {
        return NextResponse.json<ApiResponse>(
          { data: null, error: 'semester dan academic_year diperlukan untuk semester_reminder', success: false },
          { status: 400 }
        )
      }

      const { data: students } = await supabase
        .from('users')
        .select('id, full_name, phone, current_semester')
        .eq('role', 'student')
        .eq('university_id', uniId)
        .eq('is_active', true)
        .not('phone', 'is', null)

      if (!students || students.length === 0) {
        return NextResponse.json<ApiResponse>({ data: { sent: 0, failed: 0 }, error: null, success: true })
      }

      const results = await Promise.allSettled(
        students.map(async (s) => {
          await sendAndLog(uniId, {
            phone: s.phone!,
            message: messageTemplates.semesterReminder(s.full_name, semester, academic_year),
            recipientId: s.id,
          })
          await insertNotification(
            s.id,
            `Pengingat Semester ${semester}`,
            `Semester ${semester} tahun ajaran ${academic_year} segera dimulai. Pastikan kamu telah mengisi KRS dan memperbarui data akademik di Gradely.`
          )
        })
      )

      const sent = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length
      const skipped = 0
      return NextResponse.json<ApiResponse>({ data: { sent, skipped, failed }, error: null, success: true })
    }

    if (type === 'test') {
      const { phone } = body
      if (!phone) {
        return NextResponse.json<ApiResponse>(
          { data: null, error: 'phone diperlukan untuk test', success: false },
          { status: 400 }
        )
      }
      const result = await sendAndLog(uniId, {
        phone,
        message: messageTemplates.testMessage(),
      })
      if (!result.success) {
        return NextResponse.json<ApiResponse>({ data: null, error: result.error ?? 'Gagal', success: false }, { status: 400 })
      }
      return NextResponse.json<ApiResponse>({ data: { sent: true }, error: null, success: true })
    }

    return NextResponse.json<ApiResponse>(
      { data: null, error: `Tipe notifikasi tidak dikenal: ${type}`, success: false },
      { status: 400 }
    )
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}
