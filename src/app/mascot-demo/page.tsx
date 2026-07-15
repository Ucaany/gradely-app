'use client'

/**
 * /mascot-demo — Halaman showcase interaktif untuk semua komponen mascot.
 * Digunakan sebagai referensi visual tim dan untuk presentasi ke stakeholder.
 * HAPUS atau lindungi dengan auth di production.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  MascotDecorator,
  EmptyState,
  FormSuccessBanner,
  FormFieldWithMascot,
  MascotHelpFloat,
  UserSettingsMascot,
  type MascotAssetId,
  type FieldValidationState,
} from '@/components/mascot'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const ALL_ASSETS: MascotAssetId[] = [
  'mascot-angry-stand',
  'mascot-angry-watch',
  'mascot-crawling',
  'mascot-cycling',
  'mascot-idea-clipboard',
  'mascot-idle-neutral',
  'mascot-phone-thinking',
  'mascot-running-document',
  'mascot-sitting-reading',
]

const HELP_TIPS = [
  {
    title: 'NIM',
    body: 'Nomor Induk Mahasiswa terdiri dari 10 digit. Pastikan tidak ada spasi atau karakter khusus.',
  },
  {
    title: 'IPK',
    body: 'Masukkan IPK dalam format desimal, misalnya 3.75. Nilai maksimal adalah 4.00.',
  },
  {
    title: 'Semester',
    body: 'Pilih semester aktif saat ini. Jika ragu, periksa portal akademik resmi universitas kamu.',
  },
]

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  note,
  children,
}: {
  title: string
  note: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="border-b border-border pb-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MascotDemoPage() {
  // State untuk demo FormFieldWithMascot
  const [emailState, setEmailState] = useState<FieldValidationState>('idle')
  const [emailMsg, setEmailMsg]     = useState<string | undefined>()

  // State untuk demo FormSuccessBanner
  const [showBanner, setShowBanner] = useState(false)

  // State untuk demo UserSettingsMascot
  const [completion, setCompletion] = useState(45)

  function simulateEmailValidation(value: string) {
    if (!value) {
      setEmailState('idle')
      setEmailMsg(undefined)
      return
    }
    if (!value.includes('@')) {
      setEmailState('error')
      setEmailMsg('Format email tidak valid. Contoh: nama@kampus.ac.id')
      return
    }
    if (!value.endsWith('.ac.id') && !value.endsWith('.com')) {
      setEmailState('warning')
      setEmailMsg('Pastikan kamu menggunakan email institusi kamu.')
      return
    }
    setEmailState('success')
    setEmailMsg('Email valid dan siap digunakan.')
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="mx-auto max-w-3xl space-y-14 px-6 py-12">

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Mascot Demo</h1>
          <p className="text-sm text-muted-foreground">
            Showcase interaktif semua komponen mascot. Hapus halaman ini atau lindungi dengan middleware auth sebelum deploy ke production.
          </p>
        </div>

        {/* ─── 0. MascotDecorator — Asset Grid ─── */}
        <Section
          title="0 · MascotDecorator — Asset Grid"
          note="Semua 9 aset SVG tersedia. Gunakan prop size (sm/md/lg), state, dan animate."
        >
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
            {ALL_ASSETS.map((id) => (
              <div
                key={id}
                className="flex flex-col items-center gap-2 rounded-lg border border-border/60 bg-card p-3"
              >
                <MascotDecorator assetId={id} size="md" state="idle" />
                <span className="text-center text-[10px] text-muted-foreground leading-tight">
                  {id.replace('mascot-', '')}
                </span>
              </div>
            ))}
          </div>

          {/* Demo ukuran */}
          <div className="flex flex-wrap items-end gap-4 pt-2">
            {(['sm', 'md', 'lg'] as const).map((s) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <MascotDecorator assetId="mascot-idle-neutral" size={s} state="idle" />
                <span className="text-[10px] text-muted-foreground">{s}</span>
              </div>
            ))}
          </div>

          {/* Demo state glow */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {(['idle', 'success', 'error', 'warning', 'info'] as const).map((st) => (
              <div key={st} className="flex flex-col items-center gap-1">
                <MascotDecorator assetId="mascot-idle-neutral" size="sm" state={st} />
                <span className="text-[10px] text-muted-foreground">{st}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ─── 1. FormFieldWithMascot ─── */}
        <Section
          title="1 · FormFieldWithMascot — Inline Validation Feedback"
          note="UX: Mengalihkan framing error dari 'kamu salah' menjadi 'ayo kita pikirkan bersama'. Ketik email untuk simulasi."
        >
          <FormFieldWithMascot
            label="Alamat Email"
            fieldId="demo-email"
            validationState={emailState}
            message={emailMsg}
            required
            placeholder="mahasiswa@kampus.ac.id"
            onChange={(e) => simulateEmailValidation(e.target.value)}
            className="max-w-md"
          />
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => { setEmailState('error');   setEmailMsg('Format email tidak valid.') }}>
              Simulasi Error
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEmailState('success'); setEmailMsg('Email valid!') }}>
              Simulasi Success
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEmailState('warning'); setEmailMsg('Gunakan email institusi kamu.') }}>
              Simulasi Warning
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEmailState('idle'); setEmailMsg(undefined) }}>
              Reset
            </Button>
          </div>
        </Section>

        {/* ─── 2. EmptyState ─── */}
        <Section
          title="2 · EmptyState — Layar Kosong"
          note="UX: Mengurangi disorientasi pengguna saat tidak ada data. Maskot berubah sesuai konteks."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <EmptyState
              variant="default"
              title="Belum Ada Data"
              description="Data kamu akan muncul di sini setelah kamu mulai menambahkan informasi."
              action={<Button size="sm">Tambah Data</Button>}
            />
            <EmptyState
              variant="search"
              title="Hasil Tidak Ditemukan"
              description="Coba periksa ejaan atau gunakan kata kunci yang berbeda."
            />
            <EmptyState
              variant="error"
              title="Gagal Memuat Data"
              description="Terjadi kesalahan saat mengambil data. Coba refresh halaman."
              action={<Button size="sm" variant="outline">Coba Lagi</Button>}
            />
            <EmptyState
              variant="activity"
              title="Belum Ada Aktivitas"
              description="Ayo mulai perjalanan akademikmu! Tambahkan mata kuliah pertamamu."
              action={<Button size="sm">Mulai Sekarang</Button>}
            />
          </div>
        </Section>

        {/* ─── 3. FormSuccessBanner ─── */}
        <Section
          title="3 · FormSuccessBanner — Perayaan Post-Submit"
          note="UX: Mengaktifkan dopamine reward loop saat pengguna berhasil submit form. Auto-dismiss dalam 6 detik."
        >
          <FormSuccessBanner
            visible={showBanner}
            title="Data Berhasil Disimpan!"
            description="Perubahan profil kamu sudah kami catat. Halaman akan diperbarui otomatis."
            onDismiss={() => setShowBanner(false)}
          />
          <Button
            size="sm"
            onClick={() => setShowBanner(true)}
            disabled={showBanner}
            className="w-fit"
          >
            Simulasi Submit Form
          </Button>
        </Section>

        {/* ─── 4. MascotHelpFloat ─── */}
        <Section
          title="4 · MascotHelpFloat — Floating Contextual Helper"
          note="UX: Mengurangi form fatigue pada form kompleks. Lihat tombol mengambang di pojok kanan bawah."
        >
          <p className="text-xs text-muted-foreground">
            Komponen ini dirender sebagai <code className="rounded bg-muted px-1 py-0.5 text-xs">position: fixed</code> di pojok kanan bawah layar. Klik ikon maskot kuning di bawah kanan untuk mencobanya.
          </p>
          <MascotHelpFloat tips={HELP_TIPS} panelTitle="Tips Pengisian Form" />
        </Section>

        {/* ─── 5. UserSettingsMascot ─── */}
        <Section
          title="5 · UserSettingsMascot — Personalized Settings Header"
          note="UX: Mengubah halaman settings yang dingin menjadi pengalaman personal. Maskot berubah sesuai waktu & kelengkapan profil."
        >
          <UserSettingsMascot
            userName="Budi Santoso"
            userRole="student"
            profileCompletion={completion}
          />
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Simulasi completion:</span>
            {[30, 65, 90, 100].map((val) => (
              <Button
                key={val}
                size="sm"
                variant={completion === val ? 'default' : 'outline'}
                onClick={() => setCompletion(val)}
              >
                {val}%
              </Button>
            ))}
          </div>
        </Section>

        {/* Spacer bawah agar MascotHelpFloat tidak overlap konten */}
        <div className="h-20" />
      </div>
    </div>
  )
}
