"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { LayoutList, LayoutGrid, Users, UserPlus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, getInitials } from "@/lib/utils"

type StudyProgram = { id: string; name: string; short_name: string | null }

type Lecturer = {
  id: string
  full_name: string
  email: string
  phone: string | null
  is_active: boolean
  created_at: string
  avatar_url: string | null
  join_code: string | null
  study_programs: StudyProgram | StudyProgram[] | null
}

interface LecturersViewProps {
  lecturers: Lecturer[]
  advisorCounts: Record<string, number>
  count: number
  page: number
  totalPages: number
  search?: string
}

export function LecturersView({ lecturers, advisorCounts, count, page, totalPages, search }: LecturersViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [view, setView] = React.useState<"list" | "grid">("list")
  const [searchValue, setSearchValue] = React.useState(search ?? "")
  const isFirstRender = React.useRef(true)

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchValue) {
        params.set("search", searchValue)
      } else {
        params.delete("search")
      }
      params.delete("page")
      router.replace(`${pathname}?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue])

  function handleReset() {
    setSearchValue("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    params.delete("page")
    router.replace(`${pathname}?${params.toString()}`)
  }

  function buildPageUrl(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(p))
    return `${pathname}?${params.toString()}`
  }

  function getStudyProgram(lecturer: Lecturer) {
    const sp = Array.isArray(lecturer.study_programs) ? lecturer.study_programs[0] : lecturer.study_programs
    return sp as StudyProgram | null
  }

  const statusBadge = (active: boolean) => (
    <Badge
      variant="outline"
      className={`whitespace-nowrap text-xs ${active ? "text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800" : "text-muted-foreground"}`}
    >
      {active ? "Aktif" : "Nonaktif"}
    </Badge>
  )

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dosen Wali</h1>
          <p className="text-sm text-muted-foreground">{count} dosen terdaftar</p>
        </div>
        <Button asChild size="sm" className="shrink-0 self-start sm:self-auto">
          <Link href="/admin/users/lecturers/new">
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah Dosen
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 items-center w-full sm:max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Cari nama atau email..."
              className="pl-8 pr-8"
            />
            {searchValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={handleReset}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 border rounded-md p-1 self-start">
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setView("list")}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <Card className="overflow-hidden">
          <CardHeader className="px-4 py-3 sm:px-6 border-b">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Menampilkan {lecturers.length} dari {count} dosen
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4 sm:pl-6 min-w-[200px]">Dosen</TableHead>
                    <TableHead className="min-w-[130px]">Program Studi</TableHead>
                    <TableHead className="min-w-[130px]">No. HP</TableHead>
                    <TableHead className="min-w-[100px]">Mahasiswa</TableHead>
                    <TableHead className="min-w-[110px]">Kode Join</TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                    <TableHead className="min-w-[110px]">Terdaftar</TableHead>
                    <TableHead className="pr-4 sm:pr-6 text-right min-w-[70px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lecturers.length > 0 ? (
                    lecturers.map((lecturer) => {
                      const sp = getStudyProgram(lecturer)
                      const studentCount = advisorCounts[lecturer.id] ?? 0
                      return (
                        <TableRow key={lecturer.id}>
                          <TableCell className="pl-4 sm:pl-6">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={lecturer.avatar_url ?? ""} />
                                <AvatarFallback className="text-xs">{getInitials(lecturer.full_name)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate max-w-[160px]">{lecturer.full_name}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[160px]">{lecturer.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{sp?.short_name ?? "-"}</TableCell>
                          <TableCell className="text-sm">{lecturer.phone ?? "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-sm font-medium">{studentCount}</span>
                              <span className="text-xs text-muted-foreground">mahasiswa</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lecturer.join_code ? (
                              <Badge variant="outline" className="font-mono text-xs tracking-widest text-violet-600 border-violet-300 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400">
                                {lecturer.join_code}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Belum dibuat</span>
                            )}
                          </TableCell>
                          <TableCell>{statusBadge(lecturer.is_active)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(lecturer.created_at)}</TableCell>
                          <TableCell className="pr-4 sm:pr-6 text-right">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/admin/users/lecturers/${lecturer.id}`}>Detail</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                        {search ? "Tidak ada dosen yang cocok." : "Belum ada dosen terdaftar."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-4">Menampilkan {lecturers.length} dari {count} dosen</p>
          {lecturers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lecturers.map((lecturer) => {
                const sp = getStudyProgram(lecturer)
                const studentCount = advisorCounts[lecturer.id] ?? 0
                return (
                  <Card key={lecturer.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={lecturer.avatar_url ?? ""} />
                            <AvatarFallback>{getInitials(lecturer.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-semibold truncate">{lecturer.full_name}</CardTitle>
                            <CardDescription className="text-xs truncate">{lecturer.email}</CardDescription>
                          </div>
                        </div>
                        {statusBadge(lecturer.is_active)}
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 pt-0 flex-1">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Program Studi</p>
                          <p className="font-medium truncate">{sp?.short_name ?? "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">No. HP</p>
                          <p className="font-medium truncate">{lecturer.phone ?? "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mahasiswa</p>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <p className="font-medium">{studentCount}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Terdaftar</p>
                          <p className="font-medium">{formatDate(lecturer.created_at)}</p>
                        </div>
                      </div>
                      {lecturer.join_code && (
                        <Badge variant="outline" className="font-mono text-xs tracking-widest text-violet-600 border-violet-300 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400 self-start">
                          {lecturer.join_code}
                        </Badge>
                      )}
                      <Button asChild variant="outline" size="sm" className="mt-auto w-full">
                        <Link href={`/admin/users/lecturers/${lecturer.id}`}>Lihat Detail</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {search ? "Tidak ada dosen yang cocok." : "Belum ada dosen terdaftar."}
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pb-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={buildPageUrl(page - 1)}>Sebelumnya</Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</span>
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link href={buildPageUrl(page + 1)}>Berikutnya</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
