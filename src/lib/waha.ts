import { createServiceClient } from '@/lib/supabase/server'

export interface FonnteSettings {
  fonnte_token: string
}

export type WahaSettings = FonnteSettings

export interface SendMessagePayload {
  phone: string
  message: string
  recipientId?: string
}

export interface SendMessageResult {
  success: boolean
  error?: string
}

export async function getWahaSettings(universityId: string): Promise<FonnteSettings | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .eq('university_id', universityId)
    .in('key', ['fonnte_token'])

  if (!data || data.length === 0) return null
  const map = Object.fromEntries(data.map((s) => [s.key, s.value]))
  if (!map['fonnte_token']) return null

  return { fonnte_token: map['fonnte_token'] }
}

export function normalizePhone(phone: string): string {
  let p = phone.replace(/\s+/g, '').replace(/-/g, '')
  if (p.startsWith('0')) p = '62' + p.slice(1)
  if (p.startsWith('+')) p = p.slice(1)
  return p
}

export async function sendWhatsAppMessage(
  settings: FonnteSettings,
  payload: SendMessagePayload
): Promise<SendMessageResult> {
  const target = normalizePhone(payload.phone)

  try {
    const body = new URLSearchParams()
    body.append('target', target)
    body.append('message', payload.message)

    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: settings.fonnte_token,
      },
      body,
      signal: AbortSignal.timeout(15000),
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok || json.status === false) {
      return { success: false, error: json.reason ?? json.message ?? `Fonnte error ${res.status}` }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Koneksi ke Fonnte gagal' }
  }
}

export async function logWhatsAppMessage(
  recipientId: string | null,
  phone: string,
  message: string,
  result: SendMessageResult,
  universityId?: string
) {
  const supabase = createServiceClient()
  await supabase.from('whatsapp_logs').insert({
    recipient_id: recipientId ?? null,
    phone_number: phone,
    message,
    status: result.success ? 'sent' : 'failed',
    error_message: result.error ?? null,
    sent_at: result.success ? new Date().toISOString() : null,
    university_id: universityId ?? null,
  })
}

export async function sendAndLog(
  universityId: string,
  payload: SendMessagePayload
): Promise<SendMessageResult> {
  const settings = await getWahaSettings(universityId)
  if (!settings) {
    const err = 'Konfigurasi Fonnte belum diatur'
    await logWhatsAppMessage(payload.recipientId ?? null, payload.phone, payload.message, { success: false, error: err }, universityId)
    return { success: false, error: err }
  }

  const result = await sendWhatsAppMessage(settings, payload)
  await logWhatsAppMessage(payload.recipientId ?? null, payload.phone, payload.message, result, universityId)
  return result
}

export const messageTemplates = {
  academicWarning: (studentName: string, ipk: number, semester: number) =>
    `Halo ${studentName}, ini adalah notifikasi dari Gradely.\n\nIPK kamu saat ini ${ipk.toFixed(2)} pada semester ${semester}. Segera konsultasikan dengan dosen wali untuk perbaikan akademik.\n\n_Pesan otomatis dari Gradely_`,

  graduationTarget: (studentName: string, targetSemester: number, remainingSks: number) =>
    `Halo ${studentName},\n\nTarget kelulusan kamu adalah semester ${targetSemester}. Sisa SKS yang perlu ditempuh: ${remainingSks} SKS.\n\nSemangat!\n\n_Pesan otomatis dari Gradely_`,

  semesterReminder: (studentName: string, semester: number, academicYear: string) =>
    `Halo ${studentName},\n\nPengingat: Semester ${semester} tahun ajaran ${academicYear} segera dimulai. Pastikan kamu telah mengisi KRS dan memperbarui data akademik di Gradely.\n\n_Pesan otomatis dari Gradely_`,

  testMessage: () =>
    `Halo! Ini adalah pesan uji coba dari Gradely.\n\nKoneksi Fonnte berhasil!\n\n_Gradely Academic Monitoring_`,
}
