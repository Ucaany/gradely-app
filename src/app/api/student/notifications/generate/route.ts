import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { calculateAcademicSummary } from '@/lib/utils/academic'
import type { ApiResponse, AcademicRule, StudentGrade } from '@/types'

const DEFAULT_RULE: AcademicRule = {
  id: '', university_id: '', study_program_id: null,
  total_sks_graduation: 144, normal_semester: 8, max_semester: 14,
  min_gpa: 2.0, max_sks_per_semester: 24, min_sks_per_semester: 12,
  passing_grade: 'D',
  grade_scale: { A: 4.0, 'A-': 3.75, BA: 3.5, 'B+': 3.25, B: 3.0, 'B-': 2.75, C: 2.0, D: 1.0, E: 0.0 },
  sks_rules_by_ipk: { semester_1_2_max: 20, tiers: [{ ipk_min: 3.00, ipk_max: 4.00, sks_min: 22, sks_max: 24 }, { ipk_min: 2.50, ipk_max: 2.99, sks_min: 20, sks_max: 22 }, { ipk_min: 2.00, ipk_max: 2.49, sks_min: 16, sks_max: 20 }, { ipk_min: 1.50, ipk_max: 1.99, sks_min: 12, sks_max: 16 }, { ipk_min: 0.00, ipk_max: 1.49, sks_min: 2, sks_max: 12 }] },
  created_at: '', updated_at: '',
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role, university_id, study_program_id, current_semester, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'student') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const [gradesRes, targetRes] = await Promise.all([
      supabase.from('student_grades').select('*').eq('student_id', user.id),
      supabase.from('student_targets').select('target_semester, target_ipk').eq('student_id', user.id).maybeSingle(),
    ])

    const grades = (gradesRes.data ?? []) as StudentGrade[]

    let rule: AcademicRule | null = null
    if (profile.university_id) {
      if (profile.study_program_id) {
        const { data } = await supabase.from('academic_rules').select('*')
          .eq('university_id', profile.university_id)
          .eq('study_program_id', profile.study_program_id).single()
        rule = data
      }
      if (!rule) {
        const { data } = await supabase.from('academic_rules').select('*')
          .eq('university_id', profile.university_id)
          .is('study_program_id', null).single()
        rule = data
      }
    }
    const effectiveRule = rule ?? DEFAULT_RULE
    const currentSemester = profile.current_semester ?? 1
    const targetSemester = targetRes.data?.target_semester ?? effectiveRule.normal_semester
    const summary = calculateAcademicSummary(grades, currentSemester, targetSemester, effectiveRule)

    const serviceClient = createServiceClient()
    const generated: { title: string; message: string }[] = []

    // Cek apakah notifikasi serupa sudah ada dalam 7 hari terakhir untuk menghindari duplikat
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentNotifs } = await supabase
      .from('notifications')
      .select('title')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo)

    const recentTitles = new Set((recentNotifs ?? []).map(n => n.title))

    // [1] IPK di bawah minimum
    if (grades.length > 0 && summary.gpa < effectiveRule.min_gpa) {
      const title = 'Peringatan: IPK di Bawah Minimum'
      if (!recentTitles.has(title)) {
        generated.push({
          title,
          message: `IPK kamu saat ini ${summary.gpa.toFixed(2)}, di bawah batas minimum kelulusan (${effectiveRule.min_gpa.toFixed(2)}). Segera konsultasikan dengan dosen wali dan tingkatkan nilai semester berikutnya.`,
        })
      }
    }

    // [2] Status darurat akademik
    if (summary.academic_status === 'critical') {
      const title = 'Status Akademik: Darurat'
      if (!recentTitles.has(title)) {
        generated.push({
          title,
          message: `Status akademikmu saat ini DARURAT. IPK ${summary.gpa.toFixed(2)}, SKS lulus ${summary.total_sks_earned}/${summary.total_sks_required}. Segera hubungi dosen wali untuk langkah penyelamatan studi.`,
        })
      }
    } else if (summary.academic_status === 'recovery_mode') {
      const title = 'Status Akademik: Butuh Pemulihan'
      if (!recentTitles.has(title)) {
        generated.push({
          title,
          message: `Progres SKS kamu jauh di bawah target (${summary.total_sks_earned}/${summary.total_sks_required} SKS). Kamu perlu mengambil lebih banyak SKS per semester agar bisa lulus tepat waktu.`,
        })
      }
    }

    // [3] Ada mata kuliah mengulang
    const retakeCourses = grades.filter(g => g.is_retake)
    if (retakeCourses.length > 0) {
      const title = `${retakeCourses.length} Mata Kuliah Perlu Diulang`
      if (!recentTitles.has(title)) {
        const names = retakeCourses.slice(0, 3).map(g => g.course_name).join(', ')
        const more = retakeCourses.length > 3 ? ` dan ${retakeCourses.length - 3} lainnya` : ''
        generated.push({
          title,
          message: `Kamu memiliki ${retakeCourses.length} MK yang perlu diulang: ${names}${more}. Prioritaskan MK ini agar IPK dan SKS kamu meningkat.`,
        })
      }
    }

    // [4] Prediksi lulus terlambat
    if (summary.predicted_graduation_semester > effectiveRule.normal_semester + 2) {
      const title = 'Risiko Lulus Terlambat'
      if (!recentTitles.has(title)) {
        generated.push({
          title,
          message: `Berdasarkan progres saat ini, kamu diprediksi lulus di Semester ${summary.predicted_graduation_semester}, melebihi waktu normal (Semester ${effectiveRule.normal_semester}). Tingkatkan jumlah SKS per semester untuk mempercepat kelulusan.`,
        })
      }
    }

    // [5] SKS per semester kurang dari minimum (jika ada data)
    if (grades.length > 0 && currentSemester > 0) {
      const avgSksPerSem = Math.round(summary.total_sks_earned / currentSemester)
      if (avgSksPerSem < effectiveRule.min_sks_per_semester) {
        const title = 'Rata-rata SKS Per Semester Rendah'
        if (!recentTitles.has(title)) {
          generated.push({
            title,
            message: `Rata-rata SKS yang kamu ambil per semester adalah ${avgSksPerSem} SKS, di bawah minimum ${effectiveRule.min_sks_per_semester} SKS. Pertimbangkan untuk mengambil lebih banyak MK semester depan.`,
          })
        }
      }
    }

    // [6] Target tercapai — motivasi positif
    if (grades.length > 0 && summary.academic_status === 'ahead') {
      const title = 'Prestasi: Progres SKS Melebihi Target!'
      if (!recentTitles.has(title)) {
        generated.push({
          title,
          message: `Selamat! Progres SKS kamu (${summary.total_sks_earned} SKS) melebihi target untuk semester ini. Pertahankan semangat belajarmu dan terus tingkatkan IPK!`,
        })
      }
    }

    // [7] Jika tidak ada nilai sama sekali
    if (grades.length === 0) {
      const title = 'Mulai Input Nilai Akademik'
      if (!recentTitles.has(title)) {
        generated.push({
          title,
          message: `Kamu belum memasukkan nilai akademik. Input nilai mata kuliah kamu agar Gradely bisa memantau progres dan memberikan analisis akademik yang akurat.`,
        })
      }
    }

    // Insert semua notifikasi yang di-generate
    if (generated.length > 0) {
      await serviceClient.from('notifications').insert(
        generated.map(n => ({
          user_id: user.id,
          title: n.title,
          message: n.message,
          is_read: false,
        }))
      )
    }

    return NextResponse.json<ApiResponse>({
      data: { generated: generated.length, notifications: generated },
      error: null,
      success: true,
    })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}
