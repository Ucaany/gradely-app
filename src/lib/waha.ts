import { createServiceClient } from '@/lib/supabase/server'

export interface WahaSettings {
  waha_url: string
  waha_session: string
  waha_api_key?: string
}

export interface SendMessagePayload {
  phone: string
  message: string
  recipientId?: string
}

export interface SendMessageResult {
  success: boolean
  error?: string
}

export async function getWahaSettings(universityId: string): Promise<WahaSettings | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .eq('university_id', universityId)
    .in('key', ['waha_url', 'waha_session', 'waha_api_key'])

  if (!data || data.length === 0) return null

  const map = Object.fromEntries(data.map((s) => [s.key, s.value]))
  if (!map['waha_url'] || !map['waha_session']) return null

  return {
    waha_url: map['waha_url'],
    waha_session: map['waha_session'],
    waha_api_key: map['waha_api_key'] ?? undefined,
  }
}

export function normalizePhone(phone: string): string {
  let p = phone.replace(/\s+/g, '').replace(/-/g, '')
  if (p.startsWith('0')) p = '62' + p.slice(1)
  if (p.startsWith('+')) p = p.slice(1)
  if (!p.endsWith('@c.us')) p = p + '@c.us'
  return p
}

export async function sendWhatsAppMessage(
  settings: WahaSettings,
  payload: SendMessagePayload
): Promise<SendMessageResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (settings.waha_api_key) headers['X-Api-Key'] = settings.waha_api_key

  const chatId = normalizePhone(payload.phone)

  try {
    const res = await fetch(
      `${settings.waha_url}/api/sendText`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          session: settings.waha_session,
          chatId,
          text: payload.message,
        }),
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) {
      const body = await res.text()
      return { success: false, error: `WAHA error ${res.status}: ${body}` }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Koneksi ke WAHA gagal' }
  }
}

export async function logWhatsAppMessage(
  recipientId: string | null,
  phone: string,
  message: string,
  result: SendMessageResult
) {
  const supabase = createServiceClient()
  await supabase.from('whatsapp_logs').insert({
    recipient_id: recipientId ?? null,
    phone_number: phone,
    message,
    status: result.success ? 'sent' : 'failed',
    error_message: result.error ?? null,
    sent_at: result.success ? new Date().toISOString() : null,
  })
}

export async function sendAndLog(
  universityId: string,
  payload: SendMessagePayload
): Promise<SendMessageResult> {
  const settings = await getWahaSettings(universityId)
  if (!settings) {
    const err = 'Konfigurasi WAHA belum diatur'
    await logWhatsAppMessage(payload.recipientId ?? null, payload.phone, payload.message, { success: false, error: err })
    return { success: false, error: err }
  }

  const result = await sendWhatsAppMessage(settings, payload)
  await logWhatsAppMessage(payload.recipientId ?? null, payload.phone, payload.message, result)
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
    `Halo! Ini adalah pesan uji coba dari Gradely.\n\nKoneksi WAHA berhasil!\n\n_Gradely Academic Monitoring_`,
}
